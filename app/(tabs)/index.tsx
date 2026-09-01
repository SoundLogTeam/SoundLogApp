import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { travelSessionApi } from "@/api/travelSessionApi";
import { useAllMomentLogListQuery } from "@/api/momentLogQueries";
import { recapApi } from "@/api/recapApi";
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
import { useHomeFilterStore } from "@/store/homeFilterStore";
import { usePlayerStore } from "@/store/playerStore";
import { queryClient } from "@/providers/queryClient";
import { useTravelSessionStore } from "@/store/travelSessionStore";
import { useUserProfileStore } from "@/store/userProfileStore";
import type { TravelMode } from "@/types/domain";
import { requestForegroundLocationWithStatus } from "@/utils/location";
import { getMoodTagsFromFilter } from "@/utils/moodTags";

const NEARBY_TOUR_RADIUS_METERS = 2000;

export default function MapHomeScreen() {
  const insets = useSafeAreaInsets();
  useTravelRouteTracking();
  const { isHydrated: authHydrated, status } = useAuthStore();
  const { isHydrated, profile } = useUserProfileStore();
  const { currentTrack } = usePlayerStore();
  const { selectedMoodFilter } = useHomeFilterStore();
  const [isModeSheetVisible, setIsModeSheetVisible] = useState(false);
  const [isStartingTravel, setIsStartingTravel] = useState(false);
  const [isEndConfirmVisible, setIsEndConfirmVisible] = useState(false);
  const [isEndingTravel, setIsEndingTravel] = useState(false);
  const [mapMessage, setMapMessage] = useState<string>();
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
  const sessionMomentsQuery = useAllMomentLogListQuery(
    {
      sessionId: session.status === "active" ? session.id : undefined,
    },
    { enabled: status === "authenticated" && session.status === "active" },
  );
  const nearestTourPlace = currentLocation
    ? nearbyPlacesQuery.data?.find((place) => Boolean(place.location))
    : undefined;
  const cachedTourPlace =
    currentPlace?.location &&
    (currentPlace.source === "tour-api" || currentPlace.source === "seed")
      ? currentPlace
      : undefined;
  const nearbyTourPlaces = useMemo(() => {
    const places = (nearbyPlacesQuery.data ?? []).filter((place) =>
      Boolean(place.location),
    );

    if (places.length > 0) {
      return places;
    }

    return cachedTourPlace ? [cachedTourPlace] : [];
  }, [cachedTourPlace, nearbyPlacesQuery.data]);
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
  const sessionMomentCount = sessionMomentsQuery.data?.length ?? 0;
  const selectedMoodTags = useMemo(
    () => getMoodTagsFromFilter(selectedMoodFilter),
    [selectedMoodFilter],
  );

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

      if (!serverSession?.id) {
        throw new Error("travel_session_create_failed");
      }

      startSession({
        id: serverSession.id,
        routePoints: serverSession.routePoints ?? initialRoutePoints,
        startedAt: serverSession.startedAt ?? startedAt,
      });
    } catch {
      setMapMessage(
        "여행모드를 시작하지 못했어요. 네트워크를 확인한 뒤 다시 시도해주세요.",
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

    setIsEndingTravel(true);
    setMapMessage(undefined);

    try {
      const latestSessionLogs =
        (await sessionMomentsQuery.refetch()).data ?? [];

      const endedServerSession = await travelSessionApi.endTravelSession(
        endingSession.id,
        {
          endedAt,
          location: currentLocation ?? activeCurrentPlace?.location,
          routePoints: endingSession.routePoints,
        },
      );

      if (!endedServerSession) {
        throw new Error("travel_session_end_failed");
      }

      if (latestSessionLogs.length === 0) {
        endSession();
        setSessionRecapId(undefined);
        setIsEndConfirmVisible(false);
        setMapMessage(
          "여행을 종료했어요. 남긴 리캡이 없어 로그는 만들지 않았어요.",
        );
        return;
      }

      const backgroundLocation =
        latestSessionLogs[0]?.location ??
        currentLocation ??
        activeCurrentPlace?.location;
      const backgroundSuggestion = backgroundLocation
        ? await recapApi.getBackgroundSuggestion({
            location: backgroundLocation,
            moodTags: selectedMoodTags,
            travelMode: selectedMode,
          })
        : undefined;

      const recap = await recapApi.createRecap(
        {
          backgroundImageUrl:
            backgroundSuggestion?.backgroundImageUrl ?? undefined,
          momentLogIds: latestSessionLogs.map((log) => log.id),
          routePoints: endingSession.routePoints,
          sessionId: endingSession.id,
          templateId: "album",
          title: `${latestSessionLogs[0]?.placeName ?? "여행"} 로그`,
          visibility: "private",
        },
        `travel-log:${endingSession.id}`,
      );

      if (!recap) {
        throw new Error("travel_log_create_failed");
      }

      endSession();
      setSessionRecapId(recap.id);
      setIsEndConfirmVisible(false);
      await queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists });
      router.push(`/recap-share/${recap.id}`);
    } catch {
      setIsEndConfirmVisible(false);
      setMapMessage(
        "여행 로그를 서버에 저장하지 못했어요. 네트워크를 확인한 뒤 다시 종료해주세요.",
      );
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
          tourPlaces={nearbyTourPlaces}
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
