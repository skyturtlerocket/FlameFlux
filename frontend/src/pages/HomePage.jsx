import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const SLIDES = [
  {
    src: '/fireprediction.png',
    caption: 'AI-driven spread predictions before fires escalate.',
  },
  {
    src: '/heatsignatures.png',
    caption: 'Satellite heat signatures reveal emerging hotspots.',
  },
  {
    src: '/activefires.png',
    caption: 'Live active fire perimeters tracked in real time.',
  },
];

const SLIDE_INTERVAL_MS = 5000;

const HomePage = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white">
      <Header />

      <div className="relative flex-1 min-h-[60vh] overflow-hidden flex flex-col">
        <div
          className="absolute inset-0 bg-gradient-to-br from-orange-950/90 via-gray-900 to-gray-950 z-0"
          aria-hidden
        />

        <main className="relative z-10 flex-1 grid grid-cols-1 sm:grid-cols-2 items-center gap-10 xl:gap-16 px-4 sm:px-8 xl:px-16 py-16 max-w-7xl 2xl:max-w-[96rem] mx-auto w-full">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <p className="text-sm xl:text-base uppercase tracking-[0.2em] text-orange-300/90 mb-4 font-medium">
              Wildfire intelligence
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl xl:text-7xl 2xl:text-8xl font-bold leading-tight mb-6 drop-shadow-lg">
              Predict early.
              <span className="block text-orange-400 mt-1">Act faster.</span>
            </h1>
            <p className="text-lg sm:text-xl xl:text-2xl text-gray-200 max-w-2xl xl:max-w-3xl mb-10 leading-relaxed drop-shadow-md">
              Live perimeters, satellite context, and AI-driven spread outlooks built for agencies,
              communities, and anyone on the front lines of wildfire season.
            </p>
            <div className="flex justify-center sm:justify-start">
              <Link
                to="/active-fires"
                className="inline-flex items-center gap-2 px-8 py-3 xl:px-10 xl:py-4 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700/80 text-white font-semibold xl:text-lg shadow-lg shadow-black/30 transition-colors"
              >
                Active Fires Map
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5 xl:w-6 xl:h-6"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div className="w-full max-w-md lg:max-w-lg xl:max-w-2xl 2xl:max-w-3xl mx-auto sm:mx-0">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
              {SLIDES.map((slide, index) => (
                <div
                  key={slide.src}
                  className="absolute inset-0 transition-opacity duration-[800ms] ease-in-out"
                  style={{ opacity: index === activeIndex ? 1 : 0 }}
                  aria-hidden={index !== activeIndex}
                >
                  <img
                    src={slide.src}
                    alt={slide.caption}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <p className="absolute bottom-0 left-0 right-0 px-4 py-3 text-sm sm:text-base font-medium text-white drop-shadow-md">
                    {slide.caption}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 mt-4">
              {SLIDES.map((slide, index) => (
                <button
                  key={slide.src}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show slide ${index + 1}: ${slide.caption}`}
                  aria-current={index === activeIndex}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'w-8 bg-orange-500'
                      : 'w-2.5 bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
