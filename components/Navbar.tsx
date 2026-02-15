import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface Props {
  onOpenBuilder?: () => void;
}

const ROLE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  agent: { icon: '🏷️', label: 'Agent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  influencer: { icon: '⭐', label: 'Creator', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  explorer: { icon: '', label: '', color: '' }
};

const PLAN_BADGE: Record<string, { icon: string; color: string }> = {
  custom: { icon: '💎', color: 'text-emerald-600' },
  explorer: { icon: '✨', color: 'text-indigo-600' },
  starter: { icon: '', color: '' }
};

const Navbar: React.FC<Props> = ({ onOpenBuilder }) => {
  const { user, loading, userProfile } = useAuth();

  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const roleConfig = userProfile ? ROLE_CONFIG[userProfile.role] : null;
  const planBadge = userProfile ? PLAN_BADGE[userProfile.plan] : null;

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
              {/* Role Badge (only for non-explorer roles) */}
              {roleConfig && roleConfig.label && (
                <span className={`hidden md:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${roleConfig.color}`}>
                  {roleConfig.icon} {roleConfig.label}
                </span>
              )}

              <Link to="/profile" className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full hover:bg-slate-100 transition-all group">
                {/* Avatar */}
                <div className="relative">
                  {userProfile?.avatarUrl ? (
                    <img
                      src={userProfile.avatarUrl}
                      alt={displayName}
                      className="w-8 h-8 rounded-full border border-indigo-200 group-hover:border-indigo-300 transition-colors object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 group-hover:bg-indigo-200 transition-colors">
                      {avatarInitial}
                    </div>
                  )}
                  {/* Plan icon overlay */}
                  {planBadge && planBadge.icon && (
                    <span className={`absolute -bottom-0.5 -right-0.5 text-[10px] ${planBadge.color}`}>
                      {planBadge.icon}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-700 group-hover:text-slate-900 hidden md:inline max-w-[120px] truncate">
                  {displayName}
                </span>
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
