// app/(tabs)/_layout.tsx — Navegação por abas
import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:      false,
        tabBarStyle: {
          backgroundColor:  Colors.deep,
          borderTopColor:   Colors.border,
          borderTopWidth:   1,
          paddingBottom:    12,
          paddingTop:       8,
          height:           64,
        },
        tabBarActiveTintColor:   Colors.violet,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle: {
          fontSize:      9,
          fontFamily:    'monospace',
          letterSpacing: 0.5,
          marginTop:     2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'CHAT', tabBarIcon: ({ color }) => <TabIcon emoji="💬" color={color} /> }}
      />
      <Tabs.Screen
        name="today"
        options={{ title: 'HOJE',  tabBarIcon: ({ color }) => <TabIcon emoji="📋" color={color} /> }}
      />
      <Tabs.Screen
        name="wins"
        options={{ title: 'STREAK', tabBarIcon: ({ color }) => <TabIcon emoji="⭐" color={color} /> }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: 20, opacity: color === Colors.violet ? 1 : 0.4 }}>
      {emoji}
    </Text>
  );
}
