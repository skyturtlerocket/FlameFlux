import React from 'react';
import Header from '../components/Header';

const timelineEvents = [
  { date: 'March 2026', title: 'FlameFluxV2 in development' },
  { date: 'January 2026', title: 'FlameFluxV1 Published' },
  { date: 'August 2025', title: 'First Prototype' },
  { date: 'June 2025', title: 'FlameFlux was born' },
];

const Achievements = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8">About Us</h1>

          <p className="text-lg sm:text-xl text-gray-200 italic mb-8 leading-relaxed">
            In the age of AI, how can we fight fires more effectively?
          </p>

          <div className="space-y-6 text-gray-300 leading-relaxed text-base sm:text-lg mb-14">
            <p>
              FlameFlux is a next-generation platform designed to tackle one of the most pressing
              challenges of our time: increasingly severe and unpredictable wildfires. As climate
              change drives hotter temperatures, drier landscapes, and longer fire seasons, traditional
              fire management tools have struggled to keep pace. Our mission is to provide communities,
              fire agencies, and policymakers with accurate, real-time predictions that enable faster,
              smarter, and more effective wildfire response.
            </p>
            <p>
              Built on cutting-edge artificial intelligence, FlameFlux integrates live satellite imagery,
              atmospheric data, and active fire perimeters to deliver wildfire spread forecasts up to 24
              hours in advance. Our convolutional neural network processes terrain, vegetation, and
              weather conditions in near real-time, producing high-resolution burn-probability maps that
              can be visualized interactively or exported to GIS tools. This data-driven approach
              eliminates the lag and complexity of conventional physics-based models, empowering first
              responders with timely insights to optimize resource allocation and guide life-saving
              evacuation decisions.
            </p>
            <p>
              As wildfires threaten more lives, homes, and ecosystems every year, FlameFlux offers a
              scalable, open-source solution that evolves with the needs of its users. By combining
              innovation, transparency, and community collaboration, we aim to transform wildfire
              management from reactive to proactive, helping to protect both people and the landscapes
              we all depend on.
            </p>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
              Timeline
            </h2>
            <div className="rounded-lg border border-dashed border-gray-600 bg-gray-800/30 p-6">
              <div className="relative py-2">
                <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px bg-gray-600" />
                <ul className="space-y-8">
                  {timelineEvents.map((event, index) => {
                    const isLeft = index % 2 === 0;

                    return (
                      <li key={event.date} className="relative md:grid md:grid-cols-2 md:gap-8">
                        <div
                          className={`pl-10 md:pl-0 ${
                            isLeft
                              ? 'md:pr-10 md:text-right md:flex md:justify-end'
                              : 'md:col-start-2 md:pl-10 md:text-left md:flex md:justify-start'
                          }`}
                        >
                          <article className="inline-block w-fit max-w-full rounded-lg border border-gray-600 bg-gray-800/60 p-4 text-gray-200">
                            <p className="text-sm font-semibold text-orange-300">{event.date}</p>
                            <p className="mt-1">{event.title}</p>
                          </article>
                        </div>
                        <span className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-5 h-3 w-3 rounded-full bg-orange-400 ring-4 ring-gray-900" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default Achievements;
