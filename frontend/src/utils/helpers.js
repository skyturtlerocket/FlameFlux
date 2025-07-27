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