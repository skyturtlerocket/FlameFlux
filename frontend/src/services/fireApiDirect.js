// Direct API calls to external fire data APIs (bypassing Flask backend)

const calcCenter = (coordinates, geomType) => {
  let allCoords = [];
  
  if (geomType === "Polygon") {
    allCoords = coordinates[0];
  } else if (geomType === "MultiPolygon") {
    for (const polygon of coordinates) {
      allCoords = allCoords.concat(polygon[0]);
    }
  }

  if (!allCoords || allCoords.length === 0) {
    return null;
  }

  const lngSum = allCoords.reduce((sum, coord) => sum + coord[0], 0);
  const latSum = allCoords.reduce((sum, coord) => sum + coord[1], 0);
  
  return [lngSum / allCoords.length, latSum / allCoords.length];
};

const getSeverityFromSize = (area) => {
  if (area >= 10000) {
    return "High";
  } else if (area >= 1000) {
    return "Medium";
  } else {
    return "Low";
  }
};

const isAlaskaFire = (lat, lng) => {
  // Alaska bounds (approximate)
  const alaskaBounds = {
    latMin: 51.0,
    latMax: 72.0,
    lngMin: -173.0,
    lngMax: -130.0
  };
  
  return (alaskaBounds.latMin <= lat && lat <= alaskaBounds.latMax &&
          alaskaBounds.lngMin <= lng && lng <= alaskaBounds.lngMax);
};

const getLatestFiresByName = (features) => {
  const fireMap = {};
  const cutoff = Date.now() - (24 * 60 * 60 * 1000); // last 24 hours only
  
  for (const feature of features) {
    const properties = feature.properties || {};
    const name = properties.poly_IncidentName || properties.incident_name;
    const dateMs = properties.poly_DateCurrent || 0;
    
    if (!name || dateMs < cutoff) {
      continue;
    }

    if (!fireMap[name] || dateMs > (fireMap[name].properties?.poly_DateCurrent || 0)) {
      fireMap[name] = feature;
    }
  }
  
  return Object.values(fireMap);
};

export const fetchRealTimeFireData = async () => {
  try {
    console.log("Fetching real-time fire data directly from ArcGIS API...");
    
    const apiUrl = "https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/WFIGS_Interagency_Perimeters_Current/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson";
    
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: headers,
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || data.type !== 'FeatureCollection') {
      throw new Error('Invalid data format - expected FeatureCollection');
    }

    const features = data.features || [];
    if (features.length === 0) {
      console.log("No fire features found");
      return [];
    }

    const latestFeatures = getLatestFiresByName(features);
    const processedFires = [];

    for (let i = 0; i < latestFeatures.length; i++) {
      console.log(`Processing feature ${i + 1}/${latestFeatures.length}`);
      
      const feature = latestFeatures[i];
      const geometry = feature.geometry || {};
      const properties = feature.properties || {};
      
      if (!geometry || !geometry.coordinates) {
        console.log(`Skipping feature ${i + 1}: No valid geometry`);
        continue;
      }
      
      const coords = geometry.coordinates;
      const center = calcCenter(coords, geometry.type);
      
      if (!center) {
        console.log(`Skipping feature ${i + 1}: Could not calculate center`);
        continue;
      }

      const incidentName = properties.poly_IncidentName || `Fire_${i + 1}`;
      const epochMs = properties.poly_DateCurrent;
      let lastUpdate = null;
      
      if (epochMs) {
        const epochS = epochMs / 1000;
        const dt = new Date(epochS * 1000);
        lastUpdate = dt.toISOString();
      }

      const area = Math.round(properties.poly_Acres_AutoCalc || 0);
      const severity = getSeverityFromSize(area);

      const fireData = {
        id: properties.OBJECTID || `fire_${i + 1}`,
        name: incidentName,
        lat: center[1],
        lng: center[0],
        size: area,
        containment: properties.poly_PercentContained,
        severity: severity,
        lastUpdate: lastUpdate,
        weather: null, // to be implemented
        geometry: {
          type: geometry.type,
          coordinates: coords
        }
      };
      
      processedFires.push(fireData);
    }

    console.log(`Successfully processed ${processedFires.length} fires`);
    
    // Filter out Alaska fires
    const filteredFires = processedFires.filter(fire => !isAlaskaFire(fire.lat, fire.lng));
    const alaskaCount = processedFires.length - filteredFires.length;
    console.log(`Filtered out ${alaskaCount} Alaska fires`);
    
    console.log(`Returning ${filteredFires.length} fires`);
    return filteredFires;
    
  } catch (error) {
    console.error('Failed to fetch fire data directly:', error);
    throw error;
  }
};

// Mock prediction service - replace with actual model API call
export const fetchPrediction = async (fireId, fireData) => {
  if (!fireData) {
    console.error('No fire data provided');
    return null;
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Mock data - replace with actual model prediction
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
  
  return mockPrediction;
};
