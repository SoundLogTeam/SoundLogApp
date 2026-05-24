import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppProviders } from '@/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="camera/index" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
