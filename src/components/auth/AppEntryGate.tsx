import { Redirect, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuthStore } from '@/store/authStore';
import { useUserProfileStore } from '@/store/userProfileStore';

const MINIMUM_SPLASH_VISIBLE_MS = 600;
const splashMountedAt = Date.now();

export function AppEntryGate() {
  const pathname = usePathname();
  const { isHydrated: authHydrated, status } = useAuthStore();
  const { isHydrated: profileHydrated, profile } = useUserProfileStore();
  const isReady = authHydrated && profileHydrated && status !== 'checking';

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let animationFrame: number | undefined;
    const remainingDuration = Math.max(
      MINIMUM_SPLASH_VISIBLE_MS - (Date.now() - splashMountedAt),
      0,
    );
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(() => {
        void SplashScreen.hideAsync();
      });
    }, remainingDuration);

    return () => {
      clearTimeout(timeout);

      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isReady]);

  if (!isReady) {
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
    return (
      <Redirect
        href={profile.completedOnboarding ? '/' : '/onboarding?mode=setup'}
      />
    );
  }

  if (hasAppSession && !profile.completedOnboarding && !isOnboardingRoute) {
    return <Redirect href="/onboarding?mode=setup" />;
  }

  return null;
}
