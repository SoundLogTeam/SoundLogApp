import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';

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
  const { status } = useAuthStore();
  const { setSelectedMoodFilter } = useHomeFilterStore();
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

  const renderIntro = () => (
    <>
      <PageHeader
        rightContent={
          status === 'authenticated' ? undefined : (
            <Pressable
              accessibilityRole="button"
              disabled={isSaving}
              onPress={() => router.push('/auth/login' as never)}
              style={{ opacity: isSaving ? 0.45 : 1 }}
            >
              <AppText className="text-sm font-semibold text-white/55">로그인</AppText>
            </Pressable>
          )
        }
        title="Soundlog"
      />

      <View>
        <AppText className="text-[30px] font-semibold leading-9 text-white">
          지금 장소의 음악을{'\n'}여행 앨범으로
        </AppText>
        <AppText className="mt-4 text-[15px] leading-7 text-white/54">
          음악은 외부 앱에서 듣고, Soundlog에는 여행의 사운드트랙을 남겨요.
        </AppText>
      </View>

      <View>
        <SectionTitle title="Soundlog에서 하는 일" />
        <View className="mt-2">
          <SettingsRow
            description="현재 장소와 취향을 바탕으로 오늘의 음악을 골라요."
            icon="map-pin"
            label="장소 기반 음악 추천"
          />
          <SettingsRow
            description="사진, 장소와 음악을 한 번의 리캡으로 저장해요."
            icon="camera"
            label="순간을 리캡으로 기록"
          />
          <SettingsRow
            description="여행모드에서 만든 리캡을 이동 경로와 함께 모아봐요."
            icon="map"
            label="여행 로그로 회고"
          />
        </View>
      </View>

      <View className="mt-auto gap-2">
        {saveErrorMessage ? (
          <AppText className="text-xs leading-5 text-amber-100">
            {saveErrorMessage}
          </AppText>
        ) : null}

        <Pressable
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-xl bg-soundlog-lime"
          disabled={isSaving}
          onPress={() => {
            if (status !== 'authenticated') {
              router.push('/auth/login' as never);
              return;
            }

            setCurrentStep('setup');
          }}
          style={{ opacity: isSaving ? 0.55 : 1 }}
        >
          <AppText className="text-base font-semibold text-soundlog-inverse">
            {status === 'authenticated'
              ? '추천 취향 설정하기'
              : '계정 만들기 또는 로그인'}
          </AppText>
        </Pressable>
      </View>
    </>
  );

  const renderSetup = () => (
    <>
      <PageHeader
        leftContent={
          <IconButton
            label={isEditMode ? '마이페이지로 돌아가기' : '이전 단계로 돌아가기'}
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
            <AppText className="text-sm font-semibold text-white/54">
              나중에 하기
            </AppText>
          </Pressable>
        ) : null}
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
