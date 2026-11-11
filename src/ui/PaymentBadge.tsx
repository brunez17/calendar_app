import { StyleSheet, Text, View } from 'react-native';

import { paymentLabel } from '@/src/ui/dateFormat';
import { colors, radii, spacing } from '@/src/ui/theme';

export function PaymentBadge({ status }: { status: string }) {
  const bg =
    status === 'paid'
      ? colors.success
      : status === 'partial'
        ? colors.warning
        : colors.danger;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.text}>{paymentLabel(status)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
