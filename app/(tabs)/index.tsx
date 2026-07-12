import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { travelSessionApi } from '@/api/travelSessionApi';
import { AppText } from '@/components/AppText';
import { MiniPlayer } from '@/components/MiniPlayer';
import { Screen } from '@/components/Screen';
import { TravelModeBottomSheet } from '@/components/travel/TravelModeBottomSheet';
import { RecapMapSection } from '@/components/travel/recap-map';
import {
  getMiniPlayerBottom,
  getTabBarHeight,
  layout,
} from '@/constants/layout';
import {
  createRoutePoint,
  useTravelRouteTracking,
} from '@/hooks/useTravelRouteTracking';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import type { TravelMode } from '@/types/domain';

export default function MapHomeScreen() {
  const insets = useSafeAreaInsets();
  useTravelRouteTracking();
  const { isHydrated: authHydrated, status } = useAuthStore();
  const { isHydrated, profile } = useUserProfileStore();
  const { currentTrack } = usePlayerStore();
  const [isModeSheetVisible, setIsModeSheetVisible] = useState(false);
  const [isStartingTravel, setIsStartingTravel] = useState(false);
  const [mapMessage, setMapMessage] = useState<string>();
  const {
    currentLocation,
    currentPlace,
    selectedMode,
    session,
    resetSession,
    setMode,
    setRecommendationMode,
    startSession,
  } = useTravelSessionStore();

  useEffect(() => {
    setRecommendationMode('travel');
  }, [setRecommendationMode]);

  useEffect(() => {
    if (isHydrated && !profile.completedOnboarding) {
      router.replace('/onboarding' as never);
    }
  }, [isHydrated, profile.completedOnboarding]);

  if (!authHydrated || status === 'checking') {
    return <Screen />;
  }

  if (status !== 'authenticated') {
    return <Redirect href={profile.completedOnboarding ? '/auth/login' : '/onboarding'} />;
  }

  if (!isHydrated || !profile.completedOnboarding) {
    return isHydrated ? <Redirect href="/onboarding" /> : <Screen />;
  }

  const openModeSheet = () => {
    if (session.status === 'ended') {
      resetSession();
    }

    setIsModeSheetVisible(true);
  };
  const handleSelectMode = (mode: TravelMode) => {
    setMode(mode);
  };
  const handleStartTravel = async () => {
    if (isStartingTravel) {
      return;
    }

    const nextMode = selectedMode ?? 'walk';

    if (!selectedMode) {
      setMode(nextMode);
    }

    setIsStartingTravel(true);
    setMapMessage(undefined);

    try {
      const startLocation = currentLocation ?? currentPlace?.location;
      const startedAt = new Date().toISOString();
      const initialRoutePoints = startLocation
        ? [createRoutePoint(startLocation, new Date(startedAt))]
        : undefined;
      const serverSession = await travelSessionApi.createTravelSession({
        location: startLocation,
        routePoints: initialRoutePoints,
        startedAt,
        travelMode: nextMode,
      });

      startSession({
        id: serverSession?.id,
        routePoints: serverSession?.routePoints ?? initialRoutePoints,
        startedAt: serverSession?.startedAt ?? startedAt,
      });
    } catch {
      const startLocation = currentLocation ?? currentPlace?.location;
      const startedAt = new Date().toISOString();

      startSession({
        routePoints: startLocation
          ? [createRoutePoint(startLocation, new Date(startedAt))]
          : undefined,
        startedAt,
      });
      setMapMessage('서버 여행 세션 연결에 실패해서 로컬 여행모드로 먼저 시작했어요.');
    } finally {
      setIsStartingTravel(false);
      setIsModeSheetVisible(false);
    }
  };
  const mapOverlayBottomInset = currentTrack
    ? getMiniPlayerBottom(insets.bottom) + layout.miniPlayerHeight + 14
    : getTabBarHeight(insets.bottom) + 14;
  const mapOverlayTopInset = insets.top + 12;

  return (
    <View className="flex-1 bg-soundlog-bg">
      <View className="flex-1">
        {mapMessage ? (
          <View
            className="absolute left-4 right-4 z-10 rounded-[16px] border border-amber-300/20 bg-black/64 px-4 py-3"
            style={{ top: mapOverlayTopInset }}
          >
            <AppText className="text-sm leading-5 text-amber-50">{mapMessage}</AppText>
          </View>
        ) : null}

        <RecapMapSection
          currentLocation={currentLocation}
          currentPlace={currentPlace}
          onCreateMoment={() =>
            router.push({
              params: { returnTo: 'map' },
              pathname: '/camera',
            } as never)
          }
          onOpenRecap={(recapId) => router.push(`/recap-share/${recapId}`)}
          onStartTravel={openModeSheet}
          overlayBottomInset={mapOverlayBottomInset}
          overlayTopInset={mapOverlayTopInset}
          sessionStatus={session.status}
          variant="page"
        />
      </View>

      {currentTrack ? <MiniPlayer /> : null}

      <TravelModeBottomSheet
        onClose={() => setIsModeSheetVisible(false)}
        onSelectMode={handleSelectMode}
        onStart={() => void handleStartTravel()}
        selectedMode={selectedMode}
        submitLabel={isStartingTravel ? '시작 중' : '여행 시작'}
        visible={isModeSheetVisible}
      />
    </View>
  );
}
