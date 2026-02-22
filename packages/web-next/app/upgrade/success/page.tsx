"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';

function UpgradeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile, session } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId || !session?.access_token) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/stripe/session-status?session_id=${sessionId}`,
          { headers: { 'Authorization': `Bearer ${session.access_token}` } }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'paid') {
            setPlanName(data.plan || 'Explorer');
            setStatus('success');
            await refreshProfile();
          } else {
            setStatus('error');
          }
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error('Failed to verify payment:', err);
        setStatus('error');
      }
    };

    checkStatus();
  }, [searchParams, session, refreshProfile]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="pt-32 px-6 max-w-2xl mx-auto text-center">
        {status === 'loading' && (
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <div className="h-8 bg-slate-200 rounded-xl w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-slate-100 rounded w-48 mx-auto"></div>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
              Welcome to {planName.charAt(0).toUpperCase() + planName.slice(1)}! 🎉
            </h1>
            <p className="text-slate-500 mb-8 text-lg">
              Your plan has been upgraded. Enjoy your expanded trip limits!
            </p>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-8 max-w-sm mx-auto text-left">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">What&apos;s New</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-emerald-500">✓</span> 50 trip generations
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-emerald-500">✓</span> 10 saved trips
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="text-emerald-500">✓</span> Voice agent access
                </li>
              </ul>
            </div>

            <button
              onClick={() => router.push('/profile')}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
            >
              Go to Profile
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 mb-3">Something went wrong</h1>
            <p className="text-slate-500 mb-8">
              We couldn&apos;t verify your payment. If you were charged, don&apos;t worry — your upgrade will be applied shortly.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition"
            >
              Return to Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <UpgradeSuccessContent />
    </Suspense>
  );
}
