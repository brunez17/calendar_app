import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth/AuthContext';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, spacing } from '@/src/ui/theme';

export default function LoginScreen() {
  const { mode, googleConfigured, signInWithGoogle, continueLocally } = useAuth();
  const [loading, setLoading] = useState(false);

  if (mode) {
    return <Redirect href="/(app)/(tabs)/apartments" />;
  }

  const onGoogle = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      Alert.alert('Google', e instanceof Error ? e.message : 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.brand}>StayLedger</Text>
        <Text style={styles.headline}>Reservas de departamentos en un solo lugar</Text>
        <Text style={styles.sub}>
          Importá calendarios Airbnb (.ics), marcá pagos y contactos, y guardá todo en tu Google
          Drive sin backend.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={googleConfigured ? 'Continuar con Google' : 'Google (falta configurar)'}
          onPress={onGoogle}
          loading={loading}
          disabled={!googleConfigured}
        />
        <PrimaryButton
          label="Usar solo en este dispositivo"
          onPress={() => continueLocally()}
          variant="secondary"
        />
        {!googleConfigured ? (
          <Text style={styles.hint}>
            Para Drive, agregá los client IDs de Google en `.env` o `app.json` (ver README).
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: -1,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.ink,
    lineHeight: 28,
  },
  sub: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
  },
});
