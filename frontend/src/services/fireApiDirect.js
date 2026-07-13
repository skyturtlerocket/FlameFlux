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
