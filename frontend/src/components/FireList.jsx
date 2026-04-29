import React, { useMemo, useState } from 'react';
import { AlertTriangle, ArrowUpDown } from 'lucide-react';

const parseDate = (value) => {
  const timestamp = value ? Date.parse(value) : NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const sortOptions = [
  { key: 'prediction-priority', label: 'Prediction Priority (default)' },
  { key: 'size-desc', label: 'Size (largest first)' },
  { key: 'size-asc', label: 'Size (smallest first)' },
  { key: 'last-updated-desc', label: 'Last Updated (newest first)' },
  { key: 'last-updated-asc', label: 'Last Updated (oldest first)' },
];

const FireList = ({ fires, handleFireClick, isLoadingData, dataError, firePredictionAvailability = {} }) => {
  const [sortKey, setSortKey] = useState('prediction-priority');
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const sortedFires = useMemo(() => {
    const withIndex = fires.map((fire, index) => ({
      fire,
      index,
      hasPrediction: Boolean(firePredictionAvailability[fire.id]),
    }));

    withIndex.sort((a, b) => {
      if (a.hasPrediction !== b.hasPrediction) {
        return a.hasPrediction ? -1 : 1;
      }

      if (sortKey === 'prediction-priority') {
        return a.index - b.index;
      }

      if (sortKey === 'size-desc') return (b.fire.size || 0) - (a.fire.size || 0);
      if (sortKey === 'size-asc') return (a.fire.size || 0) - (b.fire.size || 0);
      if (sortKey === 'last-updated-desc') return parseDate(b.fire.lastUpdate) - parseDate(a.fire.lastUpdate);
      if (sortKey === 'last-updated-asc') return parseDate(a.fire.lastUpdate) - parseDate(b.fire.lastUpdate);
      return 0;
    });

    return withIndex;
  }, [fires, firePredictionAvailability, sortKey]);

  return (
    <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-xl max-w-sm z-[1000] border border-gray-600">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-bold flex items-center text-white">
          <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
          Active Fires ({fires.length})
        </h3>
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors border border-gray-600"
            onClick={() => setIsSortMenuOpen((prev) => !prev)}
            aria-label="Sort active fires"
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort</span>
          </button>
          {isSortMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-md border border-gray-600 bg-gray-900 shadow-lg overflow-hidden">
              {sortOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setSortKey(option.key);
                    setIsSortMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    sortKey === option.key
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-200 hover:bg-gray-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isLoadingData && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          <span className="ml-2 text-sm">Loading fire data...</span>
        </div>
      )}
      
      {dataError && (
        <div className="bg-red-900 bg-opacity-50 p-3 rounded-lg mb-3 border border-red-700">
          <p className="text-sm text-red-200">API Error: {dataError}</p>
          <p className="text-xs text-red-300 mt-1">Unable to fetch fire data from external API.</p>
        </div>
      )}
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {sortedFires.map(({ fire, hasPrediction }) => (
          <div
            key={fire.id}
            className="bg-gray-700 bg-opacity-90 p-3 rounded-lg cursor-pointer hover:bg-gray-600 hover:bg-opacity-95 transition-all duration-200 border border-gray-600"
            onClick={() => handleFireClick(fire)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold text-white">{fire.name}</h4>
                <p className="text-sm text-gray-200">{fire.size} acres</p>
                <p className="text-xs text-gray-300">Containment: {fire.containment !== null && fire.containment !== undefined ? `${fire.containment}%` : 'N/A'}</p>
              </div>
              <div className="text-right ml-2 flex flex-col items-end">
                {hasPrediction && (
                  <span className="inline-flex mb-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-500/20 text-green-300 border border-green-500/40">
                    Prediction Available
                  </span>
                )}
                <div className="block text-xs text-gray-400 mt-1">
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