import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { PresenceService } from '@/lib/presenceService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string, firstName: string, lastName: string, skills?: string[], positions?: string[]) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to clear all Supabase-related localStorage data
  const clearSupabaseStorage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Get all localStorage keys
        const keys = Object.keys(localStorage);
        
        // Remove all keys that start with 'sb-' (Supabase keys)
        keys.forEach(key => {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        });
        
        console.log('Cleared Supabase localStorage data');
      } catch (error) {
        console.error('Error clearing localStorage:', error);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Error getting session:', error);
          // Clear any stale session data
          clearSupabaseStorage();
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else if (session) {
          console.log('Initial session found:', session.user.id);
          setSession(session);
          setUser(session.user);
          // Initialize presence tracking when user logs in
          try {
            await PresenceService.initializePresence();
          } catch (presenceError) {
            console.error('Error initializing presence:', presenceError);
          }
        } else {
          console.log('No initial session found');
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          // Clear storage on any session error
          clearSupabaseStorage();
          setSession(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state change:', event, session?.user?.id);
      
      try {
        if (event === 'TOKEN_REFRESHED' && !session) {
          // If token refresh failed, clear all Supabase storage and sign out
          console.log('Token refresh failed, clearing storage and signing out');
          clearSupabaseStorage();
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else if (event === 'SIGNED_IN' && session) {
          console.log('User signed in:', session.user.id);
          setSession(session);
          setUser(session.user);
          // Initialize presence when user signs in
          try {
            await PresenceService.initializePresence();
          } catch (presenceError) {
            console.error('Error initializing presence on sign in:', presenceError);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
          // Clean up presence when user signs out
          try {
            await PresenceService.cleanup();
          } catch (presenceError) {
            console.error('Error cleaning up presence:', presenceError);
          }
          // Clear storage on sign out
          clearSupabaseStorage();
          setSession(null);
          setUser(null);
        } else if (session) {
          // Handle other events with valid session
          setSession(session);
          setUser(session.user);
        } else {
          // Handle events without session
          setSession(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // On error, clear storage and state
        clearSupabaseStorage();
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);
    });

    // Clean up presence on app close/refresh
    const handleBeforeUnload = () => {
      PresenceService.cleanup();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        return { error: error.message };
      }

      if (data.user && data.session) {
        console.log('Sign in successful:', data.user.id);
        // State will be updated by the auth state change listener
        return {};
      } else {
        return { error: 'No user data returned' };
      }
    } catch (error) {
      console.error('Sign in exception:', error);
      return { error: 'An unexpected error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string, username: string, firstName: string, lastName: string, skills?: string[], positions?: string[]) => {
    try {
      console.log('Attempting to sign up with:', email, username);

      // First check if username is already taken
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle();

      if (existingProfile) {
        return { error: 'Username already exists. Please choose a different username.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            skills: skills || [],
            positions: positions || [],
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        return { error: error.message };
      }

      if (data.user) {
        console.log('Sign up successful:', data.user.id);
        
        // The profile will be created automatically by the database trigger
        // But let's also ensure it's created with a manual insert as backup
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
              {
                id: data.user.id,
                username: username.trim(),
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                full_name: `${firstName.trim()} ${lastName.trim()}`,
                skills: skills || [],
                positions: positions || [],
                location: 'Beograd',
                bio: 'Strastveni sportista koji voli da igra u slobodno vreme. Uvek spreman za novi izazov!',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ], {
              onConflict: 'id'
            });

          if (profileError) {
            console.error('Error creating/updating profile:', profileError);
            // Don't return error here as the user account was created successfully
          } else {
            console.log('Profile created/updated successfully');
          }
        } catch (profileError) {
          console.error('Profile creation exception:', profileError);
        }
      }

      return {};
    } catch (error) {
      console.error('Sign up exception:', error);
      return { error: 'An unexpected error occurred during sign up' };
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting sign out process');
      
      // Clean up presence before signing out
      try {
        await PresenceService.cleanup();
        console.log('Presence cleanup completed');
      } catch (presenceError) {
        console.error('Error cleaning up presence:', presenceError);
        // Continue with logout even if presence cleanup fails
      }
      
      // Clear Supabase storage first
      clearSupabaseStorage();
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase sign out error:', error);
      } else {
        console.log('Supabase sign out successful');
      }
      
      // Force clear local state immediately
      setSession(null);
      setUser(null);
      
      console.log('Sign out complete');
    } catch (error) {
      console.error('Error during sign out:', error);
      // Force clear state and storage even if there's an error
      clearSupabaseStorage();
      setSession(null);
      setUser(null);
      console.log('Forced local state clear due to error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};