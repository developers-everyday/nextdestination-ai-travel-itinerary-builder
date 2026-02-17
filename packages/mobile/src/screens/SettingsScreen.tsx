import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Key,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { SafeAreaView, MobileButton, MobileInput, BottomSheet } from '../components/ui';
import { useAuth } from '../components/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
import { useSettingsStore, useItineraryStore } from '@nextdestination/shared';

export const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const haptic = useHaptic();
  const { theme, setTheme } = useItineraryStore();
  const { mapboxToken, elevenLabsAgentId, setMapboxToken, setElevenLabsAgentId } = useSettingsStore();

  const [showApiKeys, setShowApiKeys] = useState(false);
  const [tempMapboxToken, setTempMapboxToken] = useState(mapboxToken);
  const [tempElevenLabsId, setTempElevenLabsId] = useState(elevenLabsAgentId);

  const handleBack = async () => {
    await haptic.light();
    navigate(-1);
  };

  const handleThemeToggle = async () => {
    await haptic.light();
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSaveApiKeys = async () => {
    await haptic.success();
    setMapboxToken(tempMapboxToken);
    setElevenLabsAgentId(tempElevenLabsId);
    setShowApiKeys(false);
  };

  const handleSignOut = async () => {
    await haptic.warning();
    await signOut();
    navigate('/');
  };

  const SettingsRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    value?: string;
    onPress?: () => void;
    danger?: boolean;
    rightElement?: React.ReactNode;
  }> = ({ icon, label, value, onPress, danger, rightElement }) => (
    <button
      onClick={onPress}
      className={`w-full flex items-center justify-between p-4 bg-white rounded-xl ${
        onPress ? 'active:bg-slate-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`${danger ? 'text-red-500' : 'text-slate-500'}`}>{icon}</div>
        <span className={`font-medium ${danger ? 'text-red-500' : 'text-slate-900'}`}>
          {label}
        </span>
      </div>
      {rightElement || (
        <div className="flex items-center gap-2">
          {value && <span className="text-sm text-slate-500">{value}</span>}
          {onPress && <ChevronRight className="w-5 h-5 text-slate-400" />}
        </div>
      )}
    </button>
  );

  return (
    <SafeAreaView className="min-h-screen bg-slate-100" edges={['top', 'bottom']}>
      {/* Header */}
      <div className="flex items-center px-4 py-3 bg-white border-b border-slate-100">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="flex-1 text-center text-lg font-semibold text-slate-900 -ml-8">
          Settings
        </h1>
      </div>

      <div className="px-4 py-6 space-y-6 overflow-y-auto">
        {/* Appearance */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Appearance
          </h2>
          <div className="space-y-2">
            <SettingsRow
              icon={theme === 'light' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              label="Theme"
              value={theme === 'light' ? 'Light' : 'Dark'}
              onPress={handleThemeToggle}
            />
          </div>
        </div>

        {/* Developer */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Developer
          </h2>
          <div className="space-y-2">
            <SettingsRow
              icon={<Key className="w-5 h-5" />}
              label="API Keys"
              value="Configure"
              onPress={() => setShowApiKeys(true)}
            />
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Notifications
          </h2>
          <div className="space-y-2">
            <SettingsRow
              icon={<Bell className="w-5 h-5" />}
              label="Push Notifications"
              value="Coming soon"
            />
          </div>
        </div>

        {/* Support */}
        <div>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Support
          </h2>
          <div className="space-y-2">
            <SettingsRow
              icon={<HelpCircle className="w-5 h-5" />}
              label="Help Center"
              rightElement={<ExternalLink className="w-5 h-5 text-slate-400" />}
              onPress={() => window.open('https://nextdestination.ai/help', '_blank')}
            />
            <SettingsRow
              icon={<Shield className="w-5 h-5" />}
              label="Privacy Policy"
              rightElement={<ExternalLink className="w-5 h-5 text-slate-400" />}
              onPress={() => window.open('https://nextdestination.ai/privacy', '_blank')}
            />
          </div>
        </div>

        {/* Account */}
        {user && (
          <div>
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
              Account
            </h2>
            <div className="space-y-2">
              <SettingsRow
                icon={<LogOut className="w-5 h-5" />}
                label="Sign Out"
                danger
                onPress={handleSignOut}
              />
            </div>
          </div>
        )}

        {/* App Version */}
        <div className="text-center pt-4">
          <p className="text-sm text-slate-400">NextDestination v1.0.0</p>
        </div>
      </div>

      {/* API Keys Sheet */}
      <BottomSheet
        isOpen={showApiKeys}
        onClose={() => setShowApiKeys(false)}
        title="API Keys"
        snapPoints={[60]}
      >
        <div className="space-y-4">
          <MobileInput
            label="Mapbox Token"
            placeholder="pk.eyJ..."
            value={tempMapboxToken}
            onChange={(e) => setTempMapboxToken(e.target.value)}
          />
          <MobileInput
            label="ElevenLabs Agent ID"
            placeholder="agent_..."
            value={tempElevenLabsId}
            onChange={(e) => setTempElevenLabsId(e.target.value)}
          />
          <MobileButton fullWidth onClick={handleSaveApiKeys}>
            Save API Keys
          </MobileButton>
        </div>
      </BottomSheet>
    </SafeAreaView>
  );
};
