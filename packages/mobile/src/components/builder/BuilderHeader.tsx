import React from 'react';
import { ChevronLeft, Save, Share2, MoreVertical, Map, List } from 'lucide-react';
import { useHaptic } from '../../hooks/useHaptic';

interface BuilderHeaderProps {
  title: string;
  onBack: () => void;
  onSave: () => void;
  onShare: () => void;
  onMore: () => void;
  viewMode: 'list' | 'map';
  onViewModeChange: (mode: 'list' | 'map') => void;
  isSaving?: boolean;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  title,
  onBack,
  onSave,
  onShare,
  onMore,
  viewMode,
  onViewModeChange,
  isSaving = false,
}) => {
  const haptic = useHaptic();

  const handleBack = async () => {
    await haptic.light();
    onBack();
  };

  const handleSave = async () => {
    await haptic.medium();
    onSave();
  };

  const handleShare = async () => {
    await haptic.light();
    onShare();
  };

  const handleViewModeToggle = async () => {
    await haptic.light();
    onViewModeChange(viewMode === 'list' ? 'map' : 'list');
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
      {/* Left: Back button */}
      <button
        onClick={handleBack}
        className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-slate-700" />
      </button>

      {/* Center: Title */}
      <div className="flex-1 mx-4">
        <h1 className="text-lg font-semibold text-slate-900 text-center truncate">
          {title}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* View Mode Toggle */}
        <button
          onClick={handleViewModeToggle}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          {viewMode === 'list' ? (
            <Map className="w-5 h-5 text-slate-600" />
          ) : (
            <List className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Share2 className="w-5 h-5 text-slate-600" />
        </button>

        {/* More */}
        <button
          onClick={onMore}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>
  );
};
