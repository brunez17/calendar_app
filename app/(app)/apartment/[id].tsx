import * as DocumentPicker from 'expo-document-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { eachDayOfInterval, parseISO, format, isBefore } from 'date-fns';

import type { Reservation } from '@/src/domain/types';
import { useAppStore } from '@/src/store/useAppStore';
import { formatRange } from '@/src/ui/dateFormat';
import { EmptyState } from '@/src/ui/EmptyState';
import { LoadingView } from '@/src/ui/LoadingView';
import { PaymentBadge } from '@/src/ui/PaymentBadge';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

function buildMarkedDates(reservations: Reservation[], apartmentColor: string) {
  const marked: Record<
    string,
    { color?: string; textColor?: string; startingDay?: boolean; endingDay?: boolean }
  > = {};

  for (const r of reservations) {
    const start = parseISO(r.start);
    // ICS DTEND is exclusive for all-day events
    const endExclusive = parseISO(r.end);
    const endInclusive = new Date(endExclusive);
    endInclusive.setDate(endInclusive.getDate() - 1);
    if (isBefore(endInclusive, start)) continue;

    const days = eachDayOfInterval({ start, end: endInclusive });
    const color = r.kind === 'blocked' ? colors.blocked : apartmentColor;

    days.forEach((day, index) => {
      const key = format(day, 'yyyy-MM-dd');
      marked[key] = {
        color,
        textColor: '#fff',
        startingDay: index === 0,
        endingDay: index === days.length - 1,
      };
    });
  }

  return marked;
}

export default function ApartmentCalendarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const apartments = useAppStore((s) => s.apartments);
  const reservations = useAppStore((s) => s.selectedApartmentReservations);
  const loadApartmentReservations = useAppStore((s) => s.loadApartmentReservations);
  const importIcsFile = useAppStore((s) => s.importIcsFile);
  const syncIcsUrl = useAppStore((s) => s.syncIcsUrl);
  const loading = useAppStore((s) => s.loading);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const apartment = apartments.find((a) => a.id === id);

  useEffect(() => {
    if (id) loadApartmentReservations(id);
  }, [id, loadApartmentReservations]);

  const markedDates = useMemo(
    () => (apartment ? buildMarkedDates(reservations, apartment.color) : {}),
    [reservations, apartment],
  );

  const dayReservations = useMemo(() => {
    if (!selectedDay) {
      return reservations
        .filter((r) => r.kind === 'reserved')
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(0, 20);
    }
    return reservations.filter((r) => {
      return r.start <= selectedDay && selectedDay < r.end;
    });
  }, [reservations, selectedDay]);

  const onDayPress = useCallback((day: DateData) => {
    setSelectedDay((prev) => (prev === day.dateString ? null : day.dateString));
  }, []);

  const onImportFile = async () => {
    if (!id) return;
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/calendar', 'application/octet-stream', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      const msg = await importIcsFile(id, result.assets[0].uri);
      Alert.alert('Importación', msg);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Falló la importación');
    }
  };

  const onSyncUrl = async () => {
    if (!id) return;
    try {
      const msg = await syncIcsUrl(id);
      Alert.alert('Sincronización', msg);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Falló el sync');
    }
  };

  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      if (apartment?.icsUrl) {
        await syncIcsUrl(id);
      } else {
        await loadApartmentReservations(id);
      }
    } catch {
      await loadApartmentReservations(id);
    } finally {
      setRefreshing(false);
    }
  };

  if (!apartment) {
    return <LoadingView />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: apartment.name,
          headerRight: () => (
            <Pressable onPress={() => router.push(`/(app)/apartment/edit/${apartment.id}`)}>
              <Text style={styles.edit}>Editar</Text>
            </Pressable>
          ),
        }}
      />

      <FlatList
        data={dayReservations}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <View>
            <Calendar
              markingType="period"
              markedDates={markedDates}
              onDayPress={onDayPress}
              theme={{
                todayTextColor: colors.primary,
                arrowColor: colors.primary,
                textDayFontWeight: '500',
              }}
            />
            <View style={styles.actions}>
              <PrimaryButton
                label="Importar .ics"
                onPress={onImportFile}
                variant="secondary"
                style={styles.actionBtn}
              />
              <PrimaryButton
                label="Sync URL"
                onPress={onSyncUrl}
                disabled={!apartment.icsUrl}
                style={styles.actionBtn}
              />
            </View>
            <Text style={styles.sectionTitle}>
              {selectedDay ? `Reservas del ${selectedDay}` : 'Próximas reservas'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Sin reservas"
            subtitle="Importá un archivo .ics o sincronizá la URL del calendario Airbnb."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(app)/reservation/${item.id}`)}
          >
            <View style={styles.cardTop}>
              <Text style={styles.summary}>{item.summary}</Text>
              {item.kind === 'reserved' ? (
                <PaymentBadge status={item.paymentStatus} />
              ) : (
                <Text style={styles.blocked}>Bloqueo</Text>
              )}
            </View>
            <Text style={styles.range}>{formatRange(item.start, item.end)}</Text>
            {item.phoneLast4 ? (
              <Text style={styles.meta}>Tel. ····{item.phoneLast4}</Text>
            ) : null}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  edit: { color: colors.primary, fontWeight: '600', fontSize: 16, paddingHorizontal: 8 },
  list: { paddingBottom: spacing.xl },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionBtn: { flex: 1 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  summary: { fontSize: 16, fontWeight: '700', color: colors.ink, flex: 1 },
  range: { fontSize: 13, color: colors.muted },
  meta: { fontSize: 12, color: colors.muted },
  blocked: { fontSize: 12, color: colors.blocked, fontWeight: '600' },
});
