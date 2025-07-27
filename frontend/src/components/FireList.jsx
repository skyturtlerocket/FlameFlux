import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getSeverityColor } from '../utils/helpers';

const FireList = ({ fires, handleFireClick, isLoadingData, dataError }) => {
  return (
    <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-sm z-[1000] border border-gray-600">
      <h3 className="text-lg font-bold mb-3 flex items-center text-white">
        <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
        Active Fires ({fires.length})
      </h3>
      
      {isLoadingData && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-sm">Loading fire data...</span>
        </div>
      )}
      
      {dataError && (
        <div className="bg-red-900 bg-opacity-50 p-3 rounded-lg mb-3 border border-red-700">
          <p className="text-sm text-red-200">Backend Error: {dataError}</p>
          <p className="text-xs text-red-300 mt-1">Check Flask server status and logs.</p>
        </div>
      )}
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {fires.map((fire) => (
          <div
            key={fire.id}
            className="bg-gray-700 bg-opacity-90 p-3 rounded-lg cursor-pointer hover:bg-gray-600 hover:bg-opacity-95 transition-all duration-200 border border-gray-600"
            onClick={() => handleFireClick(fire)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-white">{fire.name}</h4>
                <p className="text-sm text-gray-200">{fire.size} acres</p>
                <p className="text-xs text-gray-300">Containment: {fire.containment ? `${fire.containment}%` : 'N/A'}</p>
              </div>
              <div className="text-right ml-2">
                <span className={`text-sm font-medium ${getSeverityColor(fire.severity)}`}>
                  {fire.severity}
                </span>
                <div className="text-xs text-gray-400 mt-1">
                  Click for details
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FireList;