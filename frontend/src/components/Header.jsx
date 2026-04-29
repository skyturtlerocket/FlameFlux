import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium px-2 py-1 rounded-md transition-colors ${
    isActive ? 'bg-gray-700 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
  }`;

const Header = () => {
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
              About Us
            </NavLink>
          </div>
          <div className="flex items-center justify-start gap-1 sm:gap-2">
            <NavLink to="/about" className={navLinkClass}>
              Team
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact Us
            </NavLink>
          </div>
        </nav>
        <div />
      </div>
    </header>
  );
};

export default Header;
