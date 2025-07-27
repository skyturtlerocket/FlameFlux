// API calls to Flask backend

export const fetchRealTimeFireData = async () => {
    try {
      console.log("Fetching real-time fire data from Flask backend...");
      
      const response = await fetch('https://flameflux-production.up.railway.app/api/fires', {
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
      
      console.log(`Received ${data.total || 0} fires from backend`);
      
      return data.fires || [];
    } catch (error) {
      console.error('Failed to fetch fire data from backend:', error);
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