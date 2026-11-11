import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';

import { APARTMENT_COLORS } from '@/src/domain/colors';
import { useAppStore } from '@/src/store/useAppStore';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

export default function NewApartmentScreen() {
  const router = useRouter();
  const createApartment = useAppStore((s) => s.createApartment);
  const syncIcsUrl = useAppStore((s) => s.syncIcsUrl);
  const [name, setName] = useState('');
  const [icsUrl, setIcsUrl] = useState('');
  const [color, setColor] = useState<string>(APARTMENT_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido');
      return;
    }
    setSaving(true);
    try {
      const apt = await createApartment({
        name,
        color,
        icsUrl: icsUrl.trim() || null,
      });
      if (icsUrl.trim()) {
        try {
          await syncIcsUrl(apt.id, icsUrl.trim());
        } catch (e) {
          Alert.alert(
            'Departamento creado',
            e instanceof Error
              ? `No se pudo sincronizar el calendario: ${e.message}`
              : 'No se pudo sincronizar el calendario',
          );
        }
      }
      router.replace(`/(app)/apartment/${apt.id}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Depto Centro"
        placeholderTextColor={colors.muted}
      />

      <Text style={styles.label}>URL iCal Airbnb (opcional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={icsUrl}
        onChangeText={setIcsUrl}
        placeholder="https://www.airbnb.com/calendar/ical/...."
        placeholderTextColor={colors.muted}
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

      <PrimaryButton label="Guardar" onPress={onSave} loading={saving} />
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
