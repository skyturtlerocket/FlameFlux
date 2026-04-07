import React from 'react';
import Header from '../components/Header';

const timelineEvents = [
  { date: 'January 2025', title: 'FlameFluxV1 Published' },
  { date: 'June 2025', title: 'FlameFlux was born' },
  { date: 'August 2025', title: 'First Prototype' },
];

const Achievements = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Achievements</h1>
          <p className="text-gray-400 mb-10 max-w-2xl mx-auto text-center">
            Timeline and milestones
          </p>

          <section className="mb-14">
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

          <section>
            <h2 className="text-xl font-semibold text-white mb-6 border-b border-gray-700 pb-2">
              Achievements
            </h2>
            <div className="rounded-lg border border-dashed border-gray-600 bg-gray-800/30 min-h-[160px] p-6 text-gray-500 text-sm">
              Add your list of achievements here.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Achievements;
