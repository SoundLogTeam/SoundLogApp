import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

import { meApi } from '@/api/meApi';
import { AppText } from '@/components/AppText';
import { BrandLogo } from '@/components/BrandLogo';
import { Screen } from '@/components/Screen';
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

function getTravelLabelFromProfile(profile: UserProfileInput) {
  const selectedTravel = travelOptions.find((option) =>
    profile.travelStyles.includes(option.profileValue),
  );

  return selectedTravel?.label ?? defaultTravelLabel;
}

function getMoodFromProfile(profile: UserProfileInput) {
  return moodOptions.find((mood) => profile.preferredMoods.includes(mood)) ?? defaultMood;
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
    travelOptions.find((option) => option.label === selectedTravelLabel) ?? travelOptions[2];

  return {
    companionType: baseProfile.companionType,
    locationRecommendationEnabled,
    preferredGenres: baseProfile.preferredGenres,
    preferredMoods: selectedMood ? [selectedMood] : [defaultMood],
    travelStyles: selectedTravel ? [selectedTravel.profileValue] : ['산책'],
  };
}

export function OnboardingScreen() {
  const params = useLocalSearchParams<{ mode?: string | string[] }>();
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const isEditMode = mode === 'edit';
  const { completeOnboarding, profile, updateProfile } = useUserProfileStore();
  const { continueAsGuest, status } = useAuthStore();
  const { setSelectedMoodFilter, setSelectedTopFilter } = useHomeFilterStore();
  const [currentStep, setCurrentStep] = useState<IntroStep>(isEditMode ? 'setup' : 'intro');
  const [selectedTravelLabel, setSelectedTravelLabel] = useState(() =>
    getTravelLabelFromProfile(profile),
  );
  const [selectedMood, setSelectedMood] = useState(() => getMoodFromProfile(profile));
  const [locationRecommendationEnabled, setLocationRecommendationEnabled] = useState(
    profile.locationRecommendationEnabled,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string>();

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
    setSelectedTopFilter('전체');
    setSelectedMoodFilter(input.preferredMoods[0] ?? '전체');
  };

  const saveProfile = async (input: UserProfileInput) => {
    setIsSaving(true);
    setSaveErrorMessage(undefined);

    try {
      await meApi.updateProfile(input);
      return true;
    } catch {
      setSaveErrorMessage('프로필을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const enterHome = async (input: UserProfileInput) => {
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

    if (status === 'unauthenticated') {
      continueAsGuest();
    }

    completeOnboarding(input);
    applyHomeFilters(input);
    router.replace('/');
  };

  const handleBrowse = () => {
    if (isSaving) {
      return;
    }

    const browseProfile = buildProfileInput({
      baseProfile: profile,
      locationRecommendationEnabled: false,
      selectedMood: defaultMood,
      selectedTravelLabel: defaultTravelLabel,
    });

    void enterHome(browseProfile);
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

  const renderIntro = () => (
    <>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <BrandLogo className="border border-white/20" size={50} />
          <AppText className="text-base font-semibold text-white">Soundlog</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => router.push('/auth/login' as never)}
          style={{ opacity: isSaving ? 0.45 : 1 }}
        >
          <AppText className="text-sm font-semibold text-white/55">로그인</AppText>
        </Pressable>
      </View>

      <View>
        <AppText className="text-[36px] font-semibold leading-[43px] text-white">
          지금 장소의 음악을{'\n'}여행 앨범으로
        </AppText>
        <AppText className="mt-4 text-[15px] leading-7 text-white/60">
          음악은 외부 앱에서 듣고, Soundlog에는 여행의 사운드트랙을 남겨요.
        </AppText>
      </View>

      <LinearGradient
        colors={['rgba(29,185,84,0.28)', 'rgba(39,211,255,0.18)', 'rgba(255,255,255,0.08)']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{ borderRadius: 30, padding: 1 }}
      >
        <View className="overflow-hidden rounded-[29px] bg-[#070A0F] p-5">
          <View className="flex-row items-start justify-between">
            <View>
              <AppText className="text-xs font-semibold uppercase text-[#B7E628]">
                Recap preview
              </AppText>
              <AppText className="mt-2 text-[24px] font-semibold leading-8 text-white">
                서울숲 산책{'\n'}사운드트랙
              </AppText>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-2xl bg-white">
              <View className="h-11 w-11 rounded-full border-[10px] border-[#050916] bg-[#B7E628]" />
            </View>
          </View>

          <View className="mt-6 flex-row gap-2">
            <View className="h-24 flex-1 rounded-[18px] bg-white/10 p-3">
              <AppText className="text-xs font-semibold text-white/45">ALBUM</AppText>
              <AppText className="mt-auto text-sm font-semibold text-white">대표 곡</AppText>
              <AppText className="mt-1 text-xs text-white/50">사진과 장소를 한 장으로</AppText>
            </View>
            <View className="h-24 flex-1 rounded-[18px] bg-white/10 p-3">
              <AppText className="text-xs font-semibold text-white/45">FILM</AppText>
              <View className="mt-auto flex-row gap-1">
                {[0, 1, 2, 3].map((item) => (
                  <View className="h-8 flex-1 rounded bg-white/20" key={item} />
                ))}
              </View>
            </View>
          </View>

          <View className="mt-5 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3">
            <AppText className="text-xs leading-5 text-white/60">
              앱 안에서는 음원을 재생하지 않고, 곡 정보와 외부 링크, 여행 기록을 이어 붙입니다.
            </AppText>
          </View>
        </View>
      </LinearGradient>

      <View className="mt-auto gap-3">
        {saveErrorMessage ? (
          <View className="rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <AppText className="text-xs leading-5 text-amber-100">
              {saveErrorMessage}
            </AppText>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-full bg-[#B7E628]"
          disabled={isSaving}
          onPress={() => setCurrentStep('setup')}
          style={{ opacity: isSaving ? 0.55 : 1 }}
        >
          <AppText className="text-base font-semibold text-[#050916]">시작하기</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-full border border-white/10 bg-white/10"
          disabled={isSaving}
          onPress={handleBrowse}
          style={{ opacity: isSaving ? 0.55 : 1 }}
        >
          <AppText className="text-base font-semibold text-white">
            {isSaving ? '준비 중...' : '둘러보기'}
          </AppText>
        </Pressable>
      </View>
    </>
  );

  const renderSetup = () => (
    <>
      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
          disabled={isSaving}
          onPress={() => (isEditMode ? router.replace('/my' as never) : setCurrentStep('intro'))}
        >
          <AppText className="text-lg font-semibold text-white">‹</AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isSaving}
          onPress={() => handlePrimarySetup(false)}
          style={{ opacity: isSaving ? 0.45 : 1 }}
        >
          <AppText className="text-sm font-semibold text-white/55">
            {isEditMode ? '변경 없이 나가기' : '나중에 하기'}
          </AppText>
        </Pressable>
      </View>

      <View>
        <AppText className="text-[32px] font-semibold leading-[39px] text-white">
          어떤 여행 중인가요?
        </AppText>
        <AppText className="mt-3 text-sm leading-6 text-white/60">
          지금 장면과 듣고 싶은 분위기만 고르면 첫 추천을 바로 시작할게요.
        </AppText>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {travelOptions.map((option) => {
          const selected = selectedTravelLabel === option.label;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`min-h-12 justify-center rounded-full border px-5 ${
                selected
                  ? 'border-[#B7E628] bg-[#B7E628]'
                  : 'border-white/10 bg-white/10'
              }`}
              key={option.label}
              onPress={() => setSelectedTravelLabel(option.label)}
            >
              <AppText
                className={`text-sm font-semibold ${
                  selected ? 'text-[#050916]' : 'text-white/72'
                }`}
              >
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View>
        <AppText className="text-xs font-semibold text-white/40">
          어떤 분위기인가요?
        </AppText>
        <View className="mt-3 flex-row flex-wrap gap-2">
          {moodOptions.map((mood) => {
            const selected = selectedMood === mood;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={`min-h-12 justify-center rounded-full border px-5 ${
                  selected
                    ? 'border-[#9EA8FF]/70 bg-[#243A75]/80'
                    : 'border-white/10 bg-white/10'
                }`}
                key={mood}
                onPress={() => setSelectedMood(mood)}
              >
                <AppText
                  className={`text-sm font-semibold ${
                    selected ? 'text-white' : 'text-white/72'
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
        <AppText className="text-xs font-semibold uppercase text-white/40">권한</AppText>
        <View className="mt-3 rounded-[24px] border border-white/10 bg-white/10 p-4">
          <View className="flex-row items-center justify-between gap-4">
            <View className="min-w-0 flex-1">
              <AppText className="text-base font-semibold text-white">
                현재 위치로 추천받기
              </AppText>
              <AppText className="mt-2 text-sm leading-6 text-white/60">
                거부해도 산책·잔잔한 기본 추천과 수동 탐색은 계속 가능해요.
              </AppText>
            </View>
            <Switch
              onValueChange={setLocationRecommendationEnabled}
              thumbColor="#ffffff"
              trackColor={{
                false: 'rgba(255,255,255,0.18)',
                true: '#B7E628',
              }}
              value={locationRecommendationEnabled}
            />
          </View>
        </View>
      </View>

      <View className="mt-auto gap-3">
        {saveErrorMessage ? (
          <View className="rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <AppText className="text-xs leading-5 text-amber-100">
              {saveErrorMessage}
            </AppText>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-full bg-[#B7E628]"
          disabled={isSaving}
          onPress={() => handlePrimarySetup(true)}
          style={{ opacity: isSaving ? 0.55 : 1 }}
        >
          <AppText className="text-base font-semibold text-[#050916]">
            {isSaving ? '저장 중...' : '위치 추천 켜기'}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-full border border-white/10 bg-white/10"
          disabled={isSaving}
          onPress={() => handlePrimarySetup(false)}
          style={{ opacity: isSaving ? 0.55 : 1 }}
        >
          <AppText className="text-base font-semibold text-white">나중에 하기</AppText>
        </Pressable>
      </View>
    </>
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          gap: currentStep === 'intro' ? 28 : 26,
          padding: 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 'intro' ? renderIntro() : renderSetup()}
      </ScrollView>
    </Screen>
  );
}
