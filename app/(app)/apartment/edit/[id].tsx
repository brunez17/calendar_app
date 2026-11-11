import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { APARTMENT_COLORS } from '@/src/domain/colors';
import { useAppStore } from '@/src/store/useAppStore';
import { LoadingView } from '@/src/ui/LoadingView';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

export default function EditApartmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const apartments = useAppStore((s) => s.apartments);
  const updateApartment = useAppStore((s) => s.updateApartment);
  const deleteApartment = useAppStore((s) => s.deleteApartment);
  const apartment = apartments.find((a) => a.id === id);

  const [name, setName] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [color, setColor] = useState<string>(APARTMENT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (apartment) {
      setName(apartment.name);
      setIcsUrl(apartment.icsUrl ?? '');
      setColor(apartment.color);
    }
  }, [apartment]);

  if (!apartment) {
    return <LoadingView />;
  }

  const onSave = async () => {
    setSaving(true);
    try {
      await updateApartment(apartment.id, {
        name,
        color,
        icsUrl: icsUrl.trim() || null,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar departamento', 'Se borrarán también sus reservas locales.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteApartment(apartment.id);
          router.replace('/(app)/(tabs)/apartments');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>URL iCal Airbnb</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={icsUrl}
        onChangeText={setIcsUrl}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.colors}>
        {APARTMENT_COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              color === c && styles.swatchSelected,
            ]}
          />
        ))}
      </View>

      <PrimaryButton label="Guardar cambios" onPress={onSave} loading={saving} />
      <PrimaryButton label="Eliminar" onPress={onDelete} variant="danger" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  swatchSelected: { borderWidth: 3, borderColor: colors.ink },
});
