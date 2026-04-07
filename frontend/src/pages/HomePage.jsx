import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const HERO_VIDEO_SRC = '/wildfire_bg.mp4';

const HomePage = () => {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Header />

      <div className="relative flex-1 min-h-[60vh] overflow-hidden flex flex-col">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-orange-950/90 via-gray-900 to-gray-950 z-0"
            aria-hidden
          />
          {!videoFailed && (
            <div className="home-hero-pan absolute inset-0 z-[1] w-full h-full">
              <video
                className="w-full h-full min-w-full min-h-full object-cover scale-110"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden
                onError={() => setVideoFailed(true)}
              >
                <source src={HERO_VIDEO_SRC} type="video/mp4" />
              </video>
            </div>
          )}
          <div
            className="absolute inset-0 z-[2] bg-gradient-to-t from-gray-950/95 via-gray-950/75 to-orange-950/30 pointer-events-none"
            aria-hidden
          />
        </div>

        <main className="relative z-10 flex-1 flex flex-col justify-center px-4 sm:px-8 py-16 max-w-4xl mx-auto w-full">
        <p className="text-sm uppercase tracking-[0.2em] text-orange-300/90 mb-4 font-medium">
          Wildfire intelligence
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6 drop-shadow-lg">
          Predict early.
          <span className="block text-orange-400 mt-1">Act faster.</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-200 max-w-2xl mb-10 leading-relaxed drop-shadow-md mx-auto text-center">
          Live perimeters, satellite context, and AI-driven spread outlooks built for agencies,
          communities, and anyone on the front lines of wildfire season.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/active-fires"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-900/40 transition-colors"
          >
            Open Active Fires map
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 backdrop-blur-sm font-semibold transition-colors"
          >
            About FlameFlux
          </Link>
        </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
