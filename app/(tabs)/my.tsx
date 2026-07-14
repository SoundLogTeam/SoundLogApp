import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { meApi } from '@/api/meApi';
import { useNearbyPlacesQuery } from '@/api/tourQueries';
import { AppText } from '@/components/AppText';
import { AuthAccountCard } from '@/components/my/AuthAccountCard';
import { MySettingsRow } from '@/components/my/MySettingsRow';
import { PermissionSettingsCard } from '@/components/my/PermissionSettingsCard';
import { PageHeader } from '@/components/PageHeader';
import { Screen } from '@/components/Screen';
import { SectionTitle } from '@/components/SectionTitle';
import { useNativePermissionSettings } from '@/hooks/useNativePermissionSettings';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { requestForegroundLocationWithStatus } from '@/utils/location';

export default function MyScreen() {
  const { profile, resetOnboarding, updateProfile } = useUserProfileStore();
  const [profileMessage, setProfileMessage] = useState<string>();
  const permissionSettings = useNativePermissionSettings();
  const {
    clearLocation,
    currentLocation,
    currentPlace,
    locationStatus,
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
  const currentPlaceSummary =
    locationStatus === 'loading'
      ? '확인 중'
      : currentPlace?.title
        ? currentPlace.title
        : currentLocation
          ? '주변 관광지 없음'
          : locationStatus === 'denied'
            ? '권한 꺼짐'
            : '확인 필요';
  const currentPlaceDescription = nearbyPlacesQuery.isLoading
    ? '현재 위치 주변 관광지를 확인하고 있어요.'
    : nearbyPlacesQuery.data?.length
      ? `주변 관광지 ${nearbyPlacesQuery.data.length}곳을 추천에 반영하고 있어요.`
      : '현재 장소를 다시 확인할 수 있어요.';

  useEffect(() => {
    if (!nearbyPlacesQuery.data) {
      return;
    }

    const nextPlace = nearbyPlacesQuery.data[0];

    if (nextPlace && nextPlace.id !== currentPlace?.id) {
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
      setProfileMessage(
        '위치 추천 설정을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
      );
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

      if (result.status === 'denied') {
        clearLocation();
      }
      setLocationStatus(result.status === 'denied' ? 'denied' : 'unavailable');
    } catch {
      setLocationStatus('unavailable');
    }
  }, [clearLocation, locationStatus, setLocation, setLocationStatus]);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 132,
          paddingHorizontal: 20,
          paddingTop: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader title="마이" />

        <AuthAccountCard />

        <View className="mt-7">
          <SectionTitle title="Soundlog 설정" />
          <MySettingsRow
            icon="sliders"
            label="추천 취향 수정"
            onPress={() =>
              router.push({
                pathname: '/onboarding',
                params: { mode: 'edit' },
              } as never)
            }
            rightText={selectedSummary || '설정 전'}
          />
          <MySettingsRow
            icon="bookmark"
            label="음악 보관함"
            onPress={() => router.push('/library' as never)}
          />
          <MySettingsRow
            icon="eye"
            label="내 로그 공개 설정"
            onPress={() =>
              router.push({
                pathname: '/recap',
                params: { view: 'all' },
              } as never)
            }
          />
        </View>

        <View className="mt-7">
          <SectionTitle title="위치 및 추천" />
          <MySettingsRow
            description={currentPlaceDescription}
            disabled={locationStatus === 'loading'}
            icon="map-pin"
            label="현재 장소 다시 확인"
            onPress={() => void handleRefreshLocation()}
            rightText={currentPlaceSummary}
          />
          <MySettingsRow
            description={
              profile.locationRecommendationEnabled
                ? '현재 장소를 음악 추천과 여행 기록에 사용해요.'
                : '켜면 현재 장소에 맞춰 음악 추천 순서를 조정해요.'
            }
            icon="navigation"
            label="위치 기반 추천"
            onPress={
              profile.locationRecommendationEnabled
                ? undefined
                : () => void handleEnableLocationRecommendation()
            }
            rightText={profile.locationRecommendationEnabled ? '켜짐' : '꺼짐'}
          />
          {profileMessage ? (
            <AppText className="ml-12 mt-1 text-xs leading-5 text-amber-200">
              {profileMessage}
            </AppText>
          ) : null}
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

        <View className="mt-7">
          <SectionTitle title="서비스" />
          <MySettingsRow
            icon="shield"
            label="개인정보 처리방침"
            onPress={() => router.push('/legal/privacy' as never)}
          />
          <MySettingsRow
            icon="file-text"
            label="서비스 이용약관"
            onPress={() => router.push('/legal/terms' as never)}
          />
        </View>

        {__DEV__ ? (
          <View className="mt-7">
            <SectionTitle title="개발 도구" />
            <MySettingsRow
              icon="rotate-ccw"
              label="온보딩 초기화"
              onPress={() => {
                resetOnboarding();
                router.replace('/onboarding' as never);
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
