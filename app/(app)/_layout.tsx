import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth/AuthContext';
import { colors } from '@/src/ui/theme';

export default function AppLayout() {
  const { mode } = useAuth();

  if (!mode) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="apartment/[id]" options={{ title: 'Calendario' }} />
      <Stack.Screen name="apartment/new" options={{ title: 'Nuevo departamento', presentation: 'modal' }} />
      <Stack.Screen name="apartment/edit/[id]" options={{ title: 'Editar departamento', presentation: 'modal' }} />
      <Stack.Screen name="reservation/[id]" options={{ title: 'Reserva' }} />
      <Stack.Screen name="contact/[id]" options={{ title: 'Contacto' }} />
      <Stack.Screen name="contact/new" options={{ title: 'Nuevo contacto', presentation: 'modal' }} />
    </Stack>
  );
}
