import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '@/src/ui/theme';

function TabLabel({ text, focused }: { text: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: focused ? '700' : '500',
        color: focused ? colors.primary : colors.muted,
      }}
    >
      {text}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.ink,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="apartments"
        options={{
          title: 'Departamentos',
          tabBarLabel: ({ focused }) => <TabLabel text="Deptos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contactos',
          tabBarLabel: ({ focused }) => <TabLabel text="Contactos" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarLabel: ({ focused }) => <TabLabel text="Ajustes" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
