// Service to fetch perimeter prediction GeoJSON from the backend

export async function fetchPerimeterPredictions() {
  const response = await fetch('https://flameflux-production.up.railway.app/api/perimeter-predictions');
  if (!response.ok) {
    throw new Error('Failed to fetch perimeter predictions');
  }

  // Debug: log the raw response text
  const responseText = await response.text();
  console.log('Raw response from /api/perimeter-predictions:', responseText.substring(0, 200) + '...');

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Response text:', responseText);
    throw error;
  }
} 