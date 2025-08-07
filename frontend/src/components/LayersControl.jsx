import React, { useState } from 'react';

const LayersControl = ({ 
  satelliteLayers, 
  onLayerToggle, 
  onViewModeChange,
  isLoadingSatelliteData
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const handleLayerToggle = (satellite) => {
    onLayerToggle(satellite);
  };

  const handleViewModeChange = (mode) => {
    onViewModeChange(mode);
  };

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      {/* Layers Button */}
      <button
        onClick={togglePanel}
        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600 transition-all duration-200"
        title="Toggle Layers Panel"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zM13 12a1 1 0 11-2 0 1 1 0 012 0zM20 12a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          <span>Layers</span>
        </div>
      </button>

      {/* Layers Panel */}
      {isOpen && (
        <div className="absolute top-12 right-0 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4 min-w-64">
          <div className="space-y-4">
            {/* Satellite Layers Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Satellite Hotspots</h3>
              <div className="space-y-2">
                {/* VIIRS Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={satelliteLayers.viirs.enabled}
                      onChange={() => handleLayerToggle('viirs')}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-white">VIIRS</span>
                    </div>
                  </label>
                  <div className="text-xs text-gray-400">
                    {isLoadingSatelliteData.viirs ? (
                      <span>Loading...</span>
                    ) : (
                      <span>{satelliteLayers.viirs.data.length} points</span>
                    )}
                  </div>
                </div>

                {/* MODIS Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={satelliteLayers.modis.enabled}
                      onChange={() => handleLayerToggle('modis')}
                      className="rounded border-gray-600 text-red-600 focus:ring-red-500 focus:ring-2"
                    />
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm text-white">MODIS</span>
                    </div>
                  </label>
                  <div className="text-xs text-gray-400">
                    {isLoadingSatelliteData.modis ? (
                      <span>Loading...</span>
                    ) : (
                      <span>{satelliteLayers.modis.data.length} points</span>
                    )}
                  </div>
                </div>


              </div>
            </div>

            {/* View Mode Section */}
            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Display Mode</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="viewMode"
                    value="markers"
                    checked={satelliteLayers.viewMode === 'markers'}
                    onChange={() => handleViewModeChange('markers')}
                    className="border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-white">Markers</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="viewMode"
                    value="heatmap"
                    checked={satelliteLayers.viewMode === 'heatmap'}
                    onChange={() => handleViewModeChange('heatmap')}
                    className="border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-white">Heat Map</span>
                </label>
              </div>
            </div>

            {/* Legend */}
            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Legend</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-400">VIIRS - Higher resolution</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-gray-400">MODIS - Lower resolution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayersControl;