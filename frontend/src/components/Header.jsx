import React from 'react';
import { NavLink, Link } from 'react-router-dom';

const navLinkClass = ({ isActive }) =>
  `text-sm sm:text-base md:text-lg font-medium px-1 py-1 border-b-2 whitespace-nowrap transition-colors ${
    isActive
      ? 'text-orange-400 border-orange-400'
      : 'text-gray-300 border-transparent hover:text-white'
  }`;

const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-gray-800 p-3 sm:p-4 shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex items-center justify-center md:justify-self-start space-x-3 min-w-0">
          <Link to="/" aria-label="FlameFlux home" className="block leading-none">
            <img src="/flameflux_logo.png" alt="" className="h-8 w-8 object-contain" />
          </Link>
          <Link to="/" className="text-xl sm:text-2xl font-bold text-white hover:text-gray-200">
            FlameFlux
          </Link>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:grid md:grid-cols-2 md:gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4 md:justify-end md:gap-5">
            <NavLink to="/active-fires" className={navLinkClass}>
              Active Fires
            </NavLink>
            <NavLink to="/about" className={navLinkClass}>
              About Us
            </NavLink>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 sm:gap-x-4 md:justify-start md:gap-5">
            <NavLink to="/team" className={navLinkClass}>
              Team
            </NavLink>
            <NavLink to="/contact" className={navLinkClass}>
              Contact Us
            </NavLink>
          </div>
        </nav>
        <div className="hidden md:block" />
      </div>
    </header>
  );
};

export default Header;
