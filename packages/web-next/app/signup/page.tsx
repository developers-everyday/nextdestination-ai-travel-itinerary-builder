"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50">
      <div className="absolute top-0 left-0 w-full h-96 bg-indigo-50/50 rounded-b-[3rem] -z-0"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -z-0 translate-y-1/2 translate-x-1/3"></div>

      <div className="relative z-10 w-full max-w-md p-10 mx-4 bg-white border border-slate-100/50 rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-200 mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">N</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Create Account</h2>
          <p className="text-slate-500 font-medium">Start your journey with NextDestination</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Create Account"}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px bg-slate-200 flex-1"></div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
          <div className="h-px bg-slate-200 flex-1"></div>
        </div>

        <div className="mt-6">
          <button className="w-full flex items-center justify-center gap-3 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-bold transition-all hover:shadow-md hover:-translate-y-0.5 group">
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="#4285F4" />
            </svg>
            <span className="text-slate-600">Google</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Already have an account?{" "}
            <button onClick={() => router.push("/login")} className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">Log in</button>
          </p>
        </div>
      </div>

      <button
        onClick={() => router.push("/")}
        className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 font-bold text-sm tracking-widest uppercase transition-colors"
      >
        Skip & Browse
      </button>
    </div>
  );
}
