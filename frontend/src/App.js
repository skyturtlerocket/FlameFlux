import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WildfireDashboard from './components/WildfireDashboard';
import HomePage from './pages/HomePage';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Achievements from './pages/Achievements';
import './App.css';

function App() {
  return (
    <BrowserRouter>
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
