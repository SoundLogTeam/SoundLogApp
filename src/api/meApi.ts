import { canUseAuthenticatedApi, requestApi } from '@/api/client';
import { UserProfile, UserProfileInput } from '@/store/userProfileStore';

type ServerCompanionType = 'couple' | 'family' | 'friends' | 'solo';

const companionTypeMap: Record<string, ServerCompanionType> = {
  가족: 'family',
  연인: 'couple',
  친구: 'friends',
  혼자: 'solo',
};

function toServerCompanionType(value?: string) {
  if (!value) {
    return undefined;
  }

  if (['couple', 'family', 'friends', 'solo'].includes(value)) {
    return value as ServerCompanionType;
  }

  return companionTypeMap[value] ?? undefined;
}

function toProfileBody(input: UserProfileInput) {
  return {
    companionType: toServerCompanionType(input.companionType),
    locationRecommendationEnabled: input.locationRecommendationEnabled,
    preferredGenres: input.preferredGenres,
    preferredMoods: input.preferredMoods,
    travelStyles: input.travelStyles,
  };
}

export const meApi = {
  updateProfile: (input: UserProfileInput) => {
    if (!canUseAuthenticatedApi()) {
      return Promise.resolve<UserProfile | undefined>(undefined);
    }

    return requestApi<UserProfile>('/v1/me/profile', {
      body: toProfileBody(input),
      method: 'PUT',
    });
  },
};
