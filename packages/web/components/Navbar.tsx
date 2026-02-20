import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Download icon component
const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

// Share icon for iOS instructions
const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

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

// Type for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Navbar: React.FC<Props> = ({ onOpenBuilder }) => {
  const { user, loading, userProfile } = useAuth();

  // PWA Install state
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Listen for install prompt (Chrome/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Listen for app installed event
    const installedHandler = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }

    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    }
  };

  const displayName = userProfile?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const roleConfig = userProfile ? ROLE_CONFIG[userProfile.role] : null;
  const planBadge = userProfile ? PLAN_BADGE[userProfile.plan] : null;

  // Show install button if: iOS (always show for instructions) or has install prompt available
  const showInstallButton = !isInstalled && (isIOS || installPrompt);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-md shadow-sm py-3">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg shadow-indigo-200 flex-shrink-0">N</div>
          <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 truncate">NextDestination<span className="opacity-70">.ai</span></span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
          {/* Links removed as per request to move Saved Trips to Profile */}
        </div>

        {/* Right Side - Auth */}
        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* Install App Button */}
          {showInstallButton && (
            <button
              onClick={handleInstall}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
              <DownloadIcon className="w-4 h-4" />
              Install App
            </button>
          )}

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

      {/* iOS Install Instructions Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fade-in" onClick={() => setShowIOSPrompt(false)}>
          <div
            className="bg-white rounded-t-3xl p-6 w-full max-w-md animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Install NextDestination</h3>
            <p className="text-sm text-slate-600 mb-4">Add this app to your home screen for quick access and a native app experience.</p>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                <span>Tap the <strong className="text-slate-900">Share</strong> button <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-100 rounded"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v.01M12 4v.01M20 12v.01M12 20v.01" /></svg></span> in Safari's toolbar</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                <span>Scroll down and tap <strong className="text-slate-900">"Add to Home Screen"</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                <span>Tap <strong className="text-slate-900">Add</strong> to install</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
