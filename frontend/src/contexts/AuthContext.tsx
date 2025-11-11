"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  userType: string;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  idDocumentPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('sessionToken');
      const storedUser = localStorage.getItem('authUser');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as UserProfile;
        setUser(parsedUser);
        setUserProfile(parsedUser);
        setSessionToken(storedToken);
      } else {
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('authUser');
      }
    } catch (error) {
      console.error('[AuthContext] failed to restore session', error);
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('authUser');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.user || !result.sessionToken) {
        return { success: false, error: result.error || 'Login failed' };
      }

      setUser(result.user);
      setUserProfile(result.user);
      setSessionToken(result.sessionToken);

      localStorage.setItem('sessionToken', result.sessionToken);
      localStorage.setItem('authUser', JSON.stringify(result.user));

      return { success: true };
    } catch (error) {
      console.error('[AuthContext] login failed', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (email: string, password: string, userData: any) => {
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...userData }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return { success: false, error: result.error || 'Registration failed' };
      }

      return { success: true };
    } catch (error) {
      console.error('[AuthContext] registration failed', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = async () => {
    if (sessionToken) {
      localStorage.removeItem('sessionToken');
    }
    localStorage.removeItem('authUser');
    setUser(null);
    setUserProfile(null);
    setSessionToken(null);
  };

  const resetPassword = async (email: string) => {
    // No backend integration yet; mimic success response for now.
    return { success: true, message: 'Password reset is not configured in this demo.' };
  };

  const value = {
    user,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
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