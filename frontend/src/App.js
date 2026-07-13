import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import WildfireDashboard from './components/WildfireDashboard';
import HomePage from './pages/HomePage';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Achievements from './pages/Achievements';
import './App.css';

const GA_MEASUREMENT_ID = 'G-FC7ZV4QN5N';

// Sends a GA4 page_view on each client-side route change. The gtag snippet in
// public/index.html already counts the initial page load, so we skip the first
// render to avoid double-counting it.
function RouteChangeTracker() {
  const location = useLocation();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_location: window.location.href,
        page_title: document.title,
        send_to: GA_MEASUREMENT_ID,
      });
    }
  }, [location]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RouteChangeTracker />
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/active-fires" element={<WildfireDashboard />} />
          <Route path="/about" element={<Achievements />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/team" element={<AboutUs />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
