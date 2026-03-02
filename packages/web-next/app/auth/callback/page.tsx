"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let handled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (handled) return;

      if (event === "PASSWORD_RECOVERY") {
        handled = true;
        router.replace("/reset-password");
        return;
      }

      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        handled = true;
        router.replace("/");
      }
    });

    // Safety timeout — if no auth event fires within 10s, the link is likely expired/invalid
    const timeout = setTimeout(() => {
      if (!handled) {
        handled = true;
        setError(true);
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-sm mx-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-6">
            This link may have expired or is invalid. Please try again.
          </p>
          <button
            onClick={() => router.replace("/login")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-slate-500 text-sm font-medium">Completing sign in…</p>
      </div>
    </div>
  );
}
