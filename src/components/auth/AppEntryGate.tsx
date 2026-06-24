import { Redirect, usePathname } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { useUserProfileStore } from '@/store/userProfileStore';

export function AppEntryGate() {
  const pathname = usePathname();
  const { isHydrated: authHydrated, status } = useAuthStore();
  const { isHydrated: profileHydrated, profile } = useUserProfileStore();

  if (!authHydrated || !profileHydrated || status === 'checking') {
    return null;
  }

  const isAuthRoute = pathname.startsWith('/auth');
  const isLegalRoute = pathname.startsWith('/legal');
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isSpotifyAuthRoute = pathname.startsWith('/spotify-auth');
  const hasAppSession = status === 'authenticated' || status === 'guest';

  if (!hasAppSession && !isAuthRoute && !isLegalRoute && !isSpotifyAuthRoute) {
    return <Redirect href="/auth/login" />;
  }

  if (isAuthRoute && status === 'authenticated') {
    return <Redirect href={profile.completedOnboarding ? '/' : '/onboarding'} />;
  }

  if (hasAppSession && !profile.completedOnboarding && !isOnboardingRoute && !isSpotifyAuthRoute) {
    return <Redirect href="/onboarding" />;
  }

  return null;
}
