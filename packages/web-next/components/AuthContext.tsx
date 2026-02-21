"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { fetchMyProfile } from "@nextdestination/shared";
import type { UserProfile } from "@nextdestination/shared";
import type { Session, User } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  profileLoading: boolean;
  canGenerate: boolean;
  canSave: boolean;
  isAgent: boolean;
  isInfluencer: boolean;
  isPro: boolean;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  userProfile: null,
  profileLoading: false,
  canGenerate: true,
  canSave: true,
  isAgent: false,
  isInfluencer: false,
  isPro: false,
  refreshProfile: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      setUserProfile(null);
      return;
    }

    try {
      setProfileLoading(true);
      const profile = await fetchMyProfile(currentSession.access_token);
      setUserProfile(profile);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [session, loadProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) {
        loadProfile(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Clear the hash from the URL after successful login
      if (session && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Handle post-login redirect (e.g., anonymous user was on /planning-suggestions)
      if (session && _event === "SIGNED_IN") {
        const pending = sessionStorage.getItem("postLoginRedirect");
        if (pending) {
          sessionStorage.removeItem("postLoginRedirect");
          try {
            const { from, ...rest } = JSON.parse(pending);
            if (from && from !== "/") {
              // Save destination in sessionStorage so the target page can read it
              if (rest.destination) {
                sessionStorage.setItem("redirectDestination", rest.destination);
              }
              window.location.replace(from);
              return; // Skip further processing — page will reload
            }
          } catch (e) {
            console.error("Failed to parse postLoginRedirect:", e);
          }
        }
      }

      // Load profile on login, clear on logout
      if (session) {
        loadProfile(session);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  // Computed helpers
  const canGenerate = userProfile
    ? userProfile.generationsUsed < userProfile.maxGenerations
    : true;

  const canSave = userProfile
    ? userProfile.savesUsed < userProfile.maxSaves
    : true;

  const isAgent = userProfile?.role === "agent";
  const isInfluencer = userProfile?.role === "influencer";
  const isPro =
    userProfile?.plan === "explorer" || userProfile?.plan === "custom";

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Error logging in with Google:", error.message);
      if (error.message.includes("Unsupported provider")) {
        alert(
          "Google Login is not enabled. Please enable the Google provider in your Supabase Dashboard under Authentication > Providers."
        );
      } else {
        alert(`Login failed: ${error.message}`);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error logging out:", error.message);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        userProfile,
        profileLoading,
        canGenerate,
        canSave,
        isAgent,
        isInfluencer,
        isPro,
        refreshProfile,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
