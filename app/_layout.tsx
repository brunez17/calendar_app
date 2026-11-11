import { ThemeProvider, DarkTheme, DefaultTheme, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/src/features/auth/AuthContext';
import { useAppStore } from '@/src/store/useAppStore';
import { colors } from '@/src/ui/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function Bootstrap({ children }: { children: React.ReactNode }) {
  const { ready, accessToken, mode } = useAuth();
  const hydrate = useAppStore((s) => s.hydrate);
  const syncDrive = useAppStore((s) => s.syncDrive);
  const setAccessTokenGetter = useAppStore((s) => s.setAccessTokenGetter);
  const hydrated = useAppStore((s) => s.hydrated);
  const bootstrapped = useRef(false);
  const driveSyncedForToken = useRef<string | null>(null);

  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
  }, [accessToken, setAccessTokenGetter]);

  useEffect(() => {
    if (!ready || bootstrapped.current) return;
    bootstrapped.current = true;
    hydrate().finally(() => {
      SplashScreen.hideAsync();
    });
  }, [ready, hydrate]);

  useEffect(() => {
    if (mode !== 'google' || !accessToken) return;
    if (driveSyncedForToken.current === accessToken) return;
    driveSyncedForToken.current = accessToken;
    syncDrive().catch((e) => console.warn('Initial Drive sync failed', e));
  }, [mode, accessToken, syncDrive]);

  if (!ready || !hydrated) {
    return null;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Bootstrap>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.ink,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
          </Stack>
        </Bootstrap>
      </ThemeProvider>
    </AuthProvider>
  );
}
