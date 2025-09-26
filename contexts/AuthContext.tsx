import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { RegistrationOutcome, UserProfile } from '../types';
import { UserRole } from '../constants';
import { api } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  register: (
    fullName: string,
    email: string,
    password: string,
    role: UserRole
  ) => Promise<RegistrationOutcome>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await api.getUserProfile(session.user.id);
          if (profile) {
            setUser({ ...session.user, ...profile });
          } else {
             // Handle case where user exists in auth but not in profiles table
             setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      // The onAuthStateChange listener will handle setting the user state.
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    role: UserRole
  ) => {
    setLoading(true);
    try {
      return await api.register(fullName, email, password, role);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
