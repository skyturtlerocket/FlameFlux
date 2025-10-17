import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getTileUrl, getIconSizeForSeverity, getSeverityBackgroundColor, getSeverityColorHex, getProbabilityColor, hasPredictionCSV } from '../utils/helpers';

const MapComponent = forwardRef(({ fires, mapLayer, onFireClick, satelliteLayers, predictedPerimeterEnabled, predictedPerimeterData, firePredictionData }, ref) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polygonsRef = useRef([]);
  const satelliteMarkersRef = useRef([]);
  const predictionMarkersRef = useRef([]);
  const heatmapLayerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const heatmapLoadedRef = useRef(false);
  const currentViewRef = useRef({ center: [39.8283, -116.4194], zoom: 5 });

  // Load Leaflet Heatmap plugin
  const loadHeatmapPlugin = useCallback(() => {
    return new Promise((resolve) => {
      if (window.L && window.L.heatLayer) {
        resolve();
        return;
      }

      if (!document.querySelector('script[src*="leaflet-heat"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
        script.onload = () => {
          heatmapLoadedRef.current = true;
          resolve();
        };
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }, []);

  // Get marker color based on satellite and confidence
  const getSatelliteMarkerColor = useCallback((satellite, confidence) => {
    const baseColor = satellite === 'VIIRS' ? '#3b82f6' : '#ef4444'; // Blue for VIIRS, Red for MODIS
    const opacity = Math.max(0.3, confidence / 100);
    return { color: baseColor, opacity };
  }, []);

  // Get marker size based on confidence and intensity
  const getSatelliteMarkerSize = useCallback((confidence, intensity) => {
    const baseSize = 8;
    const confidenceMultiplier = confidence / 100;
    const intensityMultiplier = Math.min(2, intensity / 100);
    return Math.max(6, baseSize * confidenceMultiplier * intensityMultiplier);
  }, []);

  // Add satellite markers to map
  const addSatelliteMarkers = useCallback((map, L) => {
    // Clear existing satellite markers
    satelliteMarkersRef.current.forEach(marker => map.removeLayer(marker));
    satelliteMarkersRef.current = [];

    // Add VIIRS markers
    if (satelliteLayers.viirs.enabled && satelliteLayers.viewMode === 'markers') {
      satelliteLayers.viirs.data.forEach(hotspot => {
        const { color, opacity } = getSatelliteMarkerColor('VIIRS', hotspot.confidence);
        const size = getSatelliteMarkerSize(hotspot.confidence, hotspot.intensity);
        
        const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
          radius: size,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: opacity,
          fillOpacity: opacity * 0.8
        }).addTo(map);

        marker.bindPopup(`
          <div style="color: #374151; font-family: system-ui;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #3b82f6;">VIIRS Hotspot</h3>
            <p style="margin: 2px 0; font-size: 12px;">ID: ${hotspot.id}</p>
            <p style="margin: 2px 0; font-size: 12px;">Confidence: ${hotspot.confidence}%</p>
            <p style="margin: 2px 0; font-size: 12px;">Intensity: ${hotspot.intensity}</p>
            <p style="margin: 2px 0; font-size: 12px;">Age: ${hotspot.age} hours</p>
            <p style="margin: 2px 0; font-size: 12px;">Lat: ${hotspot.latitude.toFixed(4)}, Lng: ${hotspot.longitude.toFixed(4)}</p>
          </div>
        `);

        satelliteMarkersRef.current.push(marker);
      });
    }

    // Add MODIS markers
    if (satelliteLayers.modis.enabled && satelliteLayers.viewMode === 'markers') {
      satelliteLayers.modis.data.forEach(hotspot => {
        const { color, opacity } = getSatelliteMarkerColor('MODIS', hotspot.confidence);
        const size = getSatelliteMarkerSize(hotspot.confidence, hotspot.intensity);
        
        const marker = L.circleMarker([hotspot.latitude, hotspot.longitude], {
          radius: size,
          fillColor: color,
          color: color,
          weight: 1,
          opacity: opacity,
          fillOpacity: opacity * 0.8
        }).addTo(map);

        marker.bindPopup(`
          <div style="color: #374151; font-family: system-ui;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #ef4444;">MODIS Hotspot</h3>
            <p style="margin: 2px 0; font-size: 12px;">ID: ${hotspot.id}</p>
            <p style="margin: 2px 0; font-size: 12px;">Confidence: ${hotspot.confidence}%</p>
            <p style="margin: 2px 0; font-size: 12px;">Intensity: ${hotspot.intensity}</p>
            <p style="margin: 2px 0; font-size: 12px;">Age: ${hotspot.age} hours</p>
            <p style="margin: 2px 0; font-size: 12px;">Lat: ${hotspot.latitude.toFixed(4)}, Lng: ${hotspot.longitude.toFixed(4)}</p>
          </div>
        `);

        satelliteMarkersRef.current.push(marker);
      });
    }
  }, [satelliteLayers, getSatelliteMarkerColor, getSatelliteMarkerSize]);

  // Add heatmap layer
  const addHeatmapLayer = useCallback(async (map, L) => {
    if (!heatmapLoadedRef.current) {
      await loadHeatmapPlugin();
    }

    // Remove existing heatmap
    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (satelliteLayers.viewMode === 'heatmap' && (satelliteLayers.viirs.enabled || satelliteLayers.modis.enabled)) {
      const heatmapData = [];

      // Add VIIRS data
      if (satelliteLayers.viirs.enabled) {
        satelliteLayers.viirs.data.forEach(hotspot => {
          const intensity = (hotspot.confidence / 100) * (hotspot.intensity / 200);
          heatmapData.push([hotspot.latitude, hotspot.longitude, intensity]);
        });
      }

      // Add MODIS data
      if (satelliteLayers.modis.enabled) {
        satelliteLayers.modis.data.forEach(hotspot => {
          const intensity = (hotspot.confidence / 100) * (hotspot.intensity / 200);
          heatmapData.push([hotspot.latitude, hotspot.longitude, intensity]);
        });
      }

      if (heatmapData.length > 0) {
        heatmapLayerRef.current = L.heatLayer(heatmapData, {
          radius: 20,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.4: 'blue',
            0.6: 'cyan',
            0.7: 'lime',
            0.8: 'yellow',
            1.0: 'red'
          }
        }).addTo(map);
      }
    }
  }, [satelliteLayers, loadHeatmapPlugin]);

  const addFirePolygons = useCallback((map, L, fire) => {
    const { geometry } = fire;
    
    try {
      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        
        if (!coords || coords.length < 3) {
          console.warn('Invalid polygon coordinates for fire:', fire.name);
          return;
        }
        
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
          const coords = polygonCoords[0];

          if (!coords || coords.length < 3) {
            console.warn(`Invalid polygon coordinates for fire ${fire.name}, polygon ${index}`);
            return;
          }

          const leafletCoords = coords
            .filter(coord => Array.isArray(coord) && coord.length >= 2 && 
                    typeof coord[0] === 'number' && typeof coord[1] === 'number' && 
                    !isNaN(coord[0]) && !isNaN(coord[1]))
            .map(coord => [coord[1], coord[0]]);
          
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
  }, []);

  // Add fire prediction probability markers
  const addFirePredictionMarkers = useCallback((map, L) => {
    // Always clear existing prediction markers first
    predictionMarkersRef.current.forEach(marker => map.removeLayer(marker));
    predictionMarkersRef.current = [];
    
    if (!firePredictionData || !firePredictionData.length) {
      console.log('No fire prediction data available - markers cleared');
      return;
    }
    
    console.log('Adding fire prediction markers:', firePredictionData.length);
    
    firePredictionData.forEach((point, idx) => {
      const lat = parseFloat(point.lat);
      const lon = parseFloat(point.lon);
      const probability = parseFloat(point.predicted_prob);
      
      if (isNaN(lat) || isNaN(lon) || isNaN(probability)) {
        console.warn(`Invalid data point #${idx}:`, point);
        return;
      }
      
      // Get color based on probability
      const color = getProbabilityColor(probability);
      
      // Create circle marker
      const marker = L.circleMarker([lat, lon], {
        radius: 4,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.7
      }).addTo(map);
      
      // Add popup with probability information
      marker.bindPopup(`
        <div style="color: #374151; font-family: system-ui;">
          <h3 style="font-weight: bold; font-size: 14px; margin: 0 0 8px 0; color: #dc2626;">Fire Prediction</h3>
          <p style="margin: 2px 0; font-size: 12px;">Probability: ${(probability * 100).toFixed(1)}%</p>
          <p style="margin: 2px 0; font-size: 12px;">Lat: ${lat.toFixed(4)}, Lng: ${lon.toFixed(4)}</p>
        </div>
      `);
      
      predictionMarkersRef.current.push(marker);
    });
    
    console.log(`Added ${predictionMarkersRef.current.length} prediction markers`);
  }, [firePredictionData]);

  const addFireMarkers = useCallback((map, L) => {
    // Clear existing markers and polygons
    markersRef.current.forEach(marker => map.removeLayer(marker));
    polygonsRef.current.forEach(polygon => map.removeLayer(polygon));
    markersRef.current = [];
    polygonsRef.current = [];

    // Add markers for each fire
    fires.forEach(fire => {
      // Add polygon outlines
      addFirePolygons(map, L, fire);
      
      // Get icon configuration based on severity
      const iconConfig = getIconSizeForSeverity(fire.severity);
      const backgroundColor = getSeverityBackgroundColor(fire.severity);
      
      // Create fire icon with custom image and dynamic sizing
      const fireIcon = L.divIcon({
        html: `<div style="
          width: ${iconConfig.size}px;
          height: ${iconConfig.size}px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background-image: url('/fire_icon.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
        "></div>`,
        className: 'fire-marker',
        iconSize: [iconConfig.size, iconConfig.size],
        iconAnchor: [iconConfig.size / 2, iconConfig.size / 2],
        popupAnchor: [0, -iconConfig.size / 2]
      });
      
      // Add marker
      const marker = L.marker([fire.lat, fire.lng], { icon: fireIcon })
        .addTo(map);

      const basePopupHtml = `
            <div style="color: #374151; font-family: system-ui;">
              <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">${fire.name}</h3>
              <p style="margin: 2px 0;">Size: ${fire.size} acres</p>
              <p style="margin: 2px 0;">Containment: ${fire.containment !== null && fire.containment !== undefined ? `${fire.containment}%` : 'N/A'}</p>
              <p style="margin: 2px 0; color: ${getSeverityColorHex(fire.severity)}; font-weight: 600;">
                Severity: ${fire.severity}
              </p>
            </div>
          `;

      marker.bindPopup(basePopupHtml)
        .on('click', () => onFireClick(fire));

        // If prediction CSV exists, augment popup with a View Prediction button
        try {
          hasPredictionCSV(fire.name).then((exists) => {
            if (!exists) return;
            const popupHtml = `
              <div style="color: #374151; font-family: system-ui;">
                <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">${fire.name}</h3>
                <p style="margin: 2px 0;">Size: ${fire.size} acres</p>
                <p style="margin: 2px 0;">Containment: ${fire.containment !== null && fire.containment !== undefined ? `${fire.containment}%` : 'N/A'}</p>
                <p style="margin: 2px 0; color: ${getSeverityColorHex(fire.severity)}; font-weight: 600;">
                  Severity: ${fire.severity}
                </p>
                <div style="display: flex; gap: 8px; margin-top: 8px;">
                  <button data-action="view-prediction" style="
                    background: #3b82f6;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                  ">View Prediction</button>
                </div>
              </div>`;
            try {
              const popup = marker.getPopup();
              if (popup && popup.setContent) {
                popup.setContent(popupHtml);
              }
            } catch (e) { /* no-op */ }
          });
        } catch (e) {
          // ignore
        }

        // Keep popup open when hovering popup content; close only when leaving both marker and popup
        let isHoveringPopup = false;
        marker.on('mouseover', () => {
          try { marker.openPopup(); } catch (e) { /* no-op */ }
        });
        marker.on('popupopen', () => {
          try {
            const popup = marker.getPopup();
            const container = popup && (popup.getElement ? popup.getElement() : popup._container);
            if (container) {
              // Sticky hover
              container.addEventListener('mouseenter', () => { isHoveringPopup = true; });
              container.addEventListener('mouseleave', () => {
                isHoveringPopup = false;
                setTimeout(() => { if (!isHoveringPopup) { try { marker.closePopup(); } catch (e) {} } }, 120);
              });
              // Wire up View Prediction button
              const btn = container.querySelector('[data-action="view-prediction"]');
              if (btn) {
                btn.addEventListener('click', (ev) => {
                  ev.preventDefault();
                  try { onFireClick(fire); } catch {}
                }, { once: true });
              }
            }
          } catch (e) { /* no-op */ }
        });
        marker.on('mouseout', () => {
          setTimeout(() => {
            if (!isHoveringPopup) {
              try { marker.closePopup(); } catch (e) { /* no-op */ }
            }
          }, 120);
        });

      markersRef.current.push(marker);
    });
  }, [fires, onFireClick, addFirePolygons]);

  // Zoom to fire perimeter
  const zoomToFire = useCallback((fire) => {
    console.log('zoomToFire called with:', fire);
    if (!mapInstanceRef.current || !fire.geometry) {
      console.log('Early return - mapInstance:', !!mapInstanceRef.current, 'geometry:', !!fire.geometry);
      return;
    }

    const L = window.L;
    try {
      console.log('Fire geometry type:', fire.geometry.type);
      if (fire.geometry.type === 'Polygon') {
        const coords = fire.geometry.coordinates[0];
        console.log('Polygon coordinates:', coords);
        if (coords && coords.length >= 3) {
          const leafletCoords = coords
            .filter(coord => Array.isArray(coord) && coord.length >= 2 && 
                    typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                    !isNaN(coord[0]) && !isNaN(coord[1]))
            .map(coord => [coord[1], coord[0]]);
          
          console.log('Leaflet coordinates:', leafletCoords);
          if (leafletCoords.length >= 3) {
            const bounds = L.latLngBounds(leafletCoords);
            console.log('Fitting bounds:', bounds);
            mapInstanceRef.current.fitBounds(bounds, { 
              padding: [20, 20],
              maxZoom: 15 
            });
          }
        }
      } else if (fire.geometry.type === 'MultiPolygon') {
        const allCoords = [];
        fire.geometry.coordinates.forEach(polygonCoords => {
          const coords = polygonCoords[0];
          if (coords && coords.length >= 3) {
            const leafletCoords = coords
              .filter(coord => Array.isArray(coord) && coord.length >= 2 && 
                      typeof coord[0] === 'number' && typeof coord[1] === 'number' &&
                      !isNaN(coord[0]) && !isNaN(coord[1]))
              .map(coord => [coord[1], coord[0]]);
            allCoords.push(...leafletCoords);
          }
        });
        
        console.log('MultiPolygon all coordinates:', allCoords);
        if (allCoords.length >= 3) {
          const bounds = L.latLngBounds(allCoords);
          console.log('Fitting bounds:', bounds);
          mapInstanceRef.current.fitBounds(bounds, { 
            padding: [20, 20],
            maxZoom: 15 
          });
        }
      }
    } catch (error) {
      console.error('Error zooming to fire:', error);
    }
  }, [mapInstanceRef]);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Disconnect resize observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // Clean up markers and polygons
    if (mapInstanceRef.current) {
      markersRef.current.forEach(marker => {
        try {
          mapInstanceRef.current.removeLayer(marker);
        } catch (e) {
          console.warn('Error removing marker:', e);
        }
      });
      
      polygonsRef.current.forEach(polygon => {
        try {
          mapInstanceRef.current.removeLayer(polygon);
        } catch (e) {
          console.warn('Error removing polygon:', e);
        }
      });

      // Clean up satellite markers
      satelliteMarkersRef.current.forEach(marker => {
        try {
          mapInstanceRef.current.removeLayer(marker);
        } catch (e) {
          console.warn('Error removing satellite marker:', e);
        }
      });

      // Clean up heatmap layer
      if (heatmapLayerRef.current) {
        try {
          mapInstanceRef.current.removeLayer(heatmapLayerRef.current);
        } catch (e) {
          console.warn('Error removing heatmap layer:', e);
        }
      }
    }

    markersRef.current = [];
    polygonsRef.current = [];
    satelliteMarkersRef.current = [];
    heatmapLayerRef.current = null;

    // Remove map instance
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (e) {
        console.warn('Error removing map:', e);
      }
      mapInstanceRef.current = null;
    }

    // Clean up global selectFire function
    if (window.selectFire) {
      delete window.selectFire;
    }
  }, []);

  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Adding CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(link);
        }

        // Loading Leaflet
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

    const initializeMap = async () => {
      // Clean up existing map first
      cleanup();

      if (!mapRef.current) return;

      try {
        const L = window.L;
        
        // Initialize the map with current view state
        const map = L.map(mapRef.current, {
          center: currentViewRef.current.center,
          zoom: currentViewRef.current.zoom,
          zoomControl: false
        });

        // Add tile layer
        const tileLayer = L.tileLayer(getTileUrl(mapLayer), {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;
        mapInstanceRef.current.tileLayer = tileLayer;

        // Store current view when map moves
        map.on('moveend', () => {
          currentViewRef.current = {
            center: map.getCenter(),
            zoom: map.getZoom()
          };
        });

        // Add fire markers when fires are loaded
        if (fires.length > 0) {
          addFireMarkers(map, L);
        }

        // Add satellite data
        if (satelliteLayers) {
          addSatelliteMarkers(map, L);
          await addHeatmapLayer(map, L);
        }

        // Map resizing with proper error handling
        if (mapRef.current) {
          resizeObserverRef.current = new ResizeObserver(() => {
            try {
              if (mapInstanceRef.current && mapRef.current) {
                // Add a small delay to ensure DOM is ready
                setTimeout(() => {
                  if (mapInstanceRef.current && mapRef.current) {
                    mapInstanceRef.current.invalidateSize();
                  }
                }, 50);
              }
            } catch (error) {
              console.warn('Error during map resize:', error);
            }
          });
          
          resizeObserverRef.current.observe(mapRef.current);
        }

        console.log('Map initialized successfully');
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    loadLeaflet();

    return cleanup;
  }, [fires.length, mapLayer, addFireMarkers, cleanup, addSatelliteMarkers, addHeatmapLayer]);

  // Change tiles when map type changes
  useEffect(() => {
    if (mapInstanceRef.current && mapInstanceRef.current.tileLayer) {
      const L = window.L;
      try {
        mapInstanceRef.current.removeLayer(mapInstanceRef.current.tileLayer);
        
        const newTileLayer = L.tileLayer(getTileUrl(mapLayer), {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);

        mapInstanceRef.current.tileLayer = newTileLayer;
      } catch (error) {
        console.error('Error changing tile layer:', error);
      }
    }
  }, [mapLayer]);

  // Update markers when fires change
  useEffect(() => {
    if (mapInstanceRef.current && window.L && fires.length > 0) {
      try {
        addFireMarkers(mapInstanceRef.current, window.L);
      } catch (error) {
        console.error('Error updating fire markers:', error);
      }
    }
  }, [fires, addFireMarkers]);

  // Update satellite layers when they change
  useEffect(() => {
    if (mapInstanceRef.current && window.L && satelliteLayers) {
      try {
        addSatelliteMarkers(mapInstanceRef.current, window.L);
        addHeatmapLayer(mapInstanceRef.current, window.L);
      } catch (error) {
        console.error('Error updating satellite layers:', error);
      }
    }
  }, [satelliteLayers, addSatelliteMarkers, addHeatmapLayer]);

  // Update polygons when fires change
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      try {
        // Clear existing polygons first
        polygonsRef.current.forEach(polygon => {
          try {
            mapInstanceRef.current.removeLayer(polygon);
          } catch (e) {
            console.warn('Error removing polygon:', e);
          }
        });
        polygonsRef.current = [];

        // Add fire polygons
        fires.forEach(fire => {
          addFirePolygons(mapInstanceRef.current, window.L, fire);
        });
      } catch (error) {
        console.error('Error updating polygons:', error);
      }
    }
  }, [fires, addFirePolygons]);

  // Update fire prediction markers when data changes
  useEffect(() => {
    if (mapInstanceRef.current && window.L) {
      try {
        addFirePredictionMarkers(mapInstanceRef.current, window.L);
      } catch (error) {
        console.error('Error updating fire prediction markers:', error);
      }
    }
  }, [firePredictionData, addFirePredictionMarkers]);

  // Make selectFire global for popup buttons
  useEffect(() => {
    window.selectFire = (fireId) => {
      try {
        const fire = fires.find(f => f.id === fireId);
        if (fire) {
          onFireClick(fire);
        }
      } catch (error) {
        console.error('Error in selectFire:', error);
      }
    };

    window.zoomToFire = (fireId) => {
      try {
        const fire = fires.find(f => f.id === fireId);
        if (fire) {
          zoomToFire(fire);
        }
      } catch (error) {
        console.error('Error in zoomToFire:', error);
      }
    };
    
    return () => {
      if (window.selectFire) {
        delete window.selectFire;
      }
      if (window.zoomToFire) {
        delete window.zoomToFire;
      }
    };
  }, [fires, onFireClick, zoomToFire]);

  useImperativeHandle(ref, () => ({
    zoomToFire,
  }));

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '500px' }}
    />
  );
});

export default MapComponent;