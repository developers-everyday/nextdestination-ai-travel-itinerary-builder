// Homepage — SSR page (Week 2 of migration plan)
// Placeholder until SearchHeader, CategoryBar, ItineraryGrid and HomeChatWidget
// are ported with proper server-side data fetching.
export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-6">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-6 shadow-lg shadow-indigo-200">
          N
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
          NextDestination.ai
        </h1>
        <p className="text-slate-500 font-medium">Migration in progress — homepage coming soon.</p>
      </div>
    </main>
  );
}
