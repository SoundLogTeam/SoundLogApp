import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import {
  UserProfileInput,
  useUserProfileStore,
} from '@/store/userProfileStore';

type MultiSelectKey = 'preferredGenres' | 'preferredMoods' | 'travelStyles';

type OnboardingStep = {
  description: string;
  key: MultiSelectKey | 'companion';
  title: string;
};

const steps: OnboardingStep[] = [
  {
    description: '처음 추천을 만들 때 가장 먼저 참고할 음악 취향이에요.',
    key: 'preferredGenres',
    title: '어떤 음악을 자주 들으세요?',
  },
  {
    description: '여행지에서 듣고 싶은 기본 분위기를 골라주세요.',
    key: 'preferredMoods',
    title: '좋아하는 무드를 알려주세요',
  },
  {
    description: '추천 플레이리스트와 홈 필터의 기본값으로 활용돼요.',
    key: 'travelStyles',
    title: '선호하는 여행 스타일은요?',
  },
  {
    description: '동행과 위치 추천 여부에 따라 추천 톤을 조정해요.',
    key: 'companion',
    title: '이번 여행은 보통 누구와 함께하나요?',
  },
];

const options: Record<MultiSelectKey, string[]> = {
  preferredGenres: ['K-POP', '팝', '인디', '발라드', '힙합', 'R&B', 'OST'],
  preferredMoods: ['잔잔한', '신나는', '청량한', '감성적인', '활기찬'],
  travelStyles: [
    '산책',
    '드라이브',
    '카페 투어',
    '바다 보기',
    '축제',
    '야경 감상',
  ],
};

const companionOptions = ['혼자', '친구', '연인', '가족'];

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function getInitialDraft(profile: UserProfileInput): UserProfileInput {
  return {
    companionType: profile.companionType,
    locationRecommendationEnabled: profile.locationRecommendationEnabled,
    preferredGenres: profile.preferredGenres,
    preferredMoods: profile.preferredMoods,
    travelStyles: profile.travelStyles,
  };
}

export function OnboardingScreen() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const isEditMode = mode === 'edit';
  const { completeOnboarding, profile, skipOnboarding, updateProfile } =
    useUserProfileStore();
  const { setSelectedMoodFilter, setSelectedTopFilter } = useHomeFilterStore();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [draft, setDraft] = useState<UserProfileInput>(() =>
    getInitialDraft(profile),
  );

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const progressLabel = `${currentStepIndex + 1}/${steps.length}`;

  const selectedCount = useMemo(
    () =>
      draft.preferredGenres.length +
      draft.preferredMoods.length +
      draft.travelStyles.length +
      (draft.companionType ? 1 : 0),
    [draft],
  );

  const updateMultiSelect = (key: MultiSelectKey, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: toggleValue(prev[key], value) }));
  };

  const applyHomeFilters = (input: UserProfileInput) => {
    setSelectedTopFilter('전체');
    setSelectedMoodFilter(input.preferredMoods[0] ?? '전체');
  };

  const finish = (input: UserProfileInput) => {
    if (isEditMode) {
      updateProfile(input);
      applyHomeFilters(input);
      router.replace('/my' as never);
      return;
    }

    completeOnboarding(input);
    applyHomeFilters(input);
    router.replace('/');
  };

  const handlePrimaryPress = () => {
    if (!isLastStep) {
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }

    finish(draft);
  };

  const handleSkip = () => {
    if (isEditMode) {
      router.replace('/my' as never);
      return;
    }

    skipOnboarding();
    setSelectedTopFilter('전체');
    setSelectedMoodFilter('전체');
    router.replace('/');
  };

  const renderStepBody = () => {
    if (currentStep.key === 'companion') {
      return (
        <View className="gap-5">
          <View className="flex-row flex-wrap gap-2">
            {companionOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                onPress={() =>
                  setDraft((prev) => ({ ...prev, companionType: option }))
                }
                selected={draft.companionType === option}
              />
            ))}
          </View>

          <View className="rounded-[22px] border border-white/10 bg-white/10 p-5">
            <View className="flex-row items-center justify-between gap-4">
              <View className="min-w-0 flex-1">
                <AppText className="text-base font-semibold text-white">
                  위치 기반 추천
                </AppText>
                <AppText className="mt-2 text-sm leading-6 text-white/55">
                  현재 장소와 가까운 관광 맥락을 음악 추천에 반영해요.
                </AppText>
              </View>
              <Switch
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    locationRecommendationEnabled: value,
                  }))
                }
                thumbColor="#ffffff"
                trackColor={{
                  false: 'rgba(255,255,255,0.18)',
                  true: '#7A2CFF',
                }}
                value={draft.locationRecommendationEnabled}
              />
            </View>
          </View>
        </View>
      );
    }

    const multiSelectKey = currentStep.key;

    return (
      <View className="flex-row flex-wrap gap-2">
        {options[multiSelectKey].map((option) => (
          <Chip
            key={option}
            label={option}
            onPress={() => updateMultiSelect(multiSelectKey, option)}
            selected={draft[multiSelectKey].includes(option)}
          />
        ))}
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: 30,
          padding: 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <BrandLogo className="border border-white/20" size={54} />
          <Pressable accessibilityRole="button" onPress={handleSkip}>
            <AppText className="text-sm font-semibold text-white/55">
              {isEditMode ? '변경 없이 나가기' : '나중에 하기'}
            </AppText>
          </Pressable>
        </View>

        <View>
          <AppText className="text-sm font-semibold text-[#9EA8FF]">
            {isEditMode ? 'Soundlog profile' : 'Soundlog setup'}
          </AppText>
          <AppText className="mt-4 text-[32px] font-semibold leading-[40px] text-white">
            {isEditMode
              ? '지금 여행 취향에 맞게\n추천을 다시 맞춰요'
              : '여행 취향을 알수록\n선곡이 더 가까워져요'}
          </AppText>
          <AppText className="mt-4 text-sm leading-6 text-white/55">
            {isEditMode
              ? '수정한 값은 홈 추천과 무드 필터의 기본값으로 다시 반영돼요.'
              : '입력한 값은 로컬에 저장되고, 홈 추천과 무드 필터의 기본값으로 사용돼요.'}
          </AppText>
        </View>

        <View className="rounded-[28px] border border-white/10 bg-white/10 p-5">
          <View className="flex-row items-center justify-between">
            <AppText className="text-sm font-semibold text-white/45">
              {progressLabel}
            </AppText>
            <AppText className="text-sm font-semibold text-white/45">
              선택 {selectedCount}개
            </AppText>
          </View>

          <View className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <View
              className="h-full rounded-full bg-[#7A2CFF]"
              style={{
                width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </View>

          <AppText className="mt-7 text-[24px] font-semibold leading-[32px] text-white">
            {currentStep.title}
          </AppText>
          <AppText className="mt-3 text-sm leading-6 text-white/55">
            {currentStep.description}
          </AppText>

          <View className="mt-7">{renderStepBody()}</View>
        </View>

        <View className="mt-auto gap-3">
          <Pressable
            accessibilityRole="button"
            className="h-14 items-center justify-center rounded-full bg-white"
            onPress={handlePrimaryPress}
          >
            <AppText className="text-base font-semibold text-[#050916]">
              {isLastStep
                ? isEditMode
                  ? '수정 완료'
                  : '완료하고 시작하기'
                : '다음'}
            </AppText>
          </Pressable>

          {currentStepIndex > 0 ? (
            <Pressable
              accessibilityRole="button"
              className="h-12 items-center justify-center rounded-full border border-white/10"
              onPress={() => setCurrentStepIndex((prev) => prev - 1)}
            >
              <AppText className="text-sm font-semibold text-white/70">
                이전
              </AppText>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}
