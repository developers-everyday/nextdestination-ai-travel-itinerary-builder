import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, fetchMyProfile, UserProfile } from '@nextdestination/shared';
import { Session, User } from '@supabase/supabase-js';
import { isNative } from '../capacitor';

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
    signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
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
    refreshProfile: async () => { },
    signInWithGoogle: async () => { },
    signInWithEmail: async () => ({ error: null }),
    signUpWithEmail: async () => ({ error: null }),
    signOut: async () => { },
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
            console.error('Failed to load user profile:', err);
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
                window.history.replaceState(null, '', window.location.pathname);
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

    const isAgent = userProfile?.role === 'agent';
    const isInfluencer = userProfile?.role === 'influencer';
    const isPro = userProfile?.plan === 'explorer' || userProfile?.plan === 'custom';

    const signInWithGoogle = async () => {
        const redirectUrl = isNative
            ? 'nextdestination://auth/callback'
            : window.location.origin;

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl
            }
        });
        if (error) {
            console.error('Error logging in with Google:', error.message);
            if (error.message.includes('Unsupported provider')) {
                alert('Google Login is not enabled. Please enable the Google provider in your Supabase Dashboard under Authentication > Providers.');
            } else {
                alert(`Login failed: ${error.message}`);
            }
        }
    };

    const signInWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const signUpWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error: error as Error | null };
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error logging out:', error.message);
        setUserProfile(null);
    };

    return (
        <AuthContext.Provider value={{
            session, user, loading,
            userProfile, profileLoading,
            canGenerate, canSave,
            isAgent, isInfluencer, isPro,
            refreshProfile,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            signOut
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
