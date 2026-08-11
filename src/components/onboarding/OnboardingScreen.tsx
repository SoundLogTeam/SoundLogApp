import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Switch,
  useWindowDimensions,
  View,
} from 'react-native';

import { meApi } from '@/api/meApi';
import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
import { useAuthStore } from '@/store/authStore';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import {
  UserProfileInput,
  useUserProfileStore,
} from '@/store/userProfileStore';

type IntroStep = 'intro' | 'setup';

type TravelOption = {
  label: string;
  profileValue: string;
};

const introSlides = [
  {
    cropImageBorder: false,
    description: '지금 있는 장소와 취향을 바탕으로 오늘의 음악을 골라요.',
    id: 'location',
    image: require('../../../assets/onboarding/location-recommendation.png'),
    title: '장소 기반 음악 추천',
  },
  {
    cropImageBorder: true,
    description: '사진과 장소, 음악을 한 장의 리캡으로 기록해요.',
    id: 'recap',
    image: require('../../../assets/onboarding/recap-memory.png'),
    title: '순간을 리캡으로 기록',
  },
  {
    cropImageBorder: false,
    description: '여행 중 남긴 리캡을 이동 경로와 함께 하나의 로그로 모아요.',
    id: 'travel-log',
    image: require('../../../assets/onboarding/travel-log.png'),
    title: '여행 로그로 회고',
  },
] as const;

const travelOptions: TravelOption[] = [
  { label: '바다', profileValue: '바다 보기' },
  { label: '드라이브', profileValue: '드라이브' },
  { label: '산책', profileValue: '산책' },
  { label: '카페', profileValue: '카페 투어' },
  { label: '야경', profileValue: '야경 감상' },
];

const moodOptions = ['잔잔한', '신나는', '시원한', '설레는', '감성적인'];
const defaultTravelLabel = '산책';
const defaultMood = '잔잔한';
const embeddedImageBorderCrop = 4;

function getTravelLabelFromProfile(profile: UserProfileInput) {
  const selectedTravel = travelOptions.find((option) =>
    profile.travelStyles.includes(option.profileValue),
  );

  return selectedTravel?.label ?? defaultTravelLabel;
}

function getMoodFromProfile(profile: UserProfileInput) {
  return (
    moodOptions.find((mood) => profile.preferredMoods.includes(mood)) ??
    defaultMood
  );
}

function buildProfileInput({
  baseProfile,
  locationRecommendationEnabled,
  selectedMood,
  selectedTravelLabel,
}: {
  baseProfile: UserProfileInput;
  locationRecommendationEnabled: boolean;
  selectedMood: string;
  selectedTravelLabel: string;
}): UserProfileInput {
  const selectedTravel =
    travelOptions.find((option) => option.label === selectedTravelLabel) ??
    travelOptions[2];

  return {
    companionType: baseProfile.companionType,
    locationRecommendationEnabled,
    preferredGenres: baseProfile.preferredGenres,
    preferredMoods: selectedMood ? [selectedMood] : [defaultMood],
    travelStyles: selectedTravel ? [selectedTravel.profileValue] : ['산책'],
  };
}

export function OnboardingScreen() {
  const { height, width } = useWindowDimensions();
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const isEditMode = mode === 'edit';
  const shouldStartWithSetup = isEditMode || mode === 'setup';
  const { completeOnboarding, profile, updateProfile } = useUserProfileStore();
  const { status } = useAuthStore();
  const { setSelectedMoodFilter } = useHomeFilterStore();
  const [currentStep, setCurrentStep] = useState<IntroStep>(
    shouldStartWithSetup ? 'setup' : 'intro',
  );
  const [introIndex, setIntroIndex] = useState(0);
  const [selectedTravelLabel, setSelectedTravelLabel] = useState(() =>
    getTravelLabelFromProfile(profile),
  );
  const [selectedMood, setSelectedMood] = useState(() =>
    getMoodFromProfile(profile),
  );
  const [locationRecommendationEnabled, setLocationRecommendationEnabled] =
    useState(profile.locationRecommendationEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>();
  const introPagerRef = useRef<ScrollView>(null);
  const introImageSize = Math.min(width - 48, Math.max(240, height * 0.4), 334);

  const draft = useMemo(
    () =>
      buildProfileInput({
        baseProfile: profile,
        locationRecommendationEnabled,
        selectedMood,
        selectedTravelLabel,
      }),
    [locationRecommendationEnabled, profile, selectedMood, selectedTravelLabel],
  );

  const applyHomeFilters = (input: UserProfileInput) => {
    setSelectedMoodFilter(input.preferredMoods[0] ?? '전체');
  };

  const saveProfile = async (input: UserProfileInput) => {
    setIsSaving(true);
    setSaveErrorMessage(undefined);

    try {
      await meApi.updateProfile(input);
      return true;
    } catch {
      setSaveErrorMessage(
        '프로필을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const enterHome = async (input: UserProfileInput) => {
    if (status !== 'authenticated') {
      setSaveErrorMessage('Soundlog를 시작하려면 먼저 로그인해주세요.');
      router.push('/auth/login' as never);
      return;
    }

    const didSave = await saveProfile(input);

    if (!didSave) {
      return;
    }

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

  const handlePrimarySetup = (enabledLocation: boolean) => {
    if (isSaving) {
      return;
    }

    const input = {
      ...draft,
      locationRecommendationEnabled: enabledLocation,
    };

    void enterHome(input);
  };

  const handleIntroScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIntroIndex(Math.max(0, Math.min(nextIndex, introSlides.length - 1)));
  };

  const handleIntroPrimaryAction = () => {
    const isLastSlide = introIndex === introSlides.length - 1;

    if (!isLastSlide) {
      const nextIndex = introIndex + 1;
      introPagerRef.current?.scrollTo({ animated: true, x: nextIndex * width });
      return;
    }

    if (status !== 'authenticated') {
      router.push('/auth/login' as never);
      return;
    }

    setCurrentStep('setup');
  };

  const renderIntro = () => (
    <Screen>
      <View className="flex-1 pb-7 pt-3">
        <View className="flex-row items-center justify-between px-6">
          <AppText className="text-xl font-semibold text-white">
            Soundlog
          </AppText>
          {status === 'authenticated' ? null : (
            <Pressable
              accessibilityRole="button"
              className="min-h-11 justify-center px-2"
              onPress={() => router.push('/auth/login' as never)}
            >
              <AppText className="text-sm font-semibold text-white/72">
                로그인
              </AppText>
            </Pressable>
          )}
        </View>

        <ScrollView
          bounces={false}
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleIntroScrollEnd}
          pagingEnabled
          ref={introPagerRef}
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {introSlides.map((slide, index) => (
            <View
              accessibilityElementsHidden={introIndex !== index}
              className="items-center justify-center px-6"
              importantForAccessibility={
                introIndex === index ? 'auto' : 'no-hide-descendants'
              }
              key={slide.id}
              style={{ width }}
            >
              <View
                className="overflow-hidden"
                style={{ height: introImageSize, width: introImageSize }}
              >
                <Image
                  accessibilityLabel={`${slide.title} 온보딩 이미지`}
                  contentFit="cover"
                  source={slide.image}
                  style={{
                    height:
                      introImageSize +
                      (slide.cropImageBorder ? embeddedImageBorderCrop * 2 : 0),
                    left: slide.cropImageBorder ? -embeddedImageBorderCrop : 0,
                    position: 'absolute',
                    top: slide.cropImageBorder ? -embeddedImageBorderCrop : 0,
                    width:
                      introImageSize +
                      (slide.cropImageBorder ? embeddedImageBorderCrop * 2 : 0),
                  }}
                />
              </View>
              <AppText className="mt-7 text-center text-2xl font-semibold text-white">
                {slide.title}
              </AppText>
              <AppText className="mt-3 max-w-[320px] text-center text-sm leading-6 text-white/65">
                {slide.description}
              </AppText>
            </View>
          ))}
        </ScrollView>

        <View className="px-6">
          <View className="mb-5 flex-row items-center justify-center gap-2">
            {introSlides.map((slide, index) => (
              <View
                className={`h-2 rounded-full ${
                  introIndex === index
                    ? 'w-6 bg-soundlog-lime'
                    : 'w-2 bg-white/22'
                }`}
                key={slide.id}
              />
            ))}
          </View>
          <Pressable
            accessibilityRole="button"
            className="h-14 items-center justify-center rounded-xl bg-soundlog-lime"
            onPress={handleIntroPrimaryAction}
          >
            <AppText className="text-base font-semibold text-soundlog-inverse">
              {introIndex < introSlides.length - 1
                ? '다음'
                : status === 'authenticated'
                  ? '추천 취향 설정하기'
                  : '로그인하고 시작하기'}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Screen>
  );

  const renderSetup = () => (
    <>
      <PageHeader
        leftContent={
          <IconButton
            label={
              isEditMode ? '마이페이지로 돌아가기' : '이전 단계로 돌아가기'
            }
            name="arrow-left"
            onPress={() =>
              isEditMode
                ? router.replace('/my' as never)
                : setCurrentStep('intro')
            }
          />
        }
        rightContent={
          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              if (isEditMode) {
                router.replace('/my' as never);
                return;
              }

              handlePrimarySetup(false);
            }}
            style={{ opacity: isSaving ? 0.45 : 1 }}
          >
            <AppText className="text-sm font-semibold text-white/48">
              {isEditMode ? '취소' : '나중에'}
            </AppText>
          </Pressable>
        }
        title={isEditMode ? '추천 취향 수정' : '추천 취향'}
      />

      <AppText className="text-sm leading-6 text-white/48">
        장소 기반 추천에 반영할 여행 스타일과 무드를 선택하세요.
      </AppText>

      <View>
        <SectionTitle title="여행 스타일" />
        <View className="mt-3 flex-row flex-wrap gap-2">
          {travelOptions.map((option) => {
            const selected = selectedTravelLabel === option.label;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-11 justify-center rounded-full border px-5 ${
                  selected
                    ? 'border-soundlog-lime bg-soundlog-lime'
                    : 'border-white/10 bg-white/[0.06]'
                }`}
                key={option.label}
                onPress={() => setSelectedTravelLabel(option.label)}
              >
                <AppText
                  className={`text-sm font-semibold ${
                    selected ? 'text-soundlog-inverse' : 'text-white/68'
                  }`}
                >
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <SectionTitle title="듣고 싶은 무드" />
        <View className="mt-3 flex-row flex-wrap gap-2">
          {moodOptions.map((mood) => {
            const selected = selectedMood === mood;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-11 justify-center rounded-full border px-5 ${
                  selected
                    ? 'border-soundlog-lime bg-soundlog-lime'
                    : 'border-white/10 bg-white/[0.06]'
                }`}
                key={mood}
                onPress={() => setSelectedMood(mood)}
              >
                <AppText
                  className={`text-sm font-semibold ${
                    selected ? 'text-soundlog-inverse' : 'text-white/68'
                  }`}
                >
                  {mood}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View>
        <SectionTitle title="위치 및 추천" />
        <SettingsRow
          description="꺼도 수동 장소 선택과 기본 추천은 계속 사용할 수 있어요."
          icon="navigation"
          label="현재 위치로 추천받기"
          rightContent={
            <Switch
              onValueChange={setLocationRecommendationEnabled}
              thumbColor="#ffffff"
              trackColor={{
                false: 'rgba(255,255,255,0.18)',
                true: '#B7E628',
              }}
              value={locationRecommendationEnabled}
            />
          }
        />
      </View>

      <View className="mt-auto gap-3">
        {saveErrorMessage ? (
          <AppText className="text-xs leading-5 text-amber-100">
            {saveErrorMessage}
          </AppText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-xl bg-soundlog-lime"
          disabled={isSaving}
          onPress={() => handlePrimarySetup(locationRecommendationEnabled)}
          style={{ opacity: isSaving ? 0.55 : 1 }}
        >
          <AppText className="text-base font-semibold text-soundlog-inverse">
            {isSaving
              ? '저장 중...'
              : isEditMode
                ? '추천 설정 저장하기'
                : '설정 저장하고 시작하기'}
          </AppText>
        </Pressable>
        {!isEditMode ? (
          <Pressable
            accessibilityRole="button"
            className="h-12 items-center justify-center"
            disabled={isSaving}
            onPress={() => handlePrimarySetup(false)}
            style={{ opacity: isSaving ? 0.55 : 1 }}
          >
            <AppText className="text-sm font-semibold text-white/55">
              나중에 하기
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </>
  );

  if (currentStep === 'intro') {
    return renderIntro();
  }

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
        {renderSetup()}
      </ScrollView>
    </Screen>
  );
}
