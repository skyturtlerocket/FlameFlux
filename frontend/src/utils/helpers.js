// Utility functions for the wildfire dashboard

export const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-400';
      case 'Medium': return 'text-orange-400';
      case 'Low': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };
  
  export const getSeverityColorHex = (severity) => {
    switch (severity) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f97316';
      case 'Low': return '#eab308';
      default: return '#6b7280';
    }
  };
  
  export const getSeverityBackgroundColor = (severity) => {
    switch (severity) {
      case 'High': return '#ef4444';
      case 'Medium': return '#f97316';
      case 'Low':
      default: return '#eab308';
    }
  };
  
  export const getIconSizeForSeverity = (severity) => {
    switch (severity) {
      case 'High':
        return { size: 48, fontSize: '24px' };
      case 'Medium':
        return { size: 36, fontSize: '18px' };
      case 'Low':
      default:
        return { size: 24, fontSize: '12px' };
    }
  };
  
  export const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString();
  };
  
  export const getTileUrl = (layer) => {
    switch (layer) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'terrain':
        return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

// Convert fire name to CSV filename format
export const convertFireNameToCSV = (fireName) => {
  if (!fireName) return null;
  
  // Remove leading/trailing whitespace and replace internal spaces with underscores
  return fireName.trim().replace(/\s+/g, '_');
};

// Get probability color based on predicted_prob value
export const getProbabilityColor = (probability) => {
  // Ensure probability is between 0.5 and 1.0
  const p = Math.max(0.5, Math.min(1.0, probability));
  
  // Interpolate between yellow (p=0.5) and red (p=1.0)
  const ratio = (p - 0.5) / 0.5; // 0 to 1
  
  // Yellow: rgb(255, 255, 0) to Red: rgb(255, 0, 0)
  const red = 255;
  const green = Math.round(255 * (1 - ratio));
  const blue = 0;
  
  return `rgb(${red}, ${green}, ${blue})`;
};

// Load CSV data for a specific fire
export const loadFirePredictionCSV = async (fireName) => {
  try {
    const csvFileName = convertFireNameToCSV(fireName);
    if (!csvFileName) {
      throw new Error('Invalid fire name');
    }
    
    // Fetch the CSV file directly from the public directory
    const response = await fetch(`/csv/${csvFileName}.csv`);
    if (!response.ok) {
      throw new Error(`CSV file not found: ${csvFileName}.csv`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',');
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim();
        });
        data.push(row);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to load CSV for fire ${fireName}:`, error);
    return null;
  }
};

// Cache for prediction CSV existence checks to avoid repeated network calls
const csvExistenceCache = new Map();

// Check if a prediction CSV exists for a given fire name
export const hasPredictionCSV = async (fireName) => {
  const csvFileName = convertFireNameToCSV(fireName);
  if (!csvFileName) return false;

  if (csvExistenceCache.has(csvFileName)) {
    return csvExistenceCache.get(csvFileName);
  }

  try {
    const response = await fetch(`/csv/${csvFileName}.csv`, { method: 'GET' });
    if (!response.ok) {
      csvExistenceCache.set(csvFileName, false);
      return false;
    }

    // Validate content-type and a minimal CSV header
    const contentType = (response.headers && response.headers.get && response.headers.get('content-type')) || '';
    const isCSVType = contentType.includes('text/csv') || contentType.includes('application/csv') || contentType.includes('application/octet-stream');

    // Read just a small portion (dev servers may not support partial reads easily; read full then slice header)
    const text = await response.text();
    const firstLine = (text.split('\n')[0] || '').toLowerCase();
    const hasHeader = firstLine.includes('predicted_prob') || firstLine.includes('lat,') || firstLine.includes('lon');

    const exists = isCSVType && hasHeader;
    csvExistenceCache.set(csvFileName, exists);
    return exists;
  } catch (e) {
    csvExistenceCache.set(csvFileName, false);
    return false;
  }
};