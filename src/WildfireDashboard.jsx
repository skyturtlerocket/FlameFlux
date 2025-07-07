import React, { useState, useEffect, useRef } from 'react';
import { Flame, AlertTriangle, Calendar, Thermometer, Wind, Eye, X, RefreshCw } from 'lucide-react';

// ========================================================================================================================================
// Sample fire data
// ========================================================================================================================================
// We would realistically import fire data through JSON, this example is in JSON format right now
const sampleFires = [
  {
    id: 1,
    name: "Riverside Fire",
    lat: 37.7749,
    lng: -122.4194,
    size: 2500,
    containment: 25,
    severity: "High",
    lastUpdate: "2025-07-07T14:30:00Z",
    weather: {
      temperature: 85,
      humidity: 15,
      windSpeed: 25,
      windDirection: "NW"
    }
  },
  {
    id: 2,
    name: "Mountain View Fire",
    lat: 37.8044,
    lng: -122.2711,
    size: 850,
    containment: 60,
    severity: "Medium",
    lastUpdate: "2025-07-07T13:45:00Z",
    weather: {
      temperature: 78,
      humidity: 22,
      windSpeed: 12,
      windDirection: "SW"
    }
  },
  {
    id: 3,
    name: "Canyon Fire",
    lat: 37.6879,
    lng: -122.4702,
    size: 1200,
    containment: 10,
    severity: "High",
    lastUpdate: "2025-07-07T15:00:00Z",
    weather: {
      temperature: 92,
      humidity: 8,
      windSpeed: 35,
      windDirection: "E"
    }
  }
];

const WildfireDashboard = () => {
  const [fires, setFires] = useState(sampleFires);
  const [selectedFire, setSelectedFire] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [mapLayer, setMapLayer] = useState('satellite');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // loading leaflet and css
    const loadLeaflet = async () => {
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
        script.onload = initializeMap;
        document.head.appendChild(script);
      } else {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;
      
      // Intialize the map to be in SFBA
      // we could use the user's location in real production
      const map = L.map(mapRef.current, {
        center: [37.7749, -122.4194],
        zoom: 10,
        zoomControl: false
      });

      // add tile layers because leaflet doesn't have satellite on default
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

      const tileLayer = L.tileLayer(getTileUrl(mapLayer), {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // references
      mapInstanceRef.current = map;
      mapInstanceRef.current.tileLayer = tileLayer;

      // add the markers
      addFireMarkers(map, L);

      // map resizing
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapRef.current);

      return () => {
        resizeObserver.disconnect();
      };
    };

    loadLeaflet();

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

  const addFireMarkers = (map, L) => {
    // clearing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // fire icon
    const fireIcon = L.divIcon({
      html: `<div style="
        background: linear-gradient(45deg, #ef4444, #f97316);
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
      ">🔥</div>`,
      className: 'fire-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14]
    });

    // markers for the fire
    fires.forEach(fire => {
      const marker = L.marker([fire.lat, fire.lng], { icon: fireIcon })
        .addTo(map)
        .bindPopup(`
          <div style="color: #374151; font-family: system-ui;">
            <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">${fire.name}</h3>
            <p style="margin: 2px 0;">Size: ${fire.size} acres</p>
            <p style="margin: 2px 0;">Containment: ${fire.containment}%</p>
            <p style="margin: 2px 0; color: ${getSeverityColorHex(fire.severity)}; font-weight: 600;">
              Severity: ${fire.severity}
            </p>
            <button onclick="window.selectFire(${fire.id})" style="
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
  // ========================================================================================================================================
  const fetchPrediction = async (fireId, fireData) => {
    if (!fireData) {
      console.error('No fire data provided');
      return;
    }
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    
    setPrediction(mockPrediction);
    setShowPrediction(true);
    setLoading(false);
  };

  const handleFireClick = (fire) => {
    setSelectedFire(fire);
    fetchPrediction(fire.id, fire);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-400';
      case 'Medium': return 'text-orange-400';
      case 'Low': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
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
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <div 
            ref={mapRef} 
            className="w-full h-full"
            style={{ minHeight: '500px' }}
          />

          {/* list of active fires */}
          <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-sm z-[1000] border border-gray-600">
            <h3 className="text-lg font-bold mb-3 flex items-center text-white">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Active Fires ({fires.length})
            </h3>
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
                      <p className="text-xs text-gray-300">Containment: {fire.containment}%</p>
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

        {/* panel where it shows predictions */}
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
                      <div>Containment: {selectedFire.containment}%</div>
                      <div className={getSeverityColor(selectedFire.severity)}>
                        Severity: {selectedFire.severity}
                      </div>
                      <div>Updated: {formatDate(selectedFire.lastUpdate)}</div>
                    </div>
                  </div>

                  {/* weather data */}
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

                  {/* info on the model 
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Model Information
                    </h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div>Model Version: v2.1.0</div>
                      <div>Last Training: June 2025</div>
                      <div>Data Sources: Satellite imagery, weather stations</div>
                      <div>Update Frequency: Every 4 hours</div>
                    </div>
                  </div>*/}
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