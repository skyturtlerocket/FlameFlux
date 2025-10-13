import React from 'react';
import { RefreshCw } from 'lucide-react';

const Header = ({ mapLayer, setMapLayer, refreshData, isLoadingData }) => {
  return (
    <header className="bg-gray-800 p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/flameflux_logo.png" alt="FlameFlux logo" className="h-8 w-8 object-contain" />
          <h1 className="text-2xl font-bold">FlameFlux</h1>
        </div>
        <div className="flex items-center space-x-4">
          <select 
            value={mapLayer} 
            onChange={(e) => setMapLayer(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
          >
            <option value="standard">Standard</option>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
          </select>
          <button 
            onClick={refreshData}
            disabled={isLoadingData}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;