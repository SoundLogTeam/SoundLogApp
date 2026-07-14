import { Redirect, router } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { travelSessionApi } from "@/api/travelSessionApi";
import { recapQueryKeys } from "@/api/recapQueries";
import { useNearbyPlacesQuery } from "@/api/tourQueries";
import { AppText } from "@/components/AppText";
import { MiniPlayer } from "@/components/MiniPlayer";
import { Screen } from "@/components/Screen";
import { EndTravelConfirmModal } from "@/components/travel/EndTravelConfirmModal";
import { TravelModeBottomSheet } from "@/components/travel/TravelModeBottomSheet";
import { RecapMapSection } from "@/components/travel/recap-map";
import {
  getMiniPlayerBottom,
  getTabBarHeight,
  layout,
} from "@/constants/layout";
import {
  createRoutePoint,
  useTravelRouteTracking,
} from "@/hooks/useTravelRouteTracking";
import { useAuthStore } from "@/store/authStore";
import { useMomentLogStore } from "@/store/momentLogStore";
import { usePlayerStore } from "@/store/playerStore";
import { queryClient } from "@/providers/queryClient";
import { useTravelSessionStore } from "@/store/travelSessionStore";
import { useTravelLogSyncStore } from "@/store/travelLogSyncStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import type { TravelMode } from "@/types/domain";
import { requestForegroundLocationWithStatus } from "@/utils/location";
import { createSessionRecapId } from "@/utils/recapMappers";
import { flushPendingMomentActions } from "@/utils/momentLogSync";
import { flushPendingTravelLogFinalizations } from "@/utils/travelLogSync";

const NEARBY_TOUR_RADIUS_METERS = 2000;

export default function MapHomeScreen() {
  const insets = useSafeAreaInsets();
  useTravelRouteTracking();
  const { isHydrated: authHydrated, status } = useAuthStore();
  const { isHydrated, profile } = useUserProfileStore();
  const { currentTrack } = usePlayerStore();
  const [isModeSheetVisible, setIsModeSheetVisible] = useState(false);
  const [isStartingTravel, setIsStartingTravel] = useState(false);
  const [isEndConfirmVisible, setIsEndConfirmVisible] = useState(false);
  const [isEndingTravel, setIsEndingTravel] = useState(false);
  const [mapMessage, setMapMessage] = useState<string>();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const {
    clearLocation,
    currentLocation,
    currentPlace,
    endSession,
    locationStatus,
    selectedMode,
    session,
    resetSession,
    setLocation,
    setLocationStatus,
    setMode,
    setPlace,
    setRecommendationMode,
    setSessionRecapId,
    startSession,
  } = useTravelSessionStore();
  const nearbyPlacesQuery = useNearbyPlacesQuery({
    enabled:
      status === "authenticated" &&
      isHydrated &&
      profile.locationRecommendationEnabled,
    location: currentLocation,
    radiusMeters: NEARBY_TOUR_RADIUS_METERS,
  });
  const nearestTourPlace = currentLocation
    ? nearbyPlacesQuery.data?.find(
        (place) => place.source === "tour-api" && Boolean(place.location),
      )
    : undefined;
  const cachedTourPlace =
    currentPlace?.source === "tour-api" && currentPlace.location
      ? currentPlace
      : undefined;
  const activeCurrentPlace = currentLocation
    ? nearestTourPlace
    : cachedTourPlace;
  const tourPlaceStatus = activeCurrentPlace
    ? "ready"
    : !currentLocation
      ? "unavailable"
      : !profile.locationRecommendationEnabled
        ? "disabled"
        : nearbyPlacesQuery.isFetching
          ? "loading"
          : nearbyPlacesQuery.isError
            ? "error"
            : "empty";
  const sessionMomentCount = momentLogs.filter(
    (log) => log.sessionId === session.id,
  ).length;

  useEffect(
    function synchronizeRecommendationMode() {
      setRecommendationMode("travel");
    },
    [setRecommendationMode],
  );

  useEffect(
    function loadInitialLocationAfterLogin() {
      if (
        status !== "authenticated" ||
        !isHydrated ||
        !profile.completedOnboarding ||
        !profile.locationRecommendationEnabled ||
        currentLocation ||
        locationStatus !== "idle"
      ) {
        return;
      }

      setLocationStatus("loading");

      void requestForegroundLocationWithStatus()
        .then((result) => {
          if (useAuthStore.getState().status !== "authenticated") {
            return;
          }

          if (result.location) {
            setLocation(result.location);
            return;
          }

          if (result.status === "denied") {
            clearLocation();
          }
          setLocationStatus(
            result.status === "denied" ? "denied" : "unavailable",
          );
        })
        .catch(() => {
          if (useAuthStore.getState().status === "authenticated") {
            setLocationStatus("unavailable");
          }
        });
    },
    [
      clearLocation,
      currentLocation,
      isHydrated,
      locationStatus,
      profile.completedOnboarding,
      profile.locationRecommendationEnabled,
      setLocation,
      setLocationStatus,
      status,
    ],
  );

  useEffect(
    function redirectIncompleteOnboarding() {
      if (isHydrated && !profile.completedOnboarding) {
        router.replace("/onboarding" as never);
      }
    },
    [isHydrated, profile.completedOnboarding],
  );

  useEffect(
    function synchronizeNearestTourPlace() {
      if (
        !currentLocation ||
        !nearbyPlacesQuery.isSuccess ||
        !nearestTourPlace
      ) {
        return;
      }

      if (nearestTourPlace.id !== currentPlace?.id) {
        setPlace(nearestTourPlace);
      }
    },
    [
      currentLocation,
      currentPlace?.id,
      nearestTourPlace,
      nearbyPlacesQuery.isSuccess,
      setPlace,
    ],
  );

  if (!authHydrated || status === "checking") {
    return <Screen />;
  }

  if (status !== "authenticated") {
    return (
      <Redirect
        href={profile.completedOnboarding ? "/auth/login" : "/onboarding"}
      />
    );
  }

  if (!isHydrated || !profile.completedOnboarding) {
    return isHydrated ? <Redirect href="/onboarding" /> : <Screen />;
  }

  const openModeSheet = () => {
    if (session.status === "ended") {
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

    const nextMode = selectedMode ?? "walk";

    if (!selectedMode) {
      setMode(nextMode);
    }

    setIsStartingTravel(true);
    setMapMessage(undefined);

    try {
      const startLocation = currentLocation ?? activeCurrentPlace?.location;
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
      const startLocation = currentLocation ?? activeCurrentPlace?.location;
      const startedAt = new Date().toISOString();

      startSession({
        routePoints: startLocation
          ? [createRoutePoint(startLocation, new Date(startedAt))]
          : undefined,
        startedAt,
      });
      setMapMessage(
        "서버 여행 세션 연결에 실패해서 로컬 여행모드로 먼저 시작했어요.",
      );
    } finally {
      setIsStartingTravel(false);
      setIsModeSheetVisible(false);
    }
  };
  const handleEndTravel = async () => {
    if (isEndingTravel || session.status !== "active") {
      return;
    }

    const endingSession = session;
    const endedAt = new Date().toISOString();
    const localRecapId = createSessionRecapId(endingSession.id);

    setIsEndingTravel(true);
    setMapMessage(undefined);

    try {
      await flushPendingMomentActions();

      const latestSessionLogs = useMomentLogStore
        .getState()
        .logs.filter((log) => log.sessionId === endingSession.id);

      endSession();
      setIsEndConfirmVisible(false);

      if (latestSessionLogs.length === 0) {
        setSessionRecapId(undefined);
        setMapMessage(
          "여행을 종료했어요. 남긴 리캡이 없어 로그는 만들지 않았어요.",
        );
        return;
      }

      useTravelLogSyncStore.getState().queueFinalization({
        endedAt,
        location: currentLocation ?? activeCurrentPlace?.location,
        routePoints: endingSession.routePoints,
        sessionId: endingSession.id,
        templateId: "album",
        title: `${latestSessionLogs[0]?.placeName ?? "여행"} 로그`,
      });
      const syncResult = await flushPendingTravelLogFinalizations();
      const recapId =
        syncResult.createdRecapIds[endingSession.id] ?? localRecapId;

      setSessionRecapId(recapId);
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });

      if (recapId === localRecapId) {
        setMapMessage(
          "서버 동기화가 끝나면 여행 로그가 자동으로 완성돼요. 지금은 기기 기록을 보여드릴게요.",
        );
      }

      router.push(`/recap-share/${recapId}`);
    } catch {
      endSession();
      setSessionRecapId(localRecapId);
      setIsEndConfirmVisible(false);
      setMapMessage(
        "서버 로그 생성에 실패해 기기에 저장된 여행 로그를 먼저 보여드려요.",
      );
      router.push(`/recap-share/${localRecapId}`);
    } finally {
      setIsEndingTravel(false);
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
            style={{ top: mapOverlayTopInset + 126 }}
          >
            <AppText className="text-sm leading-5 text-amber-50">
              {mapMessage}
            </AppText>
          </View>
        ) : null}

        <RecapMapSection
          currentLocation={currentLocation}
          currentPlace={activeCurrentPlace}
          onCreateMoment={() =>
            router.push({
              params: { returnTo: "map" },
              pathname: "/camera",
            } as never)
          }
          isEndingTravel={isEndingTravel}
          onEndTravel={() => setIsEndConfirmVisible(true)}
          onOpenRecap={(recapId) => router.push(`/recap-share/${recapId}`)}
          onStartTravel={openModeSheet}
          overlayBottomInset={mapOverlayBottomInset}
          overlayTopInset={mapOverlayTopInset}
          sessionStatus={session.status}
          tourPlaceStatus={tourPlaceStatus}
          variant="page"
        />
      </View>

      {currentTrack ? <MiniPlayer /> : null}

      <TravelModeBottomSheet
        onClose={() => setIsModeSheetVisible(false)}
        onSelectMode={handleSelectMode}
        onStart={() => void handleStartTravel()}
        selectedMode={selectedMode}
        submitLabel={isStartingTravel ? "시작 중" : "여행 시작"}
        visible={isModeSheetVisible}
      />

      <EndTravelConfirmModal
        isConfirming={isEndingTravel}
        momentCount={sessionMomentCount}
        onCancel={() => setIsEndConfirmVisible(false)}
        onConfirm={() => void handleEndTravel()}
        visible={isEndConfirmVisible}
      />
    </View>
  );
}
