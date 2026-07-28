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

// Parse a timestamp emitted by the arrival_run pipeline into a Date.
//
// Python's datetime.isoformat()/str() writes "2026-07-24 07:00:00" — a SPACE
// separator and, for the naive UTC fields (valid_at_utc, valid_from_utc,
// valid_to_utc), no zone designator at all. `new Date()` treats a zone-less
// datetime like that as LOCAL time, so a UTC forecast hour would render
// shifted by the viewer's UTC offset (4h off here, 7h in California). These
// fields are UTC by name and by construction, so normalize to a form Date
// parses unambiguously: "T" separator, explicit "Z" when no zone is present.
export const parseUtcTimestamp = (value) => {
  if (!value) return null;
  let s = String(value).trim().replace(' ', 'T');
  // Only append Z when the string carries no zone of its own; issued_at_utc
  // already ends in "+00:00" and must not be double-suffixed.
  if (!/(Z|[+-]\d{2}:?\d{2})$/.test(s)) s += 'Z';
  const date = new Date(s);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Normalize a fire name into the filename form the prediction pipeline uses
// (arrival_run/pipeline/create_geojson_prediction.py's normalize_fire_name):
// trim + internal spaces -> underscores. Used to look up this fire's
// forecast GeoJSON under /data/predictions/.
export const normalizeFireName = (fireName) => {
  if (!fireName) return null;
  return fireName.trim().replace(/\s+/g, '_');
};

// Color for an isochrone ring at hour `h` of a 24h forecast: yellow (soon)
// -> orange -> dark red (full 24h), so the whole set of nested hourly rings
// reads as a time gradient at a glance.
export const getIsochroneColor = (hourFraction) => {
  const f = Math.max(0, Math.min(1, hourFraction));
  const stops = [
    [250, 204, 21],  // yellow-400
    [249, 115, 22],  // orange-500
    [127, 29, 29],   // red-900
  ];
  const seg = f * (stops.length - 1);
  const i = Math.min(Math.floor(seg), stops.length - 2);
  const t = seg - i;
  const [r1, g1, b1] = stops[i];
  const [r2, g2, b2] = stops[i + 1];
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
};