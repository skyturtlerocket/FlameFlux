// Fire data is precomputed by the 30-minute automation (scripts/generate_data.py)
// and served as a static file from /data/fires.json. This avoids a slow, live
// ArcGIS call + client-side processing on every page load.

export const fetchRealTimeFireData = async () => {
  try {
    const base = process.env.PUBLIC_URL || '';
    const response = await fetch(`${base}/data/fires.json`, { cache: 'no-cache' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const fires = data.fires || [];
    console.log(`Loaded ${fires.length} fires from /data/fires.json (as of ${data.generatedAt})`);
    return fires;
  } catch (error) {
    console.error('Failed to load fire data:', error);
    throw error;
  }
};
