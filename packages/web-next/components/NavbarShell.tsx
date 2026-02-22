// Static navbar used by SSG pages during migration.
// Will be replaced by the full client Navbar (with auth + PWA) in Phase 2.
import Link from "next/link";

export default function NavbarShell() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm py-3">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-indigo-200">
            N
          </div>
          <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            NextDestination<span className="opacity-70">.ai</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/login"
            className="px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold text-slate-900 hover:bg-slate-100 transition-all text-sm md:text-base"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold shadow-lg shadow-indigo-200 transition-all text-sm md:text-base"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
