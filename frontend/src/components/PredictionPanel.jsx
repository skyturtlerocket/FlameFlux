import React, { useMemo } from 'react';
import { X, Thermometer, Wind, MapPin, AlertTriangle } from 'lucide-react';
import { getSeverityColor, formatDate, getIsochroneColor, parseUtcTimestamp } from '../utils/helpers';

const PredictionPanel = ({ showPrediction, setShowPrediction, loading, selectedFire, prediction, firePredictionData, predictionLoading, onTogglePrediction, showPredictionMarkers }) => {
  // Every feature in the forecast carries the same provenance properties
  // (arrival_run/pipeline/create_geojson_prediction.py's meta), so any one
  // of them tells us the issued/validity window and caveats.
  const forecastMeta = useMemo(() => {
    if (!firePredictionData || !firePredictionData.features || firePredictionData.features.length === 0) {
      return null;
    }
    return firePredictionData.features[0].properties;
  }, [firePredictionData]);

  // A forecast only covers valid_from_utc..valid_to_utc (24h from the fire's
  // last WFIGS perimeter). Once that window has passed the isochrones are
  // describing a time that has already happened, so say so rather than
  // presenting them as a live outlook — the pipeline ages a fire out entirely
  // after export_for_site.py's --max-staleness-days, but a forecast can sit
  // expired-but-published for a while before that.
  const validTo = useMemo(
    () => parseUtcTimestamp(forecastMeta?.valid_to_utc),
    [forecastMeta]
  );
  const isExpired = validTo ? validTo.getTime() < Date.now() : false;

  if (!showPrediction) return null;

  return (
    <div className="fixed inset-0 z-[1200] sm:static sm:z-auto w-full sm:w-96 bg-gray-800 p-6 overflow-y-auto shadow-xl sm:border-l border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Fire Prediction</h2>
        <button
          onClick={() => setShowPrediction(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-2">Generating prediction...</span>
        </div>
      ) : (
        selectedFire && (
          <div className="space-y-6">
            {/* Fire info */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{selectedFire.name}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Size: <span className="tabular">{selectedFire.size}</span> acres</div>
                <div>Containment: <span className="tabular">{selectedFire.containment !== null && selectedFire.containment !== undefined ? `${selectedFire.containment}%` : 'N/A'}</span></div>
                <div className={getSeverityColor(selectedFire.severity)}>
                  Severity: {selectedFire.severity}
                </div>
                <div>Updated: {formatDate(selectedFire.lastUpdate)}</div>
              </div>
            </div>

            {/* Prediction Status */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                24h Growth Forecast
              </h4>

              {predictionLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm">Loading forecast...</span>
                </div>
              ) : forecastMeta ? (
                <div className="space-y-3">
                  {isExpired ? (
                    <div className="text-amber-400 text-sm flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Forecast window ended{' '}
                        <span className="tabular">{formatDate(parseUtcTimestamp(forecastMeta.valid_to_utc))}</span>
                        {' '}— showing the last run, not a current outlook.
                      </span>
                    </div>
                  ) : (
                    <div className="text-green-400 text-sm">
                      ✓ Hourly forecast available
                    </div>
                  )}

                  <div className="text-xs text-gray-400 space-y-0.5">
                    <div>
                      Issued <span className="tabular">{formatDate(parseUtcTimestamp(forecastMeta.issued_at_utc))}</span>
                    </div>
                    {forecastMeta.degraded_history && (
                      <div className="text-amber-400">
                        Limited perimeter history — lower confidence than usual.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={onTogglePrediction}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      showPredictionMarkers
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {showPredictionMarkers ? 'Hide Forecast from Map' : 'Show Forecast on Map'}
                  </button>

                  {/* Legend */}
                  <div className="mt-3 p-3 bg-gray-600 rounded-lg">
                    <div className="text-xs font-medium mb-2">Color scale:</div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span>Soon</span>
                      <div
                        className="flex-1 h-2 rounded"
                        style={{
                          background: `linear-gradient(to right, ${getIsochroneColor(0)}, ${getIsochroneColor(0.5)}, ${getIsochroneColor(1)})`,
                        }}
                      ></div>
                      <span>24h since last update</span>
                    </div>
                  </div>

                  {/* The pipeline ships model_caveat inside every feature on
                      purpose: arrival_run was picked for recall and its
                      precision is low, so most flagged growth is wrong.
                      Collapsed by default — available, not shouted. */}
                  {forecastMeta.model_caveat && (
                    <details className="text-xs text-gray-400 bg-gray-600/50 rounded-lg p-3">
                      <summary className="cursor-pointer font-medium text-gray-300 hover:text-white">
                        Model limitations
                      </summary>
                      <p className="mt-2 leading-relaxed whitespace-pre-line">
                        {forecastMeta.model_caveat}
                      </p>
                    </details>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-sm py-2">
                  {selectedFire.size < 100
                    ? 'Fire is too small to predict'
                    : 'No forecast available for this fire'}
                </div>
              )}
            </div>

            {/* Weather data */}
            {selectedFire.weather && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center">
                  <Thermometer className="h-4 w-4 mr-2" />
                  Current Weather
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Temperature: {selectedFire.weather.temperature}°F</div>
                  <div>Humidity: {selectedFire.weather.humidity}%</div>
                  <div className="flex items-center">
                    <Wind className="h-3 w-3 mr-1" />
                    Wind: {selectedFire.weather.windSpeed} mph {selectedFire.weather.windDirection}
                  </div>
                </div>
              </div>
            )}


          </div>
        )
      )}
    </div>
  );
};

export default PredictionPanel;
