import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
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
    description: '첫 추천의 베이스가 되는 장르 데이터를 받아요.',
    key: 'preferredGenres',
    title: '음악 장르는?',
  },
  {
    description: '장소와 시간대에 맞출 감정 에너지를 골라주세요.',
    key: 'preferredMoods',
    title: '끌리는 무드는 어떤 쪽인가요?',
  },
  {
    description: '관광 맥락과 플레이리스트 템포를 맞추는 데 사용돼요.',
    key: 'travelStyles',
    title: '여행 중 어떤 장면이 많나요?',
  },
  {
    description: '동행과 위치 추천 여부에 따라 추천 톤을 조정해요.',
    key: 'companion',
    title: '누구와 듣는 여행인가요?',
  },
];

const options: Record<MultiSelectKey, string[]> = {
  preferredGenres: [
    'K-POP',
    '팝',
    '인디',
    '발라드',
    '힙합',
    'R&B',
    'OST',
    '시티팝',
  ],
  preferredMoods: [
    '잔잔한',
    '신나는',
    '청량한',
    '감성적인',
    '활기찬',
    '몽환적인',
    '드라이브',
  ],
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

const stepAccents = [
  ['#1DB954', '#7CFF8A'],
  ['#27D3FF', '#B66BFF'],
  ['#FFB84D', '#FF4FD8'],
  ['#1DB954', '#2CE6B8'],
] as const;

const stepHints = [
  'Genre seed',
  'Mood tempo',
  'Travel context',
  'Social mix',
] as const;

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
  const currentAccent = stepAccents[currentStepIndex];
  const currentHint = stepHints[currentStepIndex];

  const selectedCount = useMemo(
    () =>
      draft.preferredGenres.length +
      draft.preferredMoods.length +
      draft.travelStyles.length +
      (draft.companionType ? 1 : 0),
    [draft],
  );

  const currentStepSelectedCount = useMemo(() => {
    if (currentStep.key === 'companion') {
      return draft.companionType ? 1 : 0;
    }

    return draft[currentStep.key].length;
  }, [currentStep.key, draft]);

  const canProceed = currentStepSelectedCount > 0;

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
    if (!canProceed) {
      return;
    }

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
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: draft.companionType === option }}
                className={`min-h-12 justify-center rounded-full border px-5 ${
                  draft.companionType === option
                    ? 'border-[#9EA8FF]/70 bg-[#243A75]/70'
                    : 'border-white/10 bg-white/10'
                }`}
                onPress={() =>
                  setDraft((prev) => ({ ...prev, companionType: option }))
                }
              >
                <AppText
                  className={`text-sm font-semibold ${
                    draft.companionType === option
                      ? 'text-white'
                      : 'text-white/80'
                  }`}
                >
                  {option}
                </AppText>
              </Pressable>
            ))}
          </View>

          <View className="rounded-[24px] border border-[#1DB954]/30 bg-[#0B1C13] p-5">
            <View className="flex-row items-center justify-between gap-4">
              <View className="min-w-0 flex-1">
                <AppText className="text-base font-semibold text-white">
                  위치 기반 추천
                </AppText>
                <AppText className="mt-2 text-sm leading-6 text-white/60">
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
                  true: '#1DB954',
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
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: draft[multiSelectKey].includes(option) }}
            className={`min-h-12 justify-center rounded-full border px-5 ${
              draft[multiSelectKey].includes(option)
                ? 'border-[#9EA8FF]/70 bg-[#243A75]/70'
                : 'border-white/10 bg-white/10'
            }`}
            onPress={() => updateMultiSelect(multiSelectKey, option)}
          >
            <AppText
              className={`text-sm font-semibold ${
                draft[multiSelectKey].includes(option)
                  ? 'text-white'
                  : 'text-white/80'
              }`}
            >
              {option}
            </AppText>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: 26,
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
          <View className="self-start rounded-full border border-[#1DB954]/30 bg-[#1DB954]/10 px-4 py-2">
            <AppText className="text-xs font-semibold uppercase text-[#7CFF8A]">
              {isEditMode ? 'Soundlog profile' : 'Soundlog taste scan'}
            </AppText>
          </View>
          <AppText className="mt-5 text-[33px] font-semibold leading-[40px] text-white">
            {isEditMode
              ? '지금 여행 취향에 맞게\n추천을 다시 맞춰요'
              : '내 여행을 닮은\n믹스를 만들어볼게요'}
          </AppText>
          <AppText className="mt-4 text-sm leading-6 text-white/60">
            {isEditMode
              ? '수정한 값은 홈 추천과 무드 필터의 기본값으로 다시 반영돼요.'
              : '장르, 무드, 여행 장면을 조합해 위치 기반 추천의 첫 플레이리스트를 세팅해요.'}
          </AppText>
        </View>

        <LinearGradient
          colors={[
            'rgba(29,185,84,0.24)',
            'rgba(39,211,255,0.13)',
            'rgba(255,79,216,0.16)',
          ]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{ borderRadius: 30, padding: 1 }}
        >
          <View className="overflow-hidden rounded-[29px] bg-[#070A0F] p-5">
            <View className="flex-row items-center justify-between">
              <View>
                <AppText className="text-xs font-semibold uppercase text-white/45">
                  {currentHint}
                </AppText>
                <AppText className="mt-1 text-sm font-semibold text-white/70">
                  {progressLabel}
                </AppText>
              </View>
              <View className="rounded-full bg-white/10 px-3 py-2">
                <AppText className="text-xs font-semibold text-white/65">
                  전체 선택 {selectedCount}개
                </AppText>
              </View>
            </View>

            <View className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <LinearGradient
                colors={currentAccent}
                end={{ x: 1, y: 0 }}
                start={{ x: 0, y: 0 }}
                style={{
                  borderRadius: 999,
                  height: '100%',
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                }}
              />
            </View>

            <View className="mt-6 flex-row items-end gap-1">
              {[22, 34, 18, 42, 28, 50, 24, 38].map((height, index) => (
                <View
                  key={`${height}-${index}`}
                  className="w-2 rounded-full"
                  style={{
                    backgroundColor:
                      index <= currentStepIndex + 3
                        ? index % 2 === 0
                          ? currentAccent[0]
                          : currentAccent[1]
                        : 'rgba(255,255,255,0.13)',
                    height,
                  }}
                />
              ))}
            </View>

            <AppText className="mt-7 text-[25px] font-semibold leading-[32px] text-white">
              {currentStep.title}
            </AppText>
            <AppText className="mt-3 text-sm leading-6 text-white/60">
              {currentStep.description}
            </AppText>

            <View className="mt-7">{renderStepBody()}</View>

            {!canProceed ? (
              <AppText className="mt-5 text-xs font-semibold text-[#7CFF8A]/70">
                하나 이상 선택하면 다음 믹스로 넘어갈 수 있어요.
              </AppText>
            ) : null}
          </View>
        </LinearGradient>

        <View className="mt-auto gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !canProceed }}
            className={`h-14 items-center justify-center rounded-full border ${
              canProceed
                ? 'border-[#9EA8FF]/70 bg-[#243A75]/70'
                : 'border-white/5 bg-white/10'
            }`}
            disabled={!canProceed}
            onPress={handlePrimaryPress}
          >
            <AppText
              className={`text-base font-semibold ${
                canProceed ? 'text-white' : 'text-white/35'
              }`}
            >
              {isLastStep
                ? isEditMode
                  ? '수정 완료'
                  : '완료하고 시작하기'
                : '다음'}
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: currentStepIndex === 0 }}
            className={`h-12 items-center justify-center rounded-full border ${
              currentStepIndex === 0
                ? 'border-white/5 bg-white/5'
                : 'border-[#9EA8FF]/45 bg-white/10'
            }`}
            disabled={currentStepIndex === 0}
            onPress={() => setCurrentStepIndex((prev) => prev - 1)}
          >
            <AppText
              className={`text-sm font-semibold ${
                currentStepIndex === 0 ? 'text-white/25' : 'text-white/70'
              }`}
            >
              이전
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
