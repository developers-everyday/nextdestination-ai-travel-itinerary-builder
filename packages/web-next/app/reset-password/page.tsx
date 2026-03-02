"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (updateError) {
      if (updateError.message.includes("same password")) {
        setError("New password must be different from your current password.");
      } else if (updateError.message.includes("session")) {
        setError("Your reset session has expired. Please request a new password reset link.");
      } else {
        setError(updateError.message);
      }
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50">
        <div className="absolute top-0 left-0 w-full h-96 bg-indigo-50/50 rounded-b-[3rem] -z-0"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -z-0 translate-y-1/2 translate-x-1/3"></div>

        <div className="relative z-10 w-full max-w-md p-10 mx-4 bg-white border border-slate-100/50 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] text-center">
          <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-green-200 mx-auto mb-6">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Password Updated</h2>
          <p className="text-slate-500 font-medium mb-8">
            Your password has been successfully reset. You&apos;re all set!
          </p>
          <button
            onClick={() => router.replace("/")}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-lg"
          >
            Continue to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50">
      <div className="absolute top-0 left-0 w-full h-96 bg-indigo-50/50 rounded-b-[3rem] -z-0"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -z-0 translate-y-1/2 translate-x-1/3"></div>

      <div className="relative z-10 w-full max-w-md p-10 mx-4 bg-white border border-slate-100/50 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-200 mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">N</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Set New Password</h2>
          <p className="text-slate-500 font-medium">Choose a strong password for your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-bold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="text-xs text-slate-400 ml-1">Must be at least 6 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
