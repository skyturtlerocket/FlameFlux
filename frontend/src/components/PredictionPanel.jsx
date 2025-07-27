import React from 'react';
import { X, Thermometer, Wind, Calendar } from 'lucide-react';
import { getSeverityColor, formatDate } from '../utils/helpers';

const PredictionPanel = ({ showPrediction, setShowPrediction, loading, selectedFire, prediction }) => {
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
        selectedFire && prediction && (
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

            {/* Predictions */}
            <div className="bg-red-900 bg-opacity-50 p-4 rounded-lg border border-red-700">
              <h4 className="font-semibold mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                24-Hour Prediction
              </h4>
              <div className="space-y-2 text-sm">
                <div>Estimated Size: {Math.round(prediction.estimatedSize)} acres</div>
                <div>Growth: +{Math.round(prediction.estimatedSize - selectedFire.size)} acres</div>
                <div>Risk Level: <span className="text-red-400 font-semibold">{prediction.riskLevel}</span></div>
                <div>Confidence: {prediction.confidence}%</div>
                <div>Prediction Date: {formatDate(prediction.predictionDate)}</div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default PredictionPanel;