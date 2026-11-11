import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/src/store/useAppStore';
import { EmptyState } from '@/src/ui/EmptyState';
import { PrimaryButton } from '@/src/ui/PrimaryButton';
import { colors, radii, spacing } from '@/src/ui/theme';

export default function ContactsScreen() {
  const router = useRouter();
  const contacts = useAppStore((s) => s.contacts);
  const refreshContacts = useAppStore((s) => s.refreshContacts);

  useFocusEffect(
    useCallback(() => {
      refreshContacts();
    }, [refreshContacts]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            title="Sin contactos"
            subtitle="Guardá huéspedes y asociálos a sus reservas."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/(app)/contact/${item.id}`)}
          >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {[item.phone, item.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
            </Text>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <PrimaryButton
          label="Nuevo contacto"
          onPress={() => router.push('/(app)/contact/new')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.md, flexGrow: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: 4,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted },
  footer: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
});
