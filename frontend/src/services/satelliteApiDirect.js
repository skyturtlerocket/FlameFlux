// Satellite hotspot data (MODIS / VIIRS) is precomputed by the 30-minute
// automation (scripts/generate_data.py) and served as static files from
// /data/modis.json and /data/viirs.json, instead of a live ArcGIS call on load.

const FILES = {
  modis: 'modis.json',
  viirs: 'viirs.json'
};

export const fetchSatelliteData = async (satellite) => {
  const key = (satellite || '').toLowerCase();
  const file = FILES[key];
  if (!file) {
    throw new Error(`Unknown satellite type: ${satellite}`);
  }

  try {
    const base = process.env.PUBLIC_URL || '';
    const response = await fetch(`${base}/data/${file}`, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const hotspots = data.hotspots || [];
    console.log(`Loaded ${hotspots.length} ${satellite} hotspots from /data/${file} (as of ${data.generatedAt})`);
    return hotspots;
  } catch (error) {
    console.error(`Failed to load ${satellite} satellite data:`, error);
    throw error;
  }
};
