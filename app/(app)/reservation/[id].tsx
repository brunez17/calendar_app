import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Contact, PaymentStatus, Reservation } from '@/src/domain/types';
import { useAppStore } from '@/src/store/useAppStore';
import { formatRange, paymentLabel } from '@/src/ui/dateFormat';
import { LoadingView } from '@/src/ui/LoadingView';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'partial', 'paid'];

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const getReservation = useAppStore((s) => s.getReservation);
  const updateReservation = useAppStore((s) => s.updateReservation);
  const contacts = useAppStore((s) => s.contacts);
  const refreshContacts = useAppStore((s) => s.refreshContacts);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [contactId, setContactId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const r = await getReservation(id);
    if (!r) return;
    setReservation(r);
    setNotes(r.notes ?? '');
    setPaymentStatus(r.paymentStatus);
    setAmount(r.paymentAmount != null ? String(r.paymentAmount) : '');
    setCurrency(r.paymentCurrency || 'ARS');
    setPaymentNotes(r.paymentNotes ?? '');
    setContactId(r.contactId);
  }, [id, getReservation]);

  useEffect(() => {
    load();
    refreshContacts();
  }, [load, refreshContacts]);

  if (!reservation) {
    return <LoadingView />;
  }

  const onSave = async () => {
    setSaving(true);
    try {
      await updateReservation(reservation.id, {
        notes: notes.trim() || null,
        paymentStatus,
        paymentAmount: amount.trim() ? Number(amount) : null,
        paymentCurrency: currency.trim() || 'ARS',
        paymentNotes: paymentNotes.trim() || null,
        contactId,
      });
      Alert.alert('Guardado', 'Cambios aplicados');
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const selectedContact: Contact | undefined = contacts.find((c) => c.id === contactId);

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>{reservation.summary}</Text>
        <Text style={styles.meta}>{formatRange(reservation.start, reservation.end)}</Text>
        <Text style={styles.meta}>
          Tipo: {reservation.kind === 'blocked' ? 'Bloqueo / no disponible' : 'Reserva'}
        </Text>
        {reservation.phoneLast4 ? (
          <Text style={styles.meta}>Teléfono (últimos 4): {reservation.phoneLast4}</Text>
        ) : null}
        {reservation.airbnbUrl ? (
          <Pressable onPress={() => Linking.openURL(reservation.airbnbUrl!)}>
            <Text style={styles.link}>Abrir reserva en Airbnb</Text>
          </Pressable>
        ) : null}
      </View>

      {reservation.kind === 'reserved' ? (
        <View style={styles.card}>
          <Text style={styles.section}>Pago</Text>
          <View style={styles.row}>
            {PAYMENT_STATUSES.map((status) => (
              <Pressable
                key={status}
                onPress={() => setPaymentStatus(status)}
                style={[
                  styles.chip,
                  paymentStatus === status && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    paymentStatus === status && styles.chipTextActive,
                  ]}
                >
                  {paymentLabel(status)}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.amountRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="Monto"
              placeholderTextColor={colors.muted}
            />
            <TextInput
              style={[styles.input, { width: 90 }]}
              value={currency}
              onChangeText={setCurrency}
              autoCapitalize="characters"
              placeholder="ARS"
              placeholderTextColor={colors.muted}
            />
          </View>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={paymentNotes}
            onChangeText={setPaymentNotes}
            placeholder="Notas de pago"
            placeholderTextColor={colors.muted}
            multiline
          />
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.section}>Contacto</Text>
        {selectedContact ? (
          <Pressable onPress={() => router.push(`/(app)/contact/${selectedContact.id}`)}>
            <Text style={styles.link}>{selectedContact.name}</Text>
          </Pressable>
        ) : (
          <Text style={styles.meta}>Sin contacto asociado</Text>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.contactScroll}>
          <Pressable
            style={[styles.chip, !contactId && styles.chipActive]}
            onPress={() => setContactId(null)}
          >
            <Text style={[styles.chipText, !contactId && styles.chipTextActive]}>Ninguno</Text>
          </Pressable>
          {contacts.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chip, contactId === c.id && styles.chipActive]}
              onPress={() => setContactId(c.id)}
            >
              <Text
                style={[styles.chipText, contactId === c.id && styles.chipTextActive]}
              >
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <PrimaryButton
          label="Crear contacto"
          variant="secondary"
          onPress={() => router.push('/(app)/contact/new')}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Notas</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Check-in, llaves, pedidos..."
          placeholderTextColor={colors.muted}
          multiline
        />
      </View>

      <PrimaryButton label="Guardar" onPress={onSave} loading={saving} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted },
  link: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  section: { fontSize: 15, fontWeight: '700', color: colors.ink },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  amountRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.bg,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.ink, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.ink,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  contactScroll: { maxHeight: 44 },
});
