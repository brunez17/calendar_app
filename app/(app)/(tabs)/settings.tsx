import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/src/features/auth/AuthContext';
import { useAppStore } from '@/src/store/useAppStore';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, mode, signOut, googleConfigured } = useAuth();
  const lastSyncedAt = useAppStore((s) => s.lastSyncedAt);
  const syncDrive = useAppStore((s) => s.syncDrive);
  const loading = useAppStore((s) => s.loading);
  const [message, setMessage] = useState<string | null>(null);

  const onSync = async () => {
    try {
      const result = await syncDrive();
      setMessage(result);
    } catch (e) {
      Alert.alert('Drive', e instanceof Error ? e.message : 'Error de sync');
    }
  };

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Sesión</Text>
        <Text style={styles.value}>{user?.name ?? '—'}</Text>
        {user?.email ? <Text style={styles.meta}>{user.email}</Text> : null}
        <Text style={styles.meta}>
          Modo: {mode === 'google' ? 'Google Drive' : 'Solo dispositivo'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Sincronización Drive</Text>
        <Text style={styles.meta}>
          Última sync:{' '}
          {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'Nunca'}
        </Text>
        {message ? <Text style={styles.ok}>{message}</Text> : null}
        <PrimaryButton
          label="Sincronizar ahora"
          onPress={onSync}
          loading={loading}
          disabled={mode !== 'google' || !googleConfigured}
          style={{ marginTop: spacing.md }}
        />
        {mode !== 'google' ? (
          <Text style={[styles.meta, { marginTop: spacing.sm }]}>
            Iniciá sesión con Google para guardar en Drive (carpeta oculta appData).
          </Text>
        ) : null}
      </View>

      <PrimaryButton label="Cerrar sesión" onPress={onSignOut} variant="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  label: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  value: { fontSize: 18, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  ok: { fontSize: 13, color: colors.success, marginTop: spacing.sm },
});
