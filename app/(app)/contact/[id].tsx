import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Contact, Reservation } from '@/src/domain/types';
import { useAppStore } from '@/src/store/useAppStore';
import { formatRange } from '@/src/ui/dateFormat';
import { LoadingView } from '@/src/ui/LoadingView';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const contacts = useAppStore((s) => s.contacts);
  const updateContact = useAppStore((s) => s.updateContact);
  const deleteContact = useAppStore((s) => s.deleteContact);
  const getContactReservations = useAppStore((s) => s.getContactReservations);
  const refreshContacts = useAppStore((s) => s.refreshContacts);

  const existing = contacts.find((c) => c.id === id);
  const [contact, setContact] = useState<Contact | null>(existing ?? null);
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await refreshContacts();
        if (!id) return;
        const list = await getContactReservations(id);
        setReservations(list);
        const current = useAppStore.getState().contacts.find((c) => c.id === id);
        if (current) {
          setContact(current);
          setName(current.name);
          setPhone(current.phone ?? '');
          setEmail(current.email ?? '');
          setNotes(current.notes ?? '');
        }
      })();
    }, [id, getContactReservations, refreshContacts]),
  );

  if (!contact) {
    return <LoadingView />;
  }

  const onSave = async () => {
    setSaving(true);
    try {
      await updateContact(contact.id, {
        name,
        phone: phone || null,
        email: email || null,
        notes: notes || null,
      });
      Alert.alert('Guardado');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert('Eliminar contacto', 'Las reservas quedarán sin contacto asociado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteContact(contact.id);
          router.replace('/(app)/(tabs)/contacts');
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Teléfono</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Notas</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <PrimaryButton label="Guardar" onPress={onSave} loading={saving} />
      <PrimaryButton label="Eliminar" onPress={onDelete} variant="danger" />

      <Text style={styles.section}>Reservas vinculadas</Text>
      {reservations.length === 0 ? (
        <Text style={styles.meta}>Ninguna todavía</Text>
      ) : (
        reservations.map((r) => (
          <Pressable
            key={r.id}
            style={styles.card}
            onPress={() => router.push(`/(app)/reservation/${r.id}`)}
          >
            <Text style={styles.cardTitle}>{r.summary}</Text>
            <Text style={styles.meta}>{formatRange(r.start, r.end)}</Text>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl },
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
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  section: {
    marginTop: spacing.lg,
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  meta: { fontSize: 13, color: colors.muted },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
});
