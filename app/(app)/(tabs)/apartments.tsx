import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppStore } from '@/src/store/useAppStore';
import { EmptyState } from '@/src/ui/EmptyState';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

export default function ApartmentsScreen() {
  const router = useRouter();
  const apartments = useAppStore((s) => s.apartments);
  const refreshApartments = useAppStore((s) => s.refreshApartments);

  useFocusEffect(
    useCallback(() => {
      refreshApartments();
    }, [refreshApartments]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={apartments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Sin departamentos"
            subtitle="Creá el primero e importá su calendario Airbnb (.ics) o pegá la URL iCal."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(app)/apartment/${item.id}`)}
          >
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <View style={styles.cardBody}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.icsUrl ? 'URL iCal configurada' : 'Sin URL — importá un .ics'}
              </Text>
            </View>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton
          label="Agregar departamento"
          onPress={() => router.push('/(app)/apartment/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  cardBody: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
