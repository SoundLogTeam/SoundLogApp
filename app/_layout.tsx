import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppEntryGate } from '@/components/auth/AppEntryGate';
import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <AppEntryGate />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/callback" />
        <Stack.Screen name="legal/privacy" />
        <Stack.Screen name="legal/terms" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="library" />
        <Stack.Screen name="playlist/[id]" />
        <Stack.Screen name="recap-share/[id]" />
        <Stack.Screen name="travel-room/[roomId]" />
        <Stack.Screen name="camera/index" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
