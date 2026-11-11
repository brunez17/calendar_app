import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  DRIVE_SCOPE,
  getGoogleAuthConfig,
  isGoogleConfigured,
} from '@/src/features/auth/config';

WebBrowser.maybeCompleteAuthSession();

const TOKEN_KEY = 'google_access_token';
const MODE_KEY = 'auth_mode';

type AuthMode = 'google' | 'local' | null;

type AuthUser = {
  email?: string;
  name?: string;
};

type AuthContextValue = {
  ready: boolean;
  mode: AuthMode;
  user: AuthUser | null;
  accessToken: string | null;
  googleConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  continueLocally: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<AuthMode>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const googleConfigured = isGoogleConfigured();
  const config = getGoogleAuthConfig();

  // Hooks must run even when Google is not configured yet.
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: config.webClientId || 'placeholder.apps.googleusercontent.com',
    iosClientId: config.iosClientId || undefined,
    androidClientId: config.androidClientId || undefined,
    scopes: ['openid', 'profile', 'email', DRIVE_SCOPE],
  });

  useEffect(() => {
    (async () => {
      try {
        const savedMode = await SecureStore.getItemAsync(MODE_KEY);
        if (savedMode === 'local') {
          setMode('local');
          setUser({ name: 'Modo local' });
        } else if (savedMode === 'google') {
          const token = await SecureStore.getItemAsync(TOKEN_KEY);
          if (token) {
            setAccessToken(token);
            setMode('google');
            setUser({ name: 'Cuenta Google' });
          }
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (response?.type !== 'success') return;
    const token = response.authentication?.accessToken;
    if (!token) return;

    (async () => {
      setAccessToken(token);
      setMode('google');
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(MODE_KEY, 'google');

      try {
        const profileRes = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (profileRes.ok) {
          const profile = (await profileRes.json()) as {
            email?: string;
            name?: string;
          };
          setUser({ email: profile.email, name: profile.name });
        } else {
          setUser({ name: 'Cuenta Google' });
        }
      } catch {
        setUser({ name: 'Cuenta Google' });
      }
    })();
  }, [response]);

  const signInWithGoogle = useCallback(async () => {
    if (!googleConfigured) {
      throw new Error(
        'Configurá los client IDs de Google en app.json / variables de entorno',
      );
    }
    if (!request) {
      throw new Error('Auth de Google todavía no está listo. Reintentá en un momento.');
    }
    await promptAsync();
  }, [googleConfigured, promptAsync, request]);

  const continueLocally = useCallback(async () => {
    setMode('local');
    setUser({ name: 'Modo local' });
    setAccessToken(null);
    await SecureStore.setItemAsync(MODE_KEY, 'local');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  const signOut = useCallback(async () => {
    setMode(null);
    setUser(null);
    setAccessToken(null);
    await SecureStore.deleteItemAsync(MODE_KEY);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      mode,
      user,
      accessToken,
      googleConfigured,
      signInWithGoogle,
      continueLocally,
      signOut,
    }),
    [
      ready,
      mode,
      user,
      accessToken,
      googleConfigured,
      signInWithGoogle,
      continueLocally,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
