import React, { useRef, useState, useEffect, useCallback } from 'react';
import Header from './Header';
import MapComponent from './MapComponent';
import FireList from './FireList';
import PredictionPanel from './PredictionPanel';
import LayersControl from './LayersControl';
import { fetchRealTimeFireData, fetchPrediction } from '../services/fireApi';
import { fetchSatelliteData } from '../services/satelliteApi';
import { loadFirePredictionCSV } from '../utils/helpers';

const WildfireDashboard = () => {
  const mapRef = useRef();
  // State management
  const [fires, setFires] = useState([]);
  const [selectedFire, setSelectedFire] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [mapLayer, setMapLayer] = useState('satellite');
  const [dataError, setDataError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [firePredictionData, setFirePredictionData] = useState(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [showPredictionMarkers, setShowPredictionMarkers] = useState(false);

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

  // Load fire prediction data for selected fire
  const loadFirePrediction = useCallback(async (fire) => {
    if (!fire) {
      setFirePredictionData(null);
      return;
    }

    // Check if fire is too small
    if (fire.size < 100) {
      setFirePredictionData(null);
      return;
    }

    setPredictionLoading(true);
    try {
      const csvData = await loadFirePredictionCSV(fire.name);
      if (csvData && csvData.length > 0) {
        console.log(`Loaded prediction data for ${fire.name}:`, csvData.length, 'points');
        setFirePredictionData(csvData);
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
  }, []);

  // Toggle prediction markers on map
  const handleTogglePrediction = useCallback(() => {
    if (firePredictionData && firePredictionData.length > 0) {
      setShowPredictionMarkers(prev => !prev);
    }
  }, [firePredictionData]);

  // Load fire data on component mount
  useEffect(() => {
    loadFireData();
    loadSatelliteData();
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



  const refreshData = useCallback(async () => {
    await Promise.all([
      loadFireData(),
      loadSatelliteData()
    ]);
  }, [loadFireData, loadSatelliteData]);

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

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <Header 
        mapLayer={mapLayer}
        setMapLayer={setMapLayer}
        refreshData={refreshData}
        isLoadingData={isLoadingData}
      />

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
          />
          
          <FireList 
            fires={fires}
            handleFireClick={handleFireClick}
            isLoadingData={isLoadingData}
            dataError={dataError}
          />

          {/* Layers Control */}
          <LayersControl
            satelliteLayers={satelliteLayers}
            onLayerToggle={handleLayerToggle}
            onViewModeChange={handleViewModeChange}
            isLoadingSatelliteData={isLoadingSatelliteData}
          />
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