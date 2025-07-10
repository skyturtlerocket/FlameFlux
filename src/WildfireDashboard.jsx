import React, { useState, useEffect, useRef } from 'react';
import { Flame, AlertTriangle, Calendar, Thermometer, Wind, Eye, X, RefreshCw } from 'lucide-react';

// ========================================================================================================================================
// Sample fire data
// ========================================================================================================================================
// We would realistically import fire data through JSON, this example is in JSON format right now
// ========================================================================================================================================
// Real-time fire data fetching and processing
// ========================================================================================================================================

const calculatePolygonCenter = (coordinates, geomType) => {
  let allCoords = [];
  
  if (geomType === "Polygon") {
    allCoords = coordinates[0]; // outer ring
  } else if (geomType === "MultiPolygon") {
    for (let polygon of coordinates) {
      allCoords = allCoords.concat(polygon[0]); // outer ring of each polygon
    }
  }
  
  if (allCoords.length === 0) return null;
  
  // Simple centroid calculation
  const lngSum = allCoords.reduce((sum, coord) => sum + coord[0], 0);
  const latSum = allCoords.reduce((sum, coord) => sum + coord[1], 0);
  
  return {
    lng: lngSum / allCoords.length,
    lat: latSum / allCoords.length
  };
};

const getSeverityFromSize = (acres) => {
  if (acres >= 10000) return "High";
  if (acres >= 1000) return "Medium";
  return "Low";
};

const formatEpochToDateTime = (epochMs) => {
  if (!epochMs) return null;
  const date = new Date(epochMs);
  return date.toISOString();
};

const getLatestFiresByName = (features) => {
  const fireMap = new Map();
  
  features.forEach(feature => {
    const name = feature.properties.incident_name;
    const dateMs = feature.properties.poly_DateCurrent || 0;
    
    if (!fireMap.has(name) || dateMs > fireMap.get(name).properties.poly_DateCurrent) {
      fireMap.set(name, feature);
    }
  });
  
  return Array.from(fireMap.values());
};

const fetchRealTimeFireData = async () => {
  const apiUrl = "https://rdipowerplatformfd-e5hhgqaahef7fbdr.a02.azurefd.net/incidents/perimeters-gj.json";

    console.log("Fetching real-time fire data...");
  
    const response = await fetch(apiUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.type !== 'FeatureCollection') {
      throw new Error('Invalid data format - expected FeatureCollection');
    }
    
    console.log(`Processing ${data.features?.length || 0} fire features...`);
    
    if (!data.features || data.features.length === 0) {
      console.log('No fire features found in API response');
      return [];
    }
    
    // Filter to get only the latest fire by name
    const latestFeatures = getLatestFiresByName(data.features);
    console.log(`Filtered to ${latestFeatures.length} latest fires`);
    
    const processedFires = latestFeatures.map((feature, index) => {
    const { geometry, properties } = feature;
    
    // Validate geometry
    if (!geometry || !geometry.coordinates) {
      console.warn(`Skipping feature ${index + 1}: No valid geometry`);
      return null;
    }
    
    // Calculate center point
    const center = calculatePolygonCenter(geometry.coordinates, geometry.type);
    if (!center) {
      console.warn(`Skipping feature ${index + 1}: No valid coordinates`);
      return null;
    }
    
    // Extract properties
    const name = properties.incident_name;
    const size = Math.round(properties.area_acres) || 0;
    const severity = getSeverityFromSize(size);
    const lastUpdate = formatEpochToDateTime(properties.poly_DateCurrent);
    
    return {
      id: properties.id || `fire_${index + 1}`,
      name: name,
      lat: center.lat,
      lng: center.lng,
      size: size,
      containment: properties.containment || null,
      severity: severity,
      lastUpdate: lastUpdate,
      weather: null, // Will be implemented later
      geometry: geometry // Store the geometry for polygon rendering
    };
  }).filter(fire => fire !== null); // Remove any null entries
  
  console.log(`Successfully processed ${processedFires.length} fires`);
  return processedFires;
};

// where the dashboard code starts
const WildfireDashboard = () => {
  //stuff with ui states
  const [fires, setFires] = useState([]);
  const [selectedFire, setSelectedFire] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [mapLayer, setMapLayer] = useState('satellite');
  const [dataError, setDataError] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polygonsRef = useRef([]);

  useEffect(() => {
    // Load real-time fire data when component mounts
    const loadFireData = async () => {
      try {
        setIsLoadingData(true);
        setDataError(null);
        const realTimeFireData = await fetchRealTimeFireData();
        setFires(realTimeFireData);
        console.log('Fire data loaded successfully:', realTimeFireData.length, 'fires');
      } catch (error) {
        console.error('Failed to load real-time fire data:', error);
        setDataError(error.message);
        setFires([]); // Set empty array on error
      } finally {
        setIsLoadingData(false);
      }
    };
  
    loadFireData();
    
    // loading leaflet and css
    const loadLeaflet = async () => {
      try {
        // adding css
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(link);
        }

        // loading leaflet
        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
          script.onload = () => {
            console.log('Leaflet loaded successfully');
            initializeMap();
          };
          script.onerror = () => {
            console.error('Failed to load Leaflet');
          };
          document.head.appendChild(script);
        } else {
          initializeMap();
        }
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };
    
    //starting the map for the user
    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      try {
        const L = window.L;
        
        // Initialize the map to be in San Francisco Bay Area
        // we could use the user's location in real production, but this is just a default location
        const map = L.map(mapRef.current, {
          center: [37.7749, -122.4194],
          zoom: 10,
          zoomControl: false
        });

        // add tile layers because leaflet doesn't have satellite on default
        const getTileUrl = (layer) => {
          switch (layer) {
            case 'satellite': //satellite
              return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
            case 'terrain': //terrain map
              return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
            default: //normal
              return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
          }
        };
        
        // credits to open street map
        const tileLayer = L.tileLayer(getTileUrl(mapLayer), {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // references
        mapInstanceRef.current = map;
        mapInstanceRef.current.tileLayer = tileLayer;

        // add the markers when fires are loaded
        if (fires.length > 0) {
          addFireMarkers(map, L);
        }

        // map resizing
        const resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(mapRef.current);

        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    loadLeaflet();
    
    // actually display ts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // change the tiles when the map type changes
  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.tileLayer) {
      const L = window.L;
      mapInstanceRef.current.removeLayer(mapInstanceRef.current.tileLayer);
      
      const getTileUrl = (layer) => {
        switch (layer) {
          case 'satellite':
            return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
          case 'terrain':
            return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
          default:
            return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        }
      };

      const newTileLayer = L.tileLayer(getTileUrl(mapLayer), {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstanceRef.current);

      mapInstanceRef.current.tileLayer = newTileLayer;
    }
  }, [mapLayer]);

  useEffect(() => {
    if (mapInstanceRef.current && window.L && fires.length > 0) {
      addFireMarkers(mapInstanceRef.current, window.L);
    }
  }, [fires]);

  const addFirePolygons = (map, L, fire) => {
    const { geometry } = fire;
    
    try {
      if (geometry.type === 'Polygon') {
        // For Polygon: coordinates[0] is the outer ring
        const coords = geometry.coordinates[0];
        
        // Validate coordinates array
        if (!coords || coords.length < 3) {
          console.warn('Invalid polygon coordinates for fire:', fire.name);
          return;
        }
        
        // Convert [lng, lat] to [lat, lng] and filter out invalid coordinates
        const leafletCoords = coords
          .filter(coord => Array.isArray(coord) && coord.length >= 2 && 
                  typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                  !isNaN(coord[0]) && !isNaN(coord[1]))
          .map(coord => [coord[1], coord[0]]);
        
        if (leafletCoords.length < 3) {
          console.warn('Not enough valid coordinates for polygon:', fire.name);
          return;
        }
        
        const polygon = L.polygon(leafletCoords, {
          color: '#ef4444',
          weight: 2,
          opacity: 0.8,
          fillColor: '#ef4444',
          fillOpacity: 0.2
        }).addTo(map);
        
        polygonsRef.current.push(polygon);
        
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygonCoords, index) => {
          const coords = polygonCoords[0]; // outer ring

          if (!coords || coords.length < 3) {
            console.warn(`Invalid polygon coordinates for fire ${fire.name}, polygon ${index}`);
            return;
          }
          

          const leafletCoords = coords
            .filter(coord => Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number' && !isNaN(coord[0]) && !isNaN(coord[1])) .map(coord => [coord[1], coord[0]]);
          
          if (leafletCoords.length < 3) {
            console.warn(`Not enough valid coordinates for polygon ${index} of fire:`, fire.name);
            return;
          }
          
          const polygon = L.polygon(leafletCoords, {
            color: '#ef4444',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ef4444',
            fillOpacity: 0.2
          }).addTo(map);
          
          polygonsRef.current.push(polygon);
        });
      }
    } catch (error) {
      console.error('Error adding fire polygon for', fire.name, ':', error);
    }
  };

  const getIconSizeForSeverity = (severity) => {
    switch (severity) {
      case 'High':
        return { size: 48, fontSize: '24px' };
      case 'Medium':
        return { size: 36, fontSize: '18px' };
      case 'Low':
      default:
        return { size: 24, fontSize: '12px' };
    }
  };

  const getSeverityBackgroundColor = (severity) => {
    switch (severity) {
      case 'High':
        return '#ef4444';
      case 'Medium':
        return '#f97316';
      case 'Low':
      default:
        return '#eab308';
    }
  };

  const addFireMarkers = (map, L) => {
    // clearing markers and polygons
    markersRef.current.forEach(marker => map.removeLayer(marker));
    polygonsRef.current.forEach(polygon => map.removeLayer(polygon));
    markersRef.current = [];
    polygonsRef.current = [];

    // markers for the fire
    fires.forEach(fire => {
      // Add polygon outlines
      addFirePolygons(map, L, fire);
      
      // Get icon size and background color based on severity
      const iconConfig = getIconSizeForSeverity(fire.severity);
      const backgroundColor = getSeverityBackgroundColor(fire.severity);
      
      // fire icon with dynamic sizing and color
      const fireIcon = L.divIcon({
        html: `<div style="
          background: ${backgroundColor};
          width: ${iconConfig.size}px;
          height: ${iconConfig.size}px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${iconConfig.fontSize};
          cursor: pointer;
        ">🔥</div>`,
        className: 'fire-marker',
        iconSize: [iconConfig.size, iconConfig.size],
        iconAnchor: [iconConfig.size / 2, iconConfig.size / 2],
        popupAnchor: [0, -iconConfig.size / 2]
      });
      
      // Add marker
      const marker = L.marker([fire.lat, fire.lng], { icon: fireIcon })
        .addTo(map)
        .bindPopup(`
          <div style="color: #374151; font-family: system-ui;">
            <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">${fire.name}</h3>
            <p style="margin: 2px 0;">Size: ${fire.size} acres</p>
            <p style="margin: 2px 0;">Containment: ${fire.containment ? `${fire.containment}%` : 'N/A'}</p>
            <p style="margin: 2px 0; color: ${getSeverityColorHex(fire.severity)}; font-weight: 600;">
              Severity: ${fire.severity}
            </p>
            <button onclick="window.selectFire('${fire.id}')" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 4px 8px;
              border-radius: 4px;
              margin-top: 8px;
              cursor: pointer;
              font-size: 12px;
            ">View Prediction</button>
          </div>
        `)
        .on('click', () => handleFireClick(fire));

      markersRef.current.push(marker);
    });
  };

  // make it global
  useEffect(() => {
    window.selectFire = (fireId) => {
      const fire = fires.find(f => f.id === fireId);
      if (fire) {
        handleFireClick(fire);
      }
    };
    
    return () => {
      delete window.selectFire;
    };
  }, [fires]);

  const getSeverityColorHex = (severity) => {
    switch (severity) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f97316';
      case 'Low': return '#eab308';
      default: return '#6b7280';
    }
  };
  
  // ========================================================================================================================================
  // This is where you would get the predictions from the model
  // right now its just all bullshit
  // ========================================================================================================================================
  const fetchPrediction = async (fireId, fireData) => {
    if (!fireData) {
      console.error('No fire data provided');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // some mock data, we would import this from the model in production
    const mockPrediction = {
      fireId: fireId,
      predictionDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estimatedSize: fireData.size * (1.2 + Math.random() * 0.8),
      confidence: Math.floor(Math.random() * 20) + 75,
      riskLevel: Math.random() > 0.5 ? 'High' : 'Critical',
      perimeter: [
        [fireData.lat + 0.01, fireData.lng + 0.01],
        [fireData.lat + 0.02, fireData.lng + 0.005],
        [fireData.lat + 0.015, fireData.lng - 0.01],
        [fireData.lat - 0.005, fireData.lng - 0.015],
        [fireData.lat - 0.01, fireData.lng + 0.005]
      ]
    };
    // then we display the predictions into the UI
    setPrediction(mockPrediction);
    setShowPrediction(true);
    setLoading(false);
  };

  const handleFireClick = (fire) => {
    setSelectedFire(fire);
    fetchPrediction(fire.id, fire);
    if (mapInstanceRef.current && window.L) {
      zoomToFire(fire);
    }
  };

  const zoomToFire = (fire) => {
    const map = mapInstanceRef.current;
    const L = window.L;
    
    try {
      if (fire.geometry) {
        const tempGroup = L.layerGroup();
        
        if (fire.geometry.type === 'Polygon') {
          const coords = fire.geometry.coordinates[0];
          if (coords && coords.length >= 3) {
            const leafletCoords = coords
              .filter(coord => Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number' && !isNaN(coord[0]) && !isNaN(coord[1])) .map(coord => [coord[1], coord[0]]);
            if (leafletCoords.length >= 3) {
              const polygon = L.polygon(leafletCoords);
              tempGroup.addLayer(polygon);
            }
          }
        } else if (fire.geometry.type === 'MultiPolygon') {
          fire.geometry.coordinates.forEach(polygonCoords => {
            const coords = polygonCoords[0];
            if (coords && coords.length >= 3) {
              const leafletCoords = coords
                .filter(coord => Array.isArray(coord) && coord.length >= 2 && typeof coord[0] === 'number' && typeof coord[1] === 'number' && !isNaN(coord[0]) && !isNaN(coord[1])) .map(coord => [coord[1], coord[0]]);
              if (leafletCoords.length >= 3) {
                const polygon = L.polygon(leafletCoords);
                tempGroup.addLayer(polygon);
              }
            }
          });
        }
        
        // fit the map to the fire's bounds with padding
        if (tempGroup.getLayers().length > 0) {
          const bounds = tempGroup.getBounds();
          map.fitBounds(bounds, {
            padding: [50, 50], 
            maxZoom: 5
          });
        } else {
          map.setView([fire.lat, fire.lng], 11);
        }
      } else {
        map.setView([fire.lat, fire.lng], 11);
      }
    } catch (error) {
      console.error('Error zooming to fire:', error);
      map.setView([fire.lat, fire.lng], 11);
    }
  };
  
  // this is in the text when showing the severity of the fire
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-400';
      case 'Medium': return 'text-orange-400';
      case 'Low': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };
  
  // the date
  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };

  const refreshData = async () => {
    try {
      setIsLoadingData(true);
      setDataError(null);
      const realTimeFireData = await fetchRealTimeFireData();
      setFires(realTimeFireData);
      console.log('Data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      setDataError(error.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* the header at the top with like the logo and other settings */}
      <header className="bg-gray-800 p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Flame className="h-8 w-8 text-orange-500" />
            <h1 className="text-2xl font-bold">Wildfire Prediction Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={mapLayer} 
              onChange={(e) => setMapLayer(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
            >
              <option value="satellite">Satellite</option>
              <option value="terrain">Terrain</option>
              <option value="standard">Standard</option>
            </select>
            <button 
              onClick={refreshData}
              disabled={isLoadingData}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* the actual map itself */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />

          {/* this is that thing that pops up when u click on the icon */}
          <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-sm z-[1000] border border-gray-600">
            <h3 className="text-lg font-bold mb-3 flex items-center text-white">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Active Fires ({fires.length})
            </h3>
            
            {isLoadingData && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <span className="ml-2 text-sm">Loading fire data...</span>
              </div>
            )}
            
            {dataError && (
              <div className="bg-red-900 bg-opacity-50 p-3 rounded-lg mb-3 border border-red-700">
                <p className="text-sm text-red-200">API Error: {dataError}</p>
                <p className="text-xs text-red-300 mt-1">Using demo data. Check console for details.</p>
              </div>
            )}
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fires.map((fire) => (
                <div
                  key={fire.id}
                  className="bg-gray-700 bg-opacity-90 p-3 rounded-lg cursor-pointer hover:bg-gray-600 hover:bg-opacity-95 transition-all duration-200 border border-gray-600"
                  onClick={() => handleFireClick(fire)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{fire.name}</h4>
                      <p className="text-sm text-gray-200">{fire.size} acres</p>
                      <p className="text-xs text-gray-300">Containment: {fire.containment ? `${fire.containment}%` : 'N/A'}</p>
                    </div>
                    <div className="text-right ml-2">
                      <span className={`text-sm font-medium ${getSeverityColor(fire.severity)}`}>
                        {fire.severity}
                      </span>
                      <div className="text-xs text-gray-400 mt-1">
                        Click for prediction
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* panel where it shows predictions (the one on the right) */}
        {showPrediction && (
          <div className="w-96 bg-gray-800 p-6 overflow-y-auto shadow-xl border-l border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Fire Prediction</h2>
              <button
                onClick={() => setShowPrediction(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-2">Generating prediction...</span>
              </div>
            ) : (
              selectedFire && prediction && (
                <div className="space-y-6">
                  {/* fire info */}
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-2">{selectedFire.name}</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Size: {selectedFire.size} acres</div>
                      <div>Containment: {selectedFire.containment ? `${selectedFire.containment}%` : 'N/A'}</div>
                      <div className={getSeverityColor(selectedFire.severity)}>
                        Severity: {selectedFire.severity}
                      </div>
                      <div>Updated: {formatDate(selectedFire.lastUpdate)}</div>
                    </div>
                  </div>

                  {/* weather data */}
                  {selectedFire.weather && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Thermometer className="h-4 w-4 mr-2" />
                        Current Weather
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Temperature: {selectedFire.weather.temperature}°F</div>
                        <div>Humidity: {selectedFire.weather.humidity}%</div>
                        <div className="flex items-center">
                          <Wind className="h-3 w-3 mr-1" />
                          Wind: {selectedFire.weather.windSpeed} mph {selectedFire.weather.windDirection}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* predictions */}
                  <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-700">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      24-Hour Prediction
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>Estimated Size: {Math.round(prediction.estimatedSize)} acres</div>
                      <div>Growth: +{Math.round(prediction.estimatedSize - selectedFire.size)} acres</div>
                      <div>Risk Level: <span className="text-red-400 font-semibold">{prediction.riskLevel}</span></div>
                      <div>Confidence: {prediction.confidence}%</div>
                      <div>Prediction Date: {formatDate(prediction.predictionDate)}</div>
                    </div>
                  </div>
                </div> 
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WildfireDashboard;