
import React from 'react';

const Features: React.FC = () => {
  const features = [
    {
      title: "Advanced Itinerary Builder",
      desc: "Create your perfect itinerary with integrated hotel search and flight schedule information to plan every detail seamlessly.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      title: "Visual Trip Planning",
      desc: "Visualize your entire journey on an integrated map. See where you'll stay, explore activities, and understand your trip at a glance.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      title: "Shared Inspirations",
      desc: "Browse successful itineraries created by world travelers. Remix their favorites with your own personal AI twist.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Everything You Need for the Perfect Trip</h2>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">Custom itineraries built on real traveler experiences, enhanced by AI.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
          {features.map((f, i) => (
            <div key={i} className="group relative">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500 shadow-lg shadow-indigo-100/50 group-hover:shadow-indigo-300">
                {f.icon}
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed text-lg font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
