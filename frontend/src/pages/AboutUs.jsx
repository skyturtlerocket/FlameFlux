import React from 'react';
import Header from '../components/Header';
import { teamMembers } from '../data/teamMembers';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8">About Us</h1>

          <p className="text-lg sm:text-xl text-gray-200 italic mb-8 leading-relaxed">
            In the age of AI, how can we fight fires more effectively?
          </p>

          <div className="space-y-6 text-gray-300 leading-relaxed text-base sm:text-lg">
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
              management from reactive to proactive—helping to protect both people and the landscapes
              we all depend on.
            </p>
          </div>

          <section className="mt-14 pt-10 border-t border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-6">Team</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {teamMembers.map((member) => (
                <article
                  key={member.name}
                  className="rounded-lg border border-gray-600 bg-gray-800/50 p-6 flex items-center gap-5"
                >
                  {member.imageUrl ? (
                    <img src={member.imageUrl} alt="" className="w-24 h-24 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-24 h-24 rounded-full bg-gray-700 shrink-0 flex items-center justify-center text-gray-500 text-xs text-center px-2"
                      aria-hidden
                    >
                      Photo TBD
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                    {member.role && <p className="text-sm text-gray-400 mt-1">{member.role}</p>}
                    <p className="text-gray-400 mt-3 text-sm leading-relaxed">{member.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
