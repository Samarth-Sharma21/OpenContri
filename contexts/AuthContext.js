'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseClient] = useState(() => createSupabaseClient());

  // Fetch user profile from Supabase
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event);
        console.log('Session exists:', !!session);
        
        const currentUser = session?.user || null;
        setUser(currentUser);

        // If user is logged in, fetch their profile
        if (currentUser) {
          console.log('User authenticated:', currentUser.email);
          // Check if profile exists, if not create one
          let userProfile = await fetchUserProfile(currentUser.id);
          
          if (!userProfile) {
            // Create a new profile if one doesn't exist
            try {
              const { data, error } = await supabaseClient
                .from('profiles')
                .insert([
                  { 
                    id: currentUser.id,
                    username: currentUser.user_metadata?.preferred_username || currentUser.email.split('@')[0],
                    avatar_url: currentUser.user_metadata?.avatar_url || '',
                    full_name: currentUser.user_metadata?.full_name || '',
                    github_id: currentUser.user_metadata?.provider_id || null
                  }
                ])
                .select()
                .single();
                
              if (error) {
                console.error('Error creating user profile:', error);
              } else {
                userProfile = data;
              }
            } catch (error) {
              console.error('Error in profile creation:', error);
            }
          }
          
          console.log('User profile:', userProfile ? 'Found' : 'Not found');
          setProfile(userProfile);
        } else {
          console.log('No authenticated user');
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    // Initial session check
    supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
      console.log('Initial session check:', session ? 'Session exists' : 'No session');
      
      const currentUser = session?.user || null;
      setUser(currentUser);

      // If user is logged in, fetch their profile
      if (currentUser) {
        console.log('Initial user check:', currentUser.email);
        let userProfile = await fetchUserProfile(currentUser.id);
        
        // If no profile exists, create one
        if (!userProfile) {
          try {
            const { data, error } = await supabaseClient
              .from('profiles')
              .insert([
                { 
                  id: currentUser.id,
                  username: currentUser.user_metadata?.preferred_username || currentUser.email.split('@')[0],
                  avatar_url: currentUser.user_metadata?.avatar_url || '',
                  full_name: currentUser.user_metadata?.full_name || '',
                  github_id: currentUser.user_metadata?.provider_id || null
                }
              ])
              .select()
              .single();
              
            if (error) {
              console.error('Error creating initial user profile:', error);
            } else {
              userProfile = data;
            }
          } catch (error) {
            console.error('Error in initial profile creation:', error);
          }
        }
        
        console.log('Initial profile check:', userProfile ? 'Profile found' : 'No profile');
        setProfile(userProfile);
      } else {
        console.log('No initial user found');
      }

      setIsLoading(false);
    }).catch(error => {
      console.error('Error during initial session check:', error);
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabaseClient]);

  const signInWithGitHub = async () => {
    try {
      // Redirect to our custom GitHub OAuth route
      window.location.href = '/api/auth/github';
      // Add a loading toast to indicate the authentication process has started
      toast.loading('Redirecting to GitHub for authentication...');
    } catch (error) {
      console.error('Error signing in with GitHub:', error);
      toast.error('Failed to sign in with GitHub');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isSignedIn: !!user,
        signInWithGitHub,
        signOut,
        supabaseClient,
        refreshProfile: async () => {
          if (user) {
            const userProfile = await fetchUserProfile(user.id);
            setProfile(userProfile);
            return userProfile;
          }
          return null;
        },
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