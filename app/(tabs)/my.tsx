import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { meApi } from '@/api/meApi';
import { useNearbyPlacesQuery } from '@/api/tourQueries';
import { AppText } from '@/components/AppText';
import { LocationContextCard } from '@/components/home/LocationContextCard';
import { AuthAccountCard } from '@/components/my/AuthAccountCard';
import { PermissionSettingsCard } from '@/components/my/PermissionSettingsCard';
import { Screen } from '@/components/Screen';
import { useNativePermissionSettings } from '@/hooks/useNativePermissionSettings';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { requestForegroundLocationWithStatus } from '@/utils/location';

type MyMenuItem = {
  description?: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress?: () => void;
};

function formatEventTime(value?: string) {
  if (!value) {
    return '아직 없음';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '확인 불가';
  }

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MyScreen() {
  const { profile, resetOnboarding, updateProfile } = useUserProfileStore();
  const [profileMessage, setProfileMessage] = useState<string>();
  const { clearEvents, events, isHydrated } = useRecommendationEventStore();
  const permissionSettings = useNativePermissionSettings();
  const {
    currentLocation,
    currentPlace,
    locationStatus,
    locationUpdatedAt,
    setLocation,
    setLocationStatus,
    setPlace,
  } = useTravelSessionStore();
  const nearbyPlacesQuery = useNearbyPlacesQuery({
    enabled: profile.locationRecommendationEnabled,
    location: currentLocation,
    radiusMeters: 2000,
  });
  const selectedSummary = [
    ...profile.preferredGenres.slice(0, 2),
    ...profile.preferredMoods.slice(0, 1),
    ...profile.travelStyles.slice(0, 1),
  ].join(' · ');

  useEffect(() => {
    if (!nearbyPlacesQuery.data) {
      return;
    }

    const nextPlace = nearbyPlacesQuery.data[0];

    if (nextPlace?.id !== currentPlace?.id) {
      setPlace(nextPlace);
    }
  }, [currentPlace?.id, nearbyPlacesQuery.data, setPlace]);

  const handleEnableLocationRecommendation = useCallback(async () => {
    const nextProfile = {
      companionType: profile.companionType,
      locationRecommendationEnabled: true,
      preferredGenres: profile.preferredGenres,
      preferredMoods: profile.preferredMoods,
      travelStyles: profile.travelStyles,
    };

    setProfileMessage(undefined);

    try {
      await meApi.updateProfile(nextProfile);
      updateProfile(nextProfile);
    } catch {
      setProfileMessage('위치 추천 설정을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    }
  }, [profile, updateProfile]);

  const handleRefreshLocation = useCallback(async () => {
    if (locationStatus === 'loading') {
      return;
    }

    setLocationStatus('loading');

    try {
      const result = await requestForegroundLocationWithStatus();

      if (result.location) {
        setLocation(result.location);
        return;
      }

      setLocationStatus(result.status === 'denied' ? 'denied' : 'unavailable');
    } catch {
      setLocationStatus('unavailable');
    }
  }, [locationStatus, setLocation, setLocationStatus]);

  const menuItems: MyMenuItem[] = [
    {
      description: selectedSummary || '아직 저장된 취향 정보가 없어요.',
      icon: 'sliders',
      label: '취향 정보 수정',
      onPress: () =>
        router.push({
          pathname: '/onboarding',
          params: { mode: 'edit' },
        } as never),
    },
    {
      description: profile.locationRecommendationEnabled
        ? '위치 기반 추천 사용 중'
        : '위치 추천 꺼짐',
      icon: 'map-pin',
      label: '위치/카메라 권한',
    },
    {
      description: '데이터 수집과 보관, 삭제 요청 방법을 확인합니다.',
      icon: 'shield',
      label: '개인정보 처리방침',
      onPress: () => router.push('/legal/privacy' as never),
    },
    {
      description: '서비스 이용 조건과 사용자 콘텐츠 기준을 확인합니다.',
      icon: 'file-text',
      label: '서비스 이용약관',
      onPress: () => router.push('/legal/terms' as never),
    },
    {
      description: '온보딩을 다시 볼 수 있도록 초기화합니다.',
      icon: 'rotate-ccw',
      label: '온보딩 초기화',
      onPress: () => {
        resetOnboarding();
        router.replace('/onboarding' as never);
      },
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 132, paddingHorizontal: 20, paddingTop: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText className="text-[26px] font-semibold text-white">My</AppText>

        <AuthAccountCard />

        <View className="mt-5 rounded-[22px] border border-white/10 bg-white/10 p-5">
          <AppText className="text-sm font-semibold text-white/45">내 추천 프로필</AppText>
          <AppText className="mt-3 text-[20px] font-semibold text-white">
            {profile.completedOnboarding ? '취향 설정 완료' : '취향 설정 전'}
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/60">
            {selectedSummary || '취향을 입력하면 홈 추천 필터가 더 자연스럽게 맞춰져요.'}
          </AppText>
        </View>

        <PermissionSettingsCard
          errorMessage={permissionSettings.errorMessage}
          isLoading={permissionSettings.isLoading}
          isRequestingKind={permissionSettings.isRequestingKind}
          items={permissionSettings.items}
          onOpenSettings={permissionSettings.openSettings}
          onRefresh={permissionSettings.refreshPermissions}
          onRequest={permissionSettings.requestPermission}
        />

        <View className="mt-6">
          <LocationContextCard
            enabled={profile.locationRecommendationEnabled}
            isLoading={locationStatus === 'loading'}
            isPlaceLoading={nearbyPlacesQuery.isLoading}
            location={currentLocation}
            onEnable={handleEnableLocationRecommendation}
            onRefresh={handleRefreshLocation}
            place={currentPlace}
            placeCount={nearbyPlacesQuery.data?.length ?? 0}
            placeInfoMessage={
              currentPlace?.source === 'mock'
                ? '주변 장소 정보를 기본 장소 데이터로 보여주고 있어요.'
                : undefined
            }
            status={locationStatus}
            updatedAt={locationUpdatedAt}
          />
          {profileMessage ? (
            <View className="mt-3 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
              <AppText className="text-xs leading-5 text-amber-100">{profileMessage}</AppText>
            </View>
          ) : null}
        </View>

        <View className="mt-6 gap-3">
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              accessibilityRole="button"
              className="flex-row items-center rounded-[16px] bg-white/10 px-5 py-4"
              onPress={item.onPress}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                <Feather color="#fff" name={item.icon} size={18} />
              </View>
              <View className="ml-3 min-w-0 flex-1">
                <AppText className="text-base font-medium text-white">{item.label}</AppText>
                {item.description ? (
                  <AppText className="mt-1 text-xs leading-5 text-white/45">
                    {item.description}
                  </AppText>
                ) : null}
              </View>
              {item.onPress ? (
                <Feather color="rgba(255,255,255,0.5)" name="chevron-right" size={18} />
              ) : null}
            </Pressable>
          ))}
        </View>

        {__DEV__ ? (
          <View className="mt-6 rounded-[18px] border border-white/10 bg-white/10 p-5">
            <View className="flex-row items-start justify-between gap-3">
              <View className="min-w-0 flex-1">
                <AppText className="text-sm font-semibold text-white/45">
                  추천 피드백 로그
                </AppText>
                <AppText className="mt-2 text-[20px] font-semibold text-white">
                  {isHydrated ? `${events.length}개` : '동기화 중'}
                </AppText>
                <AppText className="mt-2 text-xs leading-5 text-white/50">
                  마지막 이벤트 {formatEventTime(events[0]?.createdAt)}
                </AppText>
                {events[0] ? (
                  <AppText className="mt-1 text-xs leading-5 text-white/35">
                    {events[0].type}
                    {events[0].value ? ` · ${events[0].value}` : ''}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                className="rounded-full border border-white/10 px-4 py-2"
                onPress={clearEvents}
              >
                <AppText className="text-xs font-semibold text-white/70">초기화</AppText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
