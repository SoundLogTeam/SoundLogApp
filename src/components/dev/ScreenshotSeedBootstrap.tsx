import { router } from 'expo-router';
import { useEffect } from 'react';

import { bootstrapScreenshotSeedOnce } from '@/components/dev/screenshotSeedBootstrap';
import { useAuthStore } from '@/store/authStore';
import { useUserProfileStore } from '@/store/userProfileStore';

export function ScreenshotSeedBootstrap() {
  const authHydrated = useAuthStore((state) => state.isHydrated);
  const profileHydrated = useUserProfileStore((state) => state.isHydrated);

  useEffect(() => {
    if (!authHydrated || !profileHydrated || !bootstrapScreenshotSeedOnce()) {
      return;
    }

    router.replace('/' as never);
  }, [authHydrated, profileHydrated]);

  return null;
}
