import React from 'react';
import Header from '../components/Header';
import { teamMembers } from '../data/teamMembers';

const AboutUs = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-10 sm:py-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-8">Team</h1>
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
