import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium px-2 py-1 rounded-md transition-colors ${
    isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
  }`;

const Header = ({ mapLayer, setMapLayer, refreshData, isLoadingData }) => {
  const showMapControls =
    mapLayer !== undefined &&
    mapLayer !== null &&
    typeof setMapLayer === 'function' &&
    typeof refreshData === 'function';
  const controlsHiddenClass = showMapControls ? '' : 'invisible pointer-events-none';
  const controlsValue = mapLayer ?? 'standard';

  return (
    <header className="sticky top-0 z-50 bg-gray-800 p-4 shadow-lg border-b border-gray-700/80">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex items-center justify-center md:justify-self-start space-x-3 min-w-0">
          <Link to="/" aria-label="FlameFlux home" className="block leading-none">
            <img src="/flameflux_logo.png" alt="" className="h-8 w-8 object-contain" />
          </Link>
          <Link to="/" className="text-2xl font-bold text-white hover:text-gray-200">
            FlameFlux
          </Link>
        </div>
        <nav className="grid grid-cols-2 items-center gap-4">
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <NavLink to="/active-fires" className={navLinkClass}>
              Active Fires
            </NavLink>
            <NavLink to="/achievements" className={navLinkClass}>
              Achievements
            </NavLink>
          </div>
          <div className="flex items-center justify-start gap-1 sm:gap-2">
            <NavLink to="/about" className={navLinkClass}>
              About Us
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact Us
            </NavLink>
          </div>
        </nav>
        <div className="flex items-center justify-center md:justify-self-end min-w-0">
          <div
            className={`flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0 ${controlsHiddenClass}`}
          >
            <select
              value={controlsValue}
              onChange={(e) => setMapLayer?.(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600"
            >
              <option value="standard">Standard</option>
              <option value="satellite">Satellite</option>
              <option value="terrain">Terrain</option>
            </select>
            <button
              type="button"
              onClick={refreshData}
              disabled={!showMapControls || isLoadingData}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingData ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
