import React from 'react';
import { X, Thermometer, Wind, Calendar, MapPin } from 'lucide-react';
import { getSeverityColor, formatDate } from '../utils/helpers';

const PredictionPanel = ({ showPrediction, setShowPrediction, loading, selectedFire, prediction, firePredictionData, predictionLoading, onTogglePrediction, showPredictionMarkers }) => {
  if (!showPrediction) return null;

  return (
    <div className="w-96 bg-gray-800 p-6 overflow-y-auto shadow-xl border-l border-gray-700">
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
                <div>Size: {selectedFire.size} acres</div>
                <div>Containment: {selectedFire.containment ? `${selectedFire.containment}%` : 'N/A'}</div>
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
                Fire Growth Prediction
              </h4>
              
              {predictionLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm">Loading prediction data...</span>
                </div>
              ) : selectedFire.size < 100 ? (
                <div className="text-yellow-400 text-sm py-2">
                  Fire is too small to predict (less than 100 acres)
                </div>
              ) : firePredictionData && firePredictionData.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-green-400 text-sm">
                    ✓ Prediction data available ({firePredictionData.length} points)
                  </div>
                  <button
                    onClick={onTogglePrediction}
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      showPredictionMarkers 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {showPredictionMarkers ? 'Hide Prediction from Map' : 'Show Prediction on Map'}
                  </button>
                  
                  {/* Legend */}
                  <div className="mt-3 p-3 bg-gray-600 rounded-lg">
                    <div className="text-xs font-medium mb-2">Probability Legend:</div>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span>50%</span>
                      <div className="flex-1 h-2 bg-gradient-to-r from-yellow-400 to-red-500 rounded"></div>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 text-sm py-2">
                  No prediction data available for this fire
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