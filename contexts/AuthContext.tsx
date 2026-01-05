'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, usersApi } from '@/lib/api';
import type { Profile, ArtistPreference } from '@/lib/types';
import { GuestLogoutModal } from '@/components/guest-logout-modal';
import { WelcomeScreen } from '@/components/welcome-screen';

type User = Omit<Profile, 'password_hash'>;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      const result = await authApi.me();
      if (result.data) {
        setUser(result.data);
        // Show welcome screen if preferences not set
        if (!result.data.preferences_set) {
          setShowWelcomeScreen(true);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.login(email, password);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        setUser(result.data.user);
        return { success: true };
      }

      return { success: false, error: 'Unknown error' };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.register(username, email, password);

      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.data) {
        // After registration, automatically log in
        const loginResult = await login(email, password);
        return loginResult;
      }

      return { success: false, error: 'Unknown error' };
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Show warning modal for guests
    if (user?.is_guest) {
      setShowLogoutModal(true);
      return; // Wait for modal confirmation
    }

    await performLogout();
  };

  const performLogout = async () => {
    try {
      if (user?.is_guest) {
        // Delete guest account entirely so they can't sign back in
        await authApi.deleteGuest();
      } else {
        await authApi.logout();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setShowLogoutModal(false);
      // Navigate to home after logout completes
      window.location.href = '/';
    }
  };

  const handleLogoutConfirm = () => {
    performLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleWelcomeComplete = async (genres: string[], artists: ArtistPreference[]) => {
    if (!user) return;

    try {
      // Save preferences and mark onboarding complete
      await usersApi.updatePreferences(user.id, {
        top_genres: genres,
        top_artists: artists,
      });

      // Refresh user to get updated data
      await refreshUser();
      setShowWelcomeScreen(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  };

  const handleWelcomeSkip = async () => {
    if (!user) return;

    try {
      // Just mark preferences as set without saving any
      await usersApi.updatePreferences(user.id, {
        top_genres: [],
        top_artists: [],
      });

      // Refresh user
      await refreshUser();
      setShowWelcomeScreen(false);
    } catch (error) {
      console.error('Failed to skip preferences:', error);
    }
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <GuestLogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
      {showWelcomeScreen && (
        <WelcomeScreen
          onComplete={handleWelcomeComplete}
          onSkip={handleWelcomeSkip}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected pages
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = '/login';
      }
    }, [isLoading, isAuthenticated]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

// Hook for requiring auth (redirects if not authenticated)
export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/login';
    }
  }, [isLoading, isAuthenticated]);

  return { user, isLoading };
}
