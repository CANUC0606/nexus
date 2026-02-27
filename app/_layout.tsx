// app/_layout.tsx — Layout raiz com verificação de onboarding
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useUserStore } from '../store/userStore';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const onboardingFeito = useUserStore((s) => s.onboarding_feito);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.deep }}>
      <StatusBar style="light" backgroundColor={Colors.deep} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!onboardingFeito ? (
          <Stack.Screen name="onboarding" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
    </View>
  );
}
