// Direct API calls for satellite hotspot data (bypassing Flask backend)

const MODIS_API = "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/MODIS_Thermal_v1/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson";
const VIIRS_API = "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Satellite_VIIRS_Thermal_Hotspots_and_Fire_Activity/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson";

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

const isInUSA = (lat, lon) => {
  return (
    (24.396308 <= lat && lat <= 49.384358 && -125.0 <= lon && lon <= -66.93457) ||
    (51.2 <= lat && lat <= 71.5 && -179.15 <= lon && lon <= -129.97) ||
    (18.5 <= lat && lat <= 22.5 && -160.5 <= lon && lon <= -154.5)
  );
};

export const fetchMODISData = async () => {
  try {
    console.log("Fetching MODIS satellite data directly from ArcGIS API...");
    
    const response = await fetch(MODIS_API, {
      method: 'GET',
      headers: headers,
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const features = data.features || [];
    const modisHotspots = [];
    
    for (let idx = 0; idx < features.length; idx++) {
      const val = features[idx];
      const id = val.id;
      const props = val.properties;
      const lat = val.geometry.coordinates[1];
      const lng = val.geometry.coordinates[0];
      
      // Check if it's in USA bounds
      if (!isInUSA(lat, lng)) {
        continue;
      }
      
      const age = props.HOURS_OLD;
      const confidence = props.CONFIDENCE;
      
      // Filter by confidence
      if (confidence < 80) {
        continue;
      }
      
      const intensity = props.FRP;
      
      const hotspot = {
        id: id,
        latitude: lat,
        longitude: lng,
        age: age,
        confidence: confidence,
        intensity: intensity,
        source: "MODIS"
      };
      
      modisHotspots.push(hotspot);
    }
    
    console.log(`Received ${modisHotspots.length} MODIS hotspots`);
    
    return modisHotspots;
    
  } catch (error) {
    console.error('Failed to fetch MODIS satellite data:', error);
    throw error;
  }
};

export const fetchVIIRSData = async () => {
  try {
    console.log("Fetching VIIRS satellite data directly from ArcGIS API...");
    
    const response = await fetch(VIIRS_API, {
      method: 'GET',
      headers: headers,
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const features = data.features || [];
    const viirsHotspots = [];
    
    for (let idx = 0; idx < features.length; idx++) {
      const val = features[idx];
      const id = val.id;
      const props = val.properties;
      const lat = val.geometry.coordinates[1];
      const lng = val.geometry.coordinates[0];
      
      // Check if it's in USA bounds
      if (!isInUSA(lat, lng)) {
        continue;
      }
      
      const age = props.hours_old;
      const intensity = props.frp;
      
      const hotspot = {
        id: id,
        latitude: lat,
        longitude: lng,
        age: age,
        confidence: null, // VIIRS doesn't have confidence in the original code
        intensity: intensity,
        source: "VIIRS"
      };
      
      viirsHotspots.push(hotspot);
    }
    
    console.log(`Received ${viirsHotspots.length} VIIRS hotspots`);
    
    return viirsHotspots;
    
  } catch (error) {
    console.error('Failed to fetch VIIRS satellite data:', error);
    throw error;
  }
};

export const fetchSatelliteData = async (satellite) => {
  try {
    console.log(`Fetching ${satellite} satellite data directly from ArcGIS API...`);
    
    let hotspots = [];
    
    if (satellite.toLowerCase() === 'modis') {
      hotspots = await fetchMODISData();
    } else if (satellite.toLowerCase() === 'viirs') {
      hotspots = await fetchVIIRSData();
    } else {
      throw new Error(`Unknown satellite type: ${satellite}`);
    }
    
    return hotspots;
    
  } catch (error) {
    console.error(`Failed to fetch ${satellite} satellite data:`, error);
    throw error;
  }
};
