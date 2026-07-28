// Hourly fire-growth forecasts (FlameFlux arrival_run model) are precomputed
// by the automation (arrival_run/pipeline/create_geojson_prediction.py +
// export_for_site.py) into frontend/public/data/predictions/. index.json
// lists which fires currently have a forecast; <normalized-name>.geojson
// carries the observed perimeter plus 24 nested hourly isochrone rings.
import { normalizeFireName } from '../utils/helpers';

const dataBase = () => `${process.env.PUBLIC_URL || ''}/data/predictions`;

// { generatedAt, fires: [{ name, file, issued_at_utc, valid_from_utc,
//   valid_to_utc, hours, degraded_history, model, val_precision, val_recall,
//   model_caveat }] }
export const fetchPredictionIndex = async () => {
  try {
    const response = await fetch(`${dataBase()}/index.json`, { cache: 'no-cache' });
    if (!response.ok) {
      // No predictions/ directory yet (automation hasn't run) is not an error.
      if (response.status === 404) return { generatedAt: null, fires: [] };
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to load prediction index:', error);
    return { generatedAt: null, fires: [] };
  }
};

// GeoJSON FeatureCollection: observed_perimeter, predicted_perimeter_24h,
// predicted_growth_24h, predicted_reach_h01..h24 (see arrival_run's
// pipeline/geojson_out.py). Returns null if this fire has no forecast.
export const fetchFirePrediction = async (fireName) => {
  const normalized = normalizeFireName(fireName);
  if (!normalized) return null;

  try {
    const response = await fetch(`${dataBase()}/${normalized}.geojson`, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to load prediction for ${fireName}:`, error);
    return null;
  }
};
