// API calls for satellite hotspot data

export const fetchSatelliteData = async (satellite) => {
    try {
      console.log(`Fetching ${satellite} satellite data from Flask backend...`);
      
      const response = await fetch(`http://localhost:5000/api/${satellite.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(`Received ${data.total || 0} ${satellite} hotspots from backend`);
      
      return data.hotspots || [];
    } catch (error) {
      console.error(`Failed to fetch ${satellite} satellite data:`, error);
      throw error;
    }
  };
  
  export const fetchVIIRSData = () => fetchSatelliteData('VIIRS');
  export const fetchMODISData = () => fetchSatelliteData('MODIS');