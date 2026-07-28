import React, { useRef, useState, useEffect, useCallback } from 'react';
import Header from './Header';
import MapComponent from './MapComponent';
import FireList from './FireList';
import PredictionPanel from './PredictionPanel';
import PredictionTimeline from './PredictionTimeline';
import LayersControl from './LayersControl';
import { fetchRealTimeFireData } from '../services/fireApiDirect';
import { fetchSatelliteData } from '../services/satelliteApiDirect';
import { fetchPredictionIndex, fetchFirePrediction } from '../services/predictionsApi';
import { normalizeFireName } from '../utils/helpers';

const FORECAST_HOURS = 24;
const PLAYBACK_INTERVAL_MS = 800;

const WildfireDashboard = () => {
  const mapRef = useRef();
  // State management
  const [fires, setFires] = useState([]);
  const [selectedFire, setSelectedFire] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [mapLayer, setMapLayer] = useState('standard');
  const [dataError, setDataError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [firePredictionData, setFirePredictionData] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showPredictionMarkers, setShowPredictionMarkers] = useState(false);
  const [predictionIndex, setPredictionIndex] = useState({ generatedAt: null, fires: [] });
  const [firePredictionAvailability, setFirePredictionAvailability] = useState({});
  const [currentHour, setCurrentHour] = useState(FORECAST_HOURS);
  const [isPlaying, setIsPlaying] = useState(false);

  // Satellite data state
  const [satelliteLayers, setSatelliteLayers] = useState({
    viirs: {
      enabled: false,
      data: []
    },
    modis: {
      enabled: false,
      data: []
    },
    viewMode: 'markers' // 'markers' or 'heatmap'
  });

  const [isLoadingSatelliteData, setIsLoadingSatelliteData] = useState({
    viirs: false,
    modis: false
  });

  const loadFireData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setDataError(null);
      const realTimeFireData = await fetchRealTimeFireData();
      setFires(realTimeFireData);
      console.log('Fire data loaded successfully:', realTimeFireData.length, 'fires');
    } catch (error) {
      console.error('Failed to load real-time fire data:', error);
      setDataError(error.message);
      setFires([]);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const loadSatelliteData = useCallback(async () => {
    try {
              // Load VIIRS data
        setIsLoadingSatelliteData(prev => ({ ...prev, viirs: true }));
        const viirsData = await fetchSatelliteData('VIIRS');

        // Load MODIS data
        setIsLoadingSatelliteData(prev => ({ ...prev, modis: true }));
        const modisData = await fetchSatelliteData('MODIS');

      setSatelliteLayers(prev => ({
        ...prev,
        viirs: {
          ...prev.viirs,
          data: viirsData
        },
        modis: {
          ...prev.modis,
          data: modisData
        }
      }));

      console.log('Satellite data loaded successfully:', {
        viirs: viirsData.length,
        modis: modisData.length
      });
    } catch (error) {
      console.error('Failed to load satellite data:', error);
      // Don't set dataError for satellite data as it's supplementary
    } finally {
      setIsLoadingSatelliteData({
        viirs: false,
        modis: false
      });
    }
  }, []);

  // Load the site-wide index of which fires currently have an arrival_run
  // forecast (frontend/public/data/predictions/index.json).
  const loadPredictionIndex = useCallback(async () => {
    const index = await fetchPredictionIndex();
    setPredictionIndex(index);
  }, []);

  // Load fire prediction GeoJSON (observed perimeter + 24 hourly isochrone
  // rings) for the selected fire.
  const loadFirePrediction = useCallback(async (fire) => {
    if (!fire) {
      setFirePredictionData(null);
      return;
    }

    setPredictionLoading(true);
    try {
      const featureCollection = await fetchFirePrediction(fire.name);
      if (featureCollection && featureCollection.features && featureCollection.features.length > 0) {
        console.log(`Loaded prediction for ${fire.name}:`, featureCollection.features.length, 'features');
        setFirePredictionData(featureCollection);
        setCurrentHour(FORECAST_HOURS);
        setIsPlaying(false);
      } else {
        console.log(`No prediction data available for ${fire.name}`);
        setFirePredictionData(null);
      }
    } catch (error) {
      console.error(`Failed to load prediction data for ${fire.name}:`, error);
      setFirePredictionData(null);
    } finally {
      setPredictionLoading(false);
    }
  }, []);

  // Clear prediction data when no fire is selected
  const clearFirePrediction = useCallback(() => {
    setFirePredictionData(null);
    setShowPredictionMarkers(false);
    setCurrentHour(FORECAST_HOURS);
    setIsPlaying(false);
  }, []);

  // Derive which fires currently have a forecast from the site-wide index,
  // rather than probing each fire individually (the old per-fire CSV check).
  useEffect(() => {
    const availableNames = new Set(predictionIndex.fires.map((f) => f.name));
    const next = {};
    fires.forEach((fire) => {
      next[fire.id] = availableNames.has(normalizeFireName(fire.name));
    });
    setFirePredictionAvailability(next);
  }, [fires, predictionIndex]);

  // Toggle the prediction isochrones on the map
  const handleTogglePrediction = useCallback(() => {
    if (firePredictionData && firePredictionData.features && firePredictionData.features.length > 0) {
      setShowPredictionMarkers(prev => !prev);
    }
  }, [firePredictionData]);

  // Timeline scrub: jump to an hour, pausing any playback in progress.
  const handleScrub = useCallback((hour) => {
    setIsPlaying(false);
    setCurrentHour(hour);
  }, []);

  // Timeline play/pause: starting from the end restarts from hour 1.
  const handleTogglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (!prev) {
        setCurrentHour(h => (h >= FORECAST_HOURS ? 1 : h));
        return true;
      }
      return false;
    });
  }, []);

  // Advance currentHour on an interval while playing; stop at the end.
  useEffect(() => {
    if (!isPlaying) return undefined;
    const interval = setInterval(() => {
      setCurrentHour(prev => {
        if (prev >= FORECAST_HOURS) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAYBACK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Load fire data on component mount
  useEffect(() => {
    loadFireData();
    loadSatelliteData();
    loadPredictionIndex();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array since these functions are stable

  const handleFireClick = useCallback(async (fire) => {
    console.log('handleFireClick called with:', fire);
    setSelectedFire(fire);
    setLoading(true);
    setShowPrediction(true);

    // Clear previous prediction data
    clearFirePrediction();

    // Zoom to fire perimeter
    if (fire && fire.geometry && mapRef.current && mapRef.current.zoomToFire) {
      console.log('Attempting to zoom to fire:', fire.name);
      mapRef.current.zoomToFire(fire);
    } else {
      console.log('No geometry found for fire or mapRef not ready:', fire);
    }

    // Load fire prediction data (no await since we don't want to block the UI)
    loadFirePrediction(fire);

    // No longer need the old prediction API call since we removed the 24-hour prediction box
    setPrediction(null);
    setLoading(false);
  }, [loadFirePrediction, clearFirePrediction]);
  // Handle satellite layer toggle
  const handleLayerToggle = useCallback((satellite) => {
    setSatelliteLayers(prev => ({
      ...prev,
      [satellite]: {
        ...prev[satellite],
        enabled: !prev[satellite].enabled
      }
    }));
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode) => {
    setSatelliteLayers(prev => ({
      ...prev,
      viewMode: mode
    }));
  }, []);

  const showTimeline = showPredictionMarkers && firePredictionData && firePredictionData.features.length > 0;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Map section */}
        <div className="flex-1 relative">
          <MapComponent
            ref={mapRef}
            fires={fires}
            mapLayer={mapLayer}
            onFireClick={handleFireClick}
            satelliteLayers={satelliteLayers}
            firePredictionData={showPredictionMarkers ? firePredictionData : null}
            currentHour={currentHour}
            predictionAvailability={firePredictionAvailability}
          />

          <FireList
            fires={fires}
            handleFireClick={handleFireClick}
            isLoadingData={isLoadingData}
            dataError={dataError}
            firePredictionAvailability={firePredictionAvailability}
          />

          {/* Layers Control */}
          <LayersControl
            mapLayer={mapLayer}
            onMapLayerChange={setMapLayer}
            satelliteLayers={satelliteLayers}
            onLayerToggle={handleLayerToggle}
            onViewModeChange={handleViewModeChange}
            isLoadingSatelliteData={isLoadingSatelliteData}
          />

          {showTimeline && (
            <PredictionTimeline
              featureCollection={firePredictionData}
              currentHour={currentHour}
              hours={FORECAST_HOURS}
              isPlaying={isPlaying}
              onScrub={handleScrub}
              onTogglePlay={handleTogglePlay}
            />
          )}
        </div>

        {/* Prediction panel */}
        <PredictionPanel
          showPrediction={showPrediction}
          setShowPrediction={setShowPrediction}
          loading={loading}
          selectedFire={selectedFire}
          prediction={prediction}
          firePredictionData={firePredictionData}
          predictionLoading={predictionLoading}
          onTogglePrediction={handleTogglePrediction}
          showPredictionMarkers={showPredictionMarkers}
        />
      </div>
    </div>
  );
};

export default WildfireDashboard;
