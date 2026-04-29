import React from 'react';
import Header from '../components/Header';
import { teamMembers } from '../data/teamMembers';

const timelineEvents = [
  { date: 'March 2026', title: 'FlameFluxV2 in development' },
  { date: 'January 2026', title: 'FlameFluxV1 Published' },
  { date: 'August 2025', title: 'First Prototype' },
  { date: 'June 2025', title: 'FlameFlux was born' },
];

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8">Team</h1>
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
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
