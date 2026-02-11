import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  onOpenBuilder?: () => void;
}


const Navbar: React.FC<Props> = ({ onOpenBuilder }) => {
  const { user, loading } = useAuth();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md shadow-sm py-3">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-indigo-200">N</div>
          <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">NextDestination<span className="opacity-70">.ai</span></span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          {/* Links removed as per request to move Saved Trips to Profile */}
        </div>

        {/* Right Side - Auth */}
        <div className="flex items-center gap-2 md:gap-4">
          {loading ? (
            <div className="w-24 h-10 bg-slate-100 rounded-full animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-slate-100 transition-all group">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 group-hover:bg-indigo-200 transition-colors">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900 hidden md:inline">Profile</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <Link to="/login" className="px-3 py-2 md:px-5 md:py-2.5 rounded-full font-semibold transition-all text-slate-900 hover:bg-slate-100 text-sm md:text-base whitespace-nowrap">
                Log In
              </Link>
              <Link to="/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full font-semibold shadow-lg shadow-indigo-200 transition-all text-sm md:text-base whitespace-nowrap">
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
