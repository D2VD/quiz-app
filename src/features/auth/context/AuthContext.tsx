import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabaseClient';
import type { RegistrationOutcome, UserProfile, UserRole } from '@/types';
import { AuthApi } from '@/services/api';

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (fullName: string, email: string, password: string, role: UserRole) => Promise<RegistrationOutcome>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrateProfile = useCallback(
    async (userId: string) => {
      const loadedProfile = await AuthApi.fetchProfile(userId);
      setProfile(loadedProfile);
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      const userId = data.session?.user.id;
      if (userId) {
        await hydrateProfile(userId);
      } else {
        setProfile(null);
      }
      setLoading(false);
    };

    syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      const userId = newSession?.user.id;
      if (userId) {
        hydrateProfile(userId);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [hydrateProfile]);

  const handleRegister = useCallback(
    async (fullName: string, email: string, password: string, role: UserRole) =>
      AuthApi.register(fullName, email, password, role),
    [],
  );

  const handleLogin = useCallback(async (email: string, password: string) => {
    await AuthApi.login(email, password);
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    const userId = data.session?.user.id;
    if (userId) {
      await hydrateProfile(userId);
    }
  }, [hydrateProfile]);

  const handleLogout = useCallback(async () => {
    await AuthApi.logout();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return;
    await hydrateProfile(session.user.id);
  }, [hydrateProfile, session?.user.id]);

  const value = useMemo(
    () => ({
      session,
      profile,
      loading,
      register: handleRegister,
      login: handleLogin,
      logout: handleLogout,
      refreshProfile,
    }),
    [handleLogin, handleLogout, handleRegister, loading, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
