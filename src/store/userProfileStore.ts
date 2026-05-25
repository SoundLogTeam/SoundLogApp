import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type UserProfileInput = {
  companionType?: string;
  locationRecommendationEnabled: boolean;
  preferredGenres: string[];
  preferredMoods: string[];
  travelStyles: string[];
};

export type UserProfile = UserProfileInput & {
  completedOnboarding: boolean;
  updatedAt?: string;
};

type UserProfileState = {
  isHydrated: boolean;
  profile: UserProfile;
  completeOnboarding: (input: UserProfileInput) => void;
  resetOnboarding: () => void;
  setHydrated: (isHydrated: boolean) => void;
  skipOnboarding: () => void;
  updateProfile: (input: UserProfileInput) => void;
};

const defaultProfile: UserProfile = {
  completedOnboarding: false,
  companionType: undefined,
  locationRecommendationEnabled: true,
  preferredGenres: [],
  preferredMoods: [],
  travelStyles: [],
};

function withTimestamp(input: UserProfileInput, completedOnboarding = true): UserProfile {
  return {
    ...input,
    completedOnboarding,
    updatedAt: new Date().toISOString(),
  };
}

export const useUserProfileStore = create<UserProfileState>()(
  persist(
    (set) => ({
      isHydrated: false,
      profile: defaultProfile,
      completeOnboarding: (input) => set({ profile: withTimestamp(input) }),
      resetOnboarding: () => set({ profile: defaultProfile }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      skipOnboarding: () =>
        set({
          profile: withTimestamp(
            {
              companionType: undefined,
              locationRecommendationEnabled: true,
              preferredGenres: [],
              preferredMoods: [],
              travelStyles: [],
            },
            true,
          ),
        }),
      updateProfile: (input) => set({ profile: withTimestamp(input) }),
    }),
    {
      name: 'soundlog-user-profile',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({ profile: state.profile }),
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
