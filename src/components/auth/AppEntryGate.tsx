import { router, usePathname } from 'expo-router';
import { useEffect } from 'react';

import { useAuthStore } from '@/store/authStore';
import { useUserProfileStore } from '@/store/userProfileStore';

export function AppEntryGate() {
  const pathname = usePathname();
  const { isHydrated: authHydrated, status } = useAuthStore();
  const { isHydrated: profileHydrated, profile } = useUserProfileStore();

  useEffect(() => {
    if (!authHydrated || !profileHydrated || status === 'checking') {
      return;
    }

    const isAuthRoute = pathname.startsWith('/auth');
    const isOnboardingRoute = pathname.startsWith('/onboarding');
    const hasAppSession = status === 'authenticated' || status === 'guest';

    if (!hasAppSession) {
      if (!isAuthRoute) {
        router.replace('/auth/login' as never);
      }

      return;
    }

    if (isAuthRoute && status === 'authenticated') {
      router.replace((profile.completedOnboarding ? '/' : '/onboarding') as never);
      return;
    }

    if (!profile.completedOnboarding && !isOnboardingRoute) {
      router.replace('/onboarding' as never);
    }
  }, [authHydrated, pathname, profile.completedOnboarding, profileHydrated, status]);

  return null;
}
