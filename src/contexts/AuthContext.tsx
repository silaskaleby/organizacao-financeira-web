import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { getProfileForUser, saveProfileForUser } from '../services/profileService';
import type { ProfileFormValues, UserSettingsProfile } from '../types/profile';

type AuthStatus = 'loading-session' | 'signed-out' | 'loading-profile' | 'needs-onboarding' | 'ready' | 'unavailable';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  profile: UserSettingsProfile | null;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<'signed-in' | 'confirmation-required'>;
  signOut: () => Promise<void>;
  saveProfile: (values: ProfileFormValues) => Promise<UserSettingsProfile>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getProfileStatus(profile: UserSettingsProfile | null): AuthStatus {
  if (!profile || !profile.onboardingCompleted) {
    return 'needs-onboarding';
  }

  return 'ready';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading-session');
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserSettingsProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const loadedProfileUserIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (activeSession: Session, showLoading = true) => {
    if (showLoading) {
      setStatus('loading-profile');
    }
    setProfileError(null);

    try {
      const loadedProfile = await getProfileForUser(activeSession.user.id);
      loadedProfileUserIdRef.current = activeSession.user.id;
      setProfile(loadedProfile);
      setStatus(getProfileStatus(loadedProfile));
    } catch {
      setProfile(null);
      setProfileError('Não foi possível carregar seu perfil.');
      setStatus('needs-onboarding');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!supabase) {
      setStatus('unavailable');
      return undefined;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;

      const currentSession = data.session;
      setSession(currentSession);

      if (currentSession) {
        void loadProfile(currentSession);
      } else {
        setProfile(null);
        setStatus('signed-out');
      }
    });

    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);

      if (nextSession) {
        const sameUserAlreadyLoaded = loadedProfileUserIdRef.current === nextSession.user.id;
        const shouldReloadProfile =
          event === 'SIGNED_IN' ||
          event === 'USER_UPDATED' ||
          !sameUserAlreadyLoaded;

        if (shouldReloadProfile) {
          void loadProfile(nextSession, event !== 'TOKEN_REFRESHED');
        }
      } else {
        loadedProfileUserIdRef.current = null;
        setProfile(null);
        setProfileError(null);
        setStatus('signed-out');
      }
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) throw error;
    if (data.session) {
      setSession(data.session);
      await loadProfile(data.session);
    }
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmado`,
      },
    });

    if (error) throw error;

    if (data.session) {
      setSession(data.session);
      await loadProfile(data.session);
      return 'signed-in';
    }

    const { data: sessionData } = await supabase.auth.getSession();
    setSession(sessionData.session);

    if (sessionData.session) {
      await loadProfile(sessionData.session);
      return 'signed-in';
    } else {
      setStatus('signed-out');
      return 'confirmation-required';
    }
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!session) return;
    await loadProfile(session);
  }, [loadProfile, session]);

  const saveProfile = useCallback(async (values: ProfileFormValues) => {
    if (!session) throw new Error('Sessão não encontrada.');

    const savedProfile = await saveProfileForUser(session.user.id, values);
    loadedProfileUserIdRef.current = session.user.id;
    setProfile(savedProfile);
    setStatus(getProfileStatus(savedProfile));
    return savedProfile;
  }, [session]);

  const signOut = useCallback(async () => {
    if (!supabase) throw new Error('Supabase não configurado.');

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setSession(null);
    loadedProfileUserIdRef.current = null;
    setProfile(null);
    setProfileError(null);
    setStatus('signed-out');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      profile,
      profileError,
      signIn,
      signUp,
      signOut,
      saveProfile,
      refreshProfile,
    }),
    [profile, profileError, refreshProfile, saveProfile, session, signIn, signOut, signUp, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
