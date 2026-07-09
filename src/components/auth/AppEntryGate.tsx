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
  const hasAppSession = status === 'authenticated';

  if (!hasAppSession && !isAuthRoute && !isLegalRoute && !isOnboardingRoute) {
    return <Redirect href={profile.completedOnboarding ? '/auth/login' : '/onboarding'} />;
  }

  if (isAuthRoute && status === 'authenticated') {
    return <Redirect href={profile.completedOnboarding ? '/' : '/onboarding'} />;
  }

  if (hasAppSession && !profile.completedOnboarding && !isOnboardingRoute) {
    return <Redirect href="/onboarding" />;
  }

  return null;
}
