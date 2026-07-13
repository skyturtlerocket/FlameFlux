import React from 'react';
import Header from '../components/Header';

const SCIENCE_SECTIONS = [
  {
    title: 'Vegetation Data',
    body: "We use Landsat 8 Bands 2-5 along with NDVI (Normalized Difference Vegetation Index) to capture vegetation health, moisture, and density. Drier, denser vegetation burns more readily, so these layers help the model understand available fuel across the landscape.",
    imageUrl: '/NDVI.png',
  },
  {
    title: 'Topographic Data',
    body: 'Elevation, slope, and aspect are derived from USGS SRTM digital elevation models. Terrain shapes how fire moves — it spreads faster uphill, and slope and aspect affect sun exposure and wind channeling, both of which influence fire behavior.',
    imageUrl: '/DEM.png',
  },
  {
    title: 'Meteorological Data',
    body: 'Hourly forecasts for wind speed and direction, humidity, temperature, dew point, pressure trends, and precipitation are pulled from the Open-Meteo API. Together they give the model a 24-hour outlook on the atmospheric conditions that drive how quickly and in what direction a fire spreads.',
    imageUrl: '/windmap.png',
  },
  {
    title: 'Model Architecture',
    body: 'A two-branch convolutional neural network fuses a spatial patch (thermal hotspots, terrain, and vegetation layers) with an eight-variable weather vector. The two branches merge and pass through a fusion layer to a sigmoid output, estimating next-day burn probability for each pixel around the fire perimeter.',
    imageUrl: '/fireprediction.png',
  },
];

const SectionImage = ({ src, alt }) => (
  <img
    src={src}
    alt={alt}
    className="w-full sm:w-96 aspect-[4/3] shrink-0 rounded-lg object-cover"
  />
);

const Achievements = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8">About Us</h1>

          <div className="space-y-6 text-gray-300 leading-relaxed text-base sm:text-lg mb-14">
            <p>
              FlameFlux is a next-generation platform designed to tackle one of the most pressing
              challenges of our time: increasingly severe and unpredictable wildfires. As climate
              change drives hotter temperatures, drier landscapes, and longer fire seasons, traditional
              fire management tools have struggled to keep pace. Our mission is to provide communities,
              fire agencies, and policymakers with accurate, real-time predictions that enable faster,
              smarter, and more effective wildfire response.
            </p>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Methodology</h2>
          <div className="space-y-8 mb-14">
            {SCIENCE_SECTIONS.map((section, index) => (
              <div
                key={section.title}
                className={`rounded-lg border border-gray-600 bg-gray-800/50 p-8 flex flex-col sm:items-center gap-8 ${
                  index % 2 === 1 ? 'sm:flex-row-reverse' : 'sm:flex-row'
                }`}
              >
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white mb-3">{section.title}</h3>
                  <p className="text-gray-300 leading-relaxed text-base sm:text-lg">{section.body}</p>
                </div>
                <SectionImage src={section.imageUrl} alt={section.title} />
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
};

export default Achievements;
