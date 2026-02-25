"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import {
  getSavedItineraries,
  deleteSavedItinerary,
  CommunityItinerary,
  fetchUserItineraries,
  updateItineraryPrivacy,
  updateMyProfile,
  useItineraryStore,
  submitTranscript,
  fetchCreatorItineraries
} from '@nextdestination/shared';
import { supabase } from '@/lib/supabaseClient';
import CommunityItineraryCard from '@/components/CommunityItineraryCard';

const ROLE_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  agent: { icon: '🏷️', label: 'Travel Agent', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  influencer: { icon: '⭐', label: 'Creator', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  explorer: { icon: '🧭', label: 'Explorer', color: 'bg-sky-50 text-sky-700 border-sky-200' }
};

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter', color: 'text-slate-600', bg: 'bg-slate-100' },
  explorer: { label: 'Explorer', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  custom: { label: 'Custom', color: 'text-emerald-600', bg: 'bg-emerald-50' }
};

export default function ProfilePage() {
  const { user, signOut, userProfile, refreshProfile, session } = useAuth();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [bucketList, setBucketList] = useState<CommunityItinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'bucketlist' | 'creator'>('upcoming');
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameText, setNameText] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [creatorStats, setCreatorStats] = useState<{ totalTrips: number; totalViews: number; totalRemixes: number } | null>(null);
  // Creator Tools state
  const [transcript, setTranscript] = useState('');
  const [isSubmittingTranscript, setIsSubmittingTranscript] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [transcriptSuccess, setTranscriptSuccess] = useState<{ id: string; url: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setBioText(userProfile.bio || '');
      setNameText(userProfile.displayName || '');
    }
  }, [userProfile]);

  useEffect(() => {
    const loadData = async () => {
      // Wait until session is available — user is implied by session
      if (!session?.access_token) {
        return;
      }

      const token = session.access_token;

      try {
        try {
          const backendTrips = await fetchUserItineraries(token);
          setItineraries(backendTrips);
        } catch (err) {
          console.error("Failed to fetch backend trips", err);
          const local = await getSavedItineraries();
          setItineraries(local as any[]);
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/wishlist`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          const mapped = data.map((item: any) => ({
            id: item.id,
            name: item.destination ? `Trip to ${item.destination}` : 'Trip',
            location: item.destination,
            destination: item.destination,
            image: item.image || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop',
            creator: {
              id: 'community',
              name: 'Community Member',
              avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + item.id,
              verified: true
            },
            saveCount: item.saveCount || 0,
            duration: item.days?.length || 0,
            tags: ['Wishlisted'],
            category: 'Adventure',
            itinerary: item,
            createdAt: item.wishlistedAt,
            trending: false
          }));
          setBucketList(mapped);
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session]);

  // Load creator stats
  useEffect(() => {
    if (user) {
      fetchCreatorItineraries(user.id)
        .then(trips => {
          if (trips.length > 0) {
            setCreatorStats({
              totalTrips: trips.length,
              totalViews: trips.reduce((s: number, t: any) => s + (t.viewCount || 0), 0),
              totalRemixes: trips.reduce((s: number, t: any) => s + (t.remixCount || 0), 0)
            });
          }
        })
        .catch(() => { /* not critical */ });
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  const handleUpgrade = async (plan: string) => {
    try {
      setUpgrading(true);
      const token = session?.access_token;
      if (!token) {
        alert('Please log in first');
        return;
      }

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || data.error || 'Failed to start checkout');
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleOpenItinerary = (itinerary: any) => {
    useItineraryStore.getState().setItinerary(itinerary);
    router.push('/builder');
  };

  const handleRemix = (itinerary: CommunityItinerary) => {
    const newItinerary = {
      ...itinerary.itinerary,
      id: undefined,
      sourceImage: itinerary.image,
      days: itinerary.itinerary.days?.map((d: any) => ({
        ...d,
        activities: d.activities?.map((a: any) => ({ ...a, id: Math.random().toString(36).substr(2, 9) }))
      })) || []
    };
    useItineraryStore.getState().setItinerary(newItinerary);
    router.push('/builder');
  };

  const handleTogglePrivacy = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    const newStatus = !currentStatus;

    setItineraries(prev => prev.map(i => i.id === id ? { ...i, isPublic: newStatus } : i));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        await updateItineraryPrivacy(id, newStatus, session.access_token);
      }
    } catch (err) {
      console.error("Failed to toggle privacy", err);
      setItineraries(prev => prev.map(i => i.id === id ? { ...i, isPublic: currentStatus } : i));
      alert("Failed to update privacy.");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this itinerary?")) {
      try {
        const { error } = await supabase.from('itineraries').delete().eq('id', id);
        if (error) {
          console.error("Failed to delete from backend", error);
          deleteSavedItinerary(id);
        }
        setItineraries(prev => prev.filter(i => i.id !== id));
      } catch (err) {
        console.error("Exception deleting", err);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="pt-32 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Please log in to view your profile</h2>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="pt-32 px-6 max-w-7xl mx-auto pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* User Details Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 sticky top-32">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  {userProfile?.avatarUrl ? (
                    <Image src={userProfile.avatarUrl} alt={userProfile.displayName || 'User profile avatar'} width={96} height={96} className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100" />
                  ) : (
                    <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-3xl font-black">
                      {(userProfile?.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {userProfile && ROLE_LABELS[userProfile.role] && (
                    <span className={`absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${ROLE_LABELS[userProfile.role].color}`}>
                      {ROLE_LABELS[userProfile.role].icon} {ROLE_LABELS[userProfile.role].label}
                    </span>
                  )}
                </div>

                {editingName ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      value={nameText}
                      onChange={(e) => setNameText(e.target.value)}
                      className="flex-1 text-center text-lg font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      autoFocus
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const token = session?.access_token;
                          if (token) {
                            await updateMyProfile(token, { displayName: nameText });
                            refreshProfile();
                          }
                          setEditingName(false);
                        }
                      }}
                    />
                    <button onClick={async () => {
                      const token = session?.access_token;
                      if (token) {
                        await updateMyProfile(token, { displayName: nameText });
                        refreshProfile();
                      }
                      setEditingName(false);
                    }} className="text-indigo-600 font-bold text-sm hover:text-indigo-700">Save</button>
                  </div>
                ) : (
                  <h1 onClick={() => setEditingName(true)} className="text-2xl font-black text-slate-900 tracking-tight mb-1 cursor-pointer hover:text-indigo-600 transition-colors group" title="Click to edit">
                    {userProfile?.displayName || 'Set Name'} <span className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity text-sm">✏️</span>
                  </h1>
                )}
                <p className="text-slate-500 font-medium text-sm">{user.email}</p>
              </div>

              <div className="space-y-4">
                {userProfile && (
                  <div className={`p-4 rounded-2xl border ${PLAN_LABELS[userProfile.plan]?.bg || 'bg-slate-50'} border-slate-200`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Plan</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_LABELS[userProfile.plan]?.color || ''} ${PLAN_LABELS[userProfile.plan]?.bg || ''}`}>
                        {PLAN_LABELS[userProfile.plan]?.label || userProfile.plan}
                      </span>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Generations</span>
                        <span className="font-bold text-slate-700">{userProfile.generationsUsed} / {userProfile.maxGenerations}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((userProfile.generationsUsed / userProfile.maxGenerations) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">Saved Trips</span>
                        <span className="font-bold text-slate-700">{userProfile.savesUsed} / {userProfile.maxSaves}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((userProfile.savesUsed / userProfile.maxSaves) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {userProfile.plan === 'starter' && (
                      <button
                        onClick={() => handleUpgrade('explorer')}
                        disabled={upgrading}
                        className="w-full mt-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {upgrading ? '⏳ Redirecting...' : '✨ Upgrade Plan'}
                      </button>
                    )}
                    {userProfile.plan === 'explorer' && (
                      <button
                        onClick={() => router.push('/contact')}
                        className="w-full mt-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-xl transition-colors"
                      >
                        💎 Need more? Contact us
                      </button>
                    )}
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Bio</h3>
                  {editingBio ? (
                    <div>
                      <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        className="w-full text-sm text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
                        rows={3}
                        placeholder="Tell us about yourself..."
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={async () => {
                          const token = session?.access_token;
                          if (token) {
                            await updateMyProfile(token, { bio: bioText });
                            refreshProfile();
                          }
                          setEditingBio(false);
                        }} className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Save</button>
                        <button onClick={() => { setEditingBio(false); setBioText(userProfile?.bio || ''); }} className="text-xs font-bold text-slate-400 hover:text-slate-500">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p onClick={() => setEditingBio(true)} className="text-slate-600 text-sm cursor-pointer hover:text-indigo-600 transition-colors" title="Click to edit">
                      {userProfile?.bio || <span className="text-slate-400 italic">Click to add a bio...</span>}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Account</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Member since</span>
                      <span className="text-xs font-medium text-slate-700">
                        {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Last sign in</span>
                      <span className="text-xs font-medium text-slate-700">
                        {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          </div>

          {/* Saved Trips Section */}
          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'bucketlist' ? 'My Bucket List' : activeTab === 'creator' ? 'Creator Tools' : 'My Saved Trips'}
              </h2>

              <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setActiveTab('past')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'past' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Past
                </button>
                <button
                  onClick={() => setActiveTab('bucketlist')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'bucketlist' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Bucket List
                </button>
                <button
                  onClick={() => setActiveTab('creator')}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'creator' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  🎬 Creator
                </button>
              </div>

              <button
                onClick={() => router.push('/')}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Plan New Trip
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="h-48 bg-slate-200 rounded-3xl animate-pulse"></div>
                ))}
              </div>
            ) : activeTab === 'bucketlist' ? (
              <BucketListSection trips={bucketList} onRemix={handleRemix} />
            ) : activeTab === 'creator' ? (
              <CreatorToolsSection
                transcript={transcript}
                setTranscript={setTranscript}
                isSubmitting={isSubmittingTranscript}
                error={transcriptError}
                success={transcriptSuccess}
                fileInputRef={fileInputRef}
                creatorStats={creatorStats}
                userId={user?.id}
                onFileUpload={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
                  if (!['.txt', '.vtt', '.srt'].includes(ext)) {
                    setTranscriptError('Please upload a .txt, .vtt, or .srt file');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (ev) => { setTranscript(ev.target?.result as string); setTranscriptError(null); };
                  reader.readAsText(file);
                }}
                onSubmit={async () => {
                  if (!transcript.trim() || transcript.trim().length < 50) {
                    setTranscriptError('Please paste at least 50 characters of transcript text');
                    return;
                  }
                  if (!session?.access_token) {
                    setTranscriptError('You must be logged in');
                    return;
                  }
                  setIsSubmittingTranscript(true);
                  setTranscriptError(null);
                  setTranscriptSuccess(null);
                  try {
                    const result = await submitTranscript(transcript, session.access_token);
                    setTranscriptSuccess({ id: result.id, url: `${window.location.origin}/share/${result.id}` });
                    setTranscript('');
                  } catch (err: any) {
                    setTranscriptError(err.message || 'Something went wrong');
                  } finally {
                    setIsSubmittingTranscript(false);
                  }
                }}
              />
            ) : (
              <TripsList
                trips={itineraries}
                filter={activeTab}
                onOpen={handleOpenItinerary}
                onDelete={handleDelete}
                onTogglePrivacy={handleTogglePrivacy}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Creator Tools Tab ─────────────────────────────────────────────────────
const CreatorToolsSection: React.FC<{
  transcript: string;
  setTranscript: (v: string) => void;
  isSubmitting: boolean;
  error: string | null;
  success: { id: string; url: string } | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  creatorStats: { totalTrips: number; totalViews: number; totalRemixes: number } | null;
  userId?: string;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}> = ({ transcript, setTranscript, isSubmitting, error, success, fileInputRef, creatorStats, userId, onFileUpload, onSubmit }) => {
  return (
    <div className="space-y-6">
      {/* Creator Stats */}
      {creatorStats && creatorStats.totalTrips > 0 && (
        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl border border-indigo-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Your Creator Stats</h3>
            {userId && (
              <a href={`/creator/${userId}`} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition-colors">
                View Public Profile →
              </a>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Public Trips', value: creatorStats.totalTrips, icon: '🗺️' },
              { label: 'Total Views', value: creatorStats.totalViews, icon: '👀' },
              { label: 'Remixes', value: creatorStats.totalRemixes, icon: '🔄' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 text-center border border-indigo-50">
                <span className="text-xl mb-1 block">{stat.icon}</span>
                <div className="text-2xl font-black text-slate-900">{stat.value.toLocaleString()}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Import Tool */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 hover:border-indigo-200 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-md">
            🎬
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg">Create from Transcript</h3>
            <p className="text-xs text-slate-400 font-medium">Turn your travel video into a shareable itinerary</p>
          </div>
        </div>

        {/* Success State */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎉</div>
              <div className="flex-1">
                <p className="font-bold text-emerald-800 mb-1">Itinerary is building!</p>
                <p className="text-sm text-emerald-600 mb-3">Share this link — your itinerary will appear shortly.</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={success.url}
                    className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm font-mono text-emerald-700 truncate"
                  />
                  <button
                    onClick={() => { navigator.clipboard.writeText(success.url); }}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex-shrink-0"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Textarea + File Upload */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Video Transcript</label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              📎 Upload file
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,.vtt,.srt" onChange={onFileUpload} className="hidden" />
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={`Paste your travel video transcript here...\n\nExample: "Hey guys! Just landed in Bali, day one we visited Tirta Empul temple, had lunch at Locavore..."`}
            rows={8}
            className="w-full resize-none text-slate-800 font-medium text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 placeholder:text-slate-300"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-slate-400">{transcript.length.toLocaleString()} chars {transcript.length > 0 && transcript.length < 50 && '(min 50)'}</span>
            <span className="text-xs text-slate-400">.txt, .vtt, .srt</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-center">
            <p className="text-red-700 font-bold text-sm">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={onSubmit}
          disabled={isSubmitting || transcript.trim().length < 50}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl font-black text-base shadow-lg shadow-indigo-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating share link...
            </>
          ) : (
            <>✨ Generate &amp; Get Share Link</>
          )}
        </button>

        <p className="text-center text-xs text-slate-400 mt-3">
          You&apos;ll get an instant share link — the itinerary builds in the background (10–30s).
        </p>
      </div>
    </div>
  );
};

const BucketListSection: React.FC<{
  trips: CommunityItinerary[];
  onRemix: (item: CommunityItinerary) => void;
}> = ({ trips, onRemix }) => {
  if (trips.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center text-pink-400 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Your Bucket List is empty</h3>
        <p className="text-slate-500 mb-4 max-w-sm mx-auto text-sm">
          Explore community trips and click the heart icon to save your dream destinations here.
        </p>
        <a href="/" className="text-indigo-600 font-bold hover:underline">Explore Trips</a>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map(item => (
          <CommunityItineraryCard
            key={item.id}
            itinerary={item}
            onClick={() => onRemix(item)}
            onRemix={() => onRemix(item)}
          />
        ))}
      </div>
    </div>
  );
};

const TripsList: React.FC<{
  trips: any[];
  filter: 'upcoming' | 'past';
  onOpen: (item: any) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onTogglePrivacy: (e: React.MouseEvent, id: string, current: boolean) => void;
}> = ({ trips, filter, onOpen, onDelete, onTogglePrivacy }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Deduplicate by id first — guards against stale DB rows with the same metadata.id
  const uniqueTrips = trips.filter((trip, index, self) =>
    index === self.findIndex(t => t.id === trip.id)
  );

  const filteredTrips = uniqueTrips.filter(trip => {
    if (!trip.startDate) return filter === 'upcoming';
    const tripDate = new Date(trip.startDate);
    return filter === 'upcoming' ? tripDate >= today : tripDate < today;
  });

  if (filteredTrips.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">No {filter} trips found</h3>
        <p className="text-slate-500 mb-0 max-w-sm mx-auto text-sm">
          {filter === 'upcoming'
            ? "You don't have any upcoming trips planned yet."
            : "You don't have any past trips in your history."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {filteredTrips.map((item) => (
        <div
          key={item.id}
          onClick={() => onOpen(item)}
          className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-pointer hover:-translate-y-1 relative flex flex-col"
        >
          <div className="aspect-[3/4] bg-slate-200 relative overflow-hidden">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.destination}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            ) : (
              <>
                <div
                  className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 group-hover:scale-105 transition-transform duration-500"
                  style={{ filter: `hue-rotate(${item.destination.split('').reduce((a: number, b: string) => a + b.charCodeAt(0), 0) % 360}deg)` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-black text-3xl drop-shadow-lg tracking-tight uppercase text-center px-4">{item.destination}</span>
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold border border-white/30">
              {item.days.length} Days
            </div>

            <div
              onClick={(e) => onTogglePrivacy(e, item.id, item.isPublic)}
              className={`absolute top-4 left-4 backdrop-blur-md px-2 py-1 rounded-md text-white/90 text-[10px] font-bold border flex items-center gap-1 cursor-pointer transition-all hover:scale-105 active:scale-95 z-10
                ${item.isPublic ? 'bg-amber-500/60 border-amber-400/50 hover:bg-amber-500/80' : 'bg-black/50 border-white/10 hover:bg-black/70'}`}
              title={item.isPublic ? "Click to make Private" : "Click to make Public"}
            >
              {('isPublic' in item) ? (item.isPublic ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Public
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Private
                </>
              )) : null}
            </div>

            {item.startDate && (
              <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-bold border border-white/10 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(item.startDate).toLocaleDateString()}
              </div>
            )}
          </div>

          <div className="p-6 flex-1 flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors line-clamp-1">
              {item.name || `Trip to ${item.destination}`}
            </h3>
            {item.startDate ? (
              <p className="text-slate-500 text-sm font-medium mb-4">
                Starts on {new Date(item.startDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            ) : (
              <p className="text-slate-400 text-sm font-medium italic mb-4">No date set</p>
            )}

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Created {new Date(item.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <button
                onClick={(e) => onDelete(e, item.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                title="Delete Trip"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
