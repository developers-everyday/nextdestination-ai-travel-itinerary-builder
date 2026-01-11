import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  onOpenBuilder?: () => void;
}

const Navbar: React.FC<Props> = ({ onOpenBuilder }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md shadow-sm py-3">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">N</div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">NextDestination<span className="opacity-70">.ai</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          <Link to="/saved-trips" className="hover:text-indigo-600 transition-colors">Saved Trips</Link>
          <Link to="/builder" className="hover:text-indigo-600 transition-colors">Itinerary Builder</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="px-5 py-2.5 rounded-full font-semibold transition-all text-slate-900 hover:bg-slate-100">
            Log In
          </Link>
          <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-indigo-200 transition-all">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
