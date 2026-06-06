import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useFeaturedPlaylistsQuery,
  useMoodRecommendationsQuery,
  useRecentMusicLogsQuery,
} from '@/api/homeQueries';
import { useNearbyPlacesQuery } from '@/api/tourQueries';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FeaturedPlaylistSection } from '@/components/home/FeaturedPlaylistSection';
import {
  HomeHeader,
  HomeTopFilterBar,
  isHomeTopFilter,
} from '@/components/home/HomeHeader';
import {
  MoodRecommendationSection,
  isMoodRecommendationFilter,
} from '@/components/home/MoodRecommendationSection';
import { MusicLogSection } from '@/components/home/MusicLogSection';
import { TravelModeSuggestionSheet } from '@/components/home/TravelModeSuggestionSheet';
import { TravelSessionCard } from '@/components/home/TravelSessionCard';
import { Screen } from '@/components/Screen';
import { getHomeContentBottomPadding } from '@/constants/layout';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import {
  momentLogToMusicLogItem,
  useMomentLogStore,
} from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { MoodRecommendation, MusicLogItem } from '@/types/domain';
import { requestForegroundLocationWithStatus } from '@/utils/location';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

function HomeContent() {
  const insets = useSafeAreaInsets();
  const [dismissedSuggestionPlaceId, setDismissedSuggestionPlaceId] =
    useState<string>();
  const {
    selectedMoodFilter,
    selectedTopFilter,
    setSelectedMoodFilter,
    setSelectedTopFilter,
  } = useHomeFilterStore();
  const { currentTrack, setTrack } = usePlayerStore();
  const addRecommendationEvent = useRecommendationEventStore(
    (state) => state.addEvent,
  );
  const momentLogs = useMomentLogStore((state) => state.logs);
  const { profile, updateProfile } = useUserProfileStore();
  const {
    currentLocation,
    currentPlace,
    locationStatus,
    locationUpdatedAt,
    recommendationMode,
    selectedMode,
    session,
    endSession,
    setLocation,
    setLocationStatus,
    setMode,
    setPlace,
    setRecommendationMode,
    startSession,
  } = useTravelSessionStore();

  const nearbyPlacesQuery = useNearbyPlacesQuery({
    enabled: profile.locationRecommendationEnabled,
    location: currentLocation,
    radiusMeters: 2000,
  });
  const featuredPlaylistsQuery = useFeaturedPlaylistsQuery({
    location: currentLocation,
    locationRecommendationEnabled: profile.locationRecommendationEnabled,
    place: currentPlace,
    recommendationMode,
  });
  const moodRecommendationsQuery = useMoodRecommendationsQuery({
    currentPlace,
    moodFilter: selectedMoodFilter,
    preferredGenres: profile.preferredGenres,
    preferredMoods: profile.preferredMoods,
    recommendationMode,
    topFilter: selectedTopFilter,
    travelStyles: profile.travelStyles,
  });
  const recentMusicLogsQuery = useRecentMusicLogsQuery();
  const musicLogs = [
    ...momentLogs.slice(0, 6).map(momentLogToMusicLogItem),
    ...(recentMusicLogsQuery.data ?? []),
  ].slice(0, 10);

  useEffect(() => {
    if (!isMoodRecommendationFilter(selectedMoodFilter)) {
      setSelectedMoodFilter('전체');
    }
  }, [selectedMoodFilter, setSelectedMoodFilter]);

  useEffect(() => {
    if (!isHomeTopFilter(selectedTopFilter)) {
      setSelectedTopFilter('전체');
    }
  }, [selectedTopFilter, setSelectedTopFilter]);

  useEffect(() => {
    if (!nearbyPlacesQuery.data) {
      return;
    }

    const nextPlace = nearbyPlacesQuery.data[0];

    if (nextPlace?.id !== currentPlace?.id) {
      setPlace(nextPlace);
    }
  }, [currentPlace?.id, nearbyPlacesQuery.data, setPlace]);

  const handleSelectRecommendation = (item: MoodRecommendation) => {
    setTrack(item.track);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      trackId: item.track.id,
      type: 'track_play',
      value: item.id,
    });
  };
  const handleSelectMusicLog = useCallback((item: MusicLogItem) => {
    router.push(`/recap-share/${item.recapShareId ?? item.id}`);
  }, []);
  const handleSelectTopFilter = useCallback(
    (filter: string) => {
      if (filter === selectedTopFilter) {
        return;
      }

      setSelectedTopFilter(filter);
      addRecommendationEvent({
        context: createRecommendationEventContext({ topFilter: filter }),
        type: 'top_filter_change',
        value: filter,
      });
    },
    [addRecommendationEvent, selectedTopFilter, setSelectedTopFilter],
  );
  const handleSelectMoodFilter = useCallback(
    (filter: string) => {
      if (filter === selectedMoodFilter) {
        return;
      }

      setSelectedMoodFilter(filter);
      addRecommendationEvent({
        context: createRecommendationEventContext({ moodFilter: filter }),
        type: 'mood_filter_change',
        value: filter,
      });
    },
    [addRecommendationEvent, selectedMoodFilter, setSelectedMoodFilter],
  );
  const handleSelectRecommendationMode = useCallback(
    (mode: typeof recommendationMode) => {
      if (mode === recommendationMode) {
        return;
      }

      setRecommendationMode(mode);
      addRecommendationEvent({
        context: createRecommendationEventContext({ recommendationMode: mode }),
        type: 'recommendation_mode_change',
        value: mode,
      });
    },
    [addRecommendationEvent, recommendationMode, setRecommendationMode],
  );
  const handleEnableLocationRecommendation = () => {
    updateProfile({
      companionType: profile.companionType,
      locationRecommendationEnabled: true,
      preferredGenres: profile.preferredGenres,
      preferredMoods: profile.preferredMoods,
      travelStyles: profile.travelStyles,
    });
  };
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
  const handleSetCurrentLocation = useCallback(() => {
    if (!profile.locationRecommendationEnabled) {
      handleEnableLocationRecommendation();
    }

    void handleRefreshLocation();
  }, [
    handleEnableLocationRecommendation,
    handleRefreshLocation,
    profile.locationRecommendationEnabled,
  ]);

  const shouldShowTravelModeSuggestion =
    Boolean(currentPlace) &&
    profile.locationRecommendationEnabled &&
    recommendationMode === 'everyday' &&
    dismissedSuggestionPlaceId !== currentPlace?.id;

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 32,
          paddingBottom: getHomeContentBottomPadding(
            insets.bottom,
            Boolean(currentTrack),
          ),
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          currentPlace={currentPlace}
          isLocationLoading={locationStatus === 'loading'}
          onSelectRecommendationMode={handleSelectRecommendationMode}
          onSetCurrentLocation={handleSetCurrentLocation}
          recommendationMode={recommendationMode}
        />

        <TravelSessionCard
          endedAt={session.endedAt}
          onEndSession={endSession}
          onOpenRecap={() => router.push('/recap')}
          onSelectMode={setMode}
          onStartSession={startSession}
          selectedMode={selectedMode}
          startedAt={session.startedAt}
          status={session.status}
        />

        <HomeTopFilterBar
          onSelectTopFilter={handleSelectTopFilter}
          selectedTopFilter={selectedTopFilter}
        />

        <FeaturedPlaylistSection
          data={featuredPlaylistsQuery.data}
          isError={featuredPlaylistsQuery.isError}
          isLoading={featuredPlaylistsQuery.isLoading}
          onRetry={() => void featuredPlaylistsQuery.refetch()}
        />

        <MoodRecommendationSection
          data={moodRecommendationsQuery.data}
          isError={moodRecommendationsQuery.isError}
          isLoading={moodRecommendationsQuery.isLoading}
          onSelectMoodFilter={handleSelectMoodFilter}
          onSelectRecommendation={handleSelectRecommendation}
          selectedMoodFilter={selectedMoodFilter}
        />

        <MusicLogSection
          data={musicLogs}
          isError={recentMusicLogsQuery.isError}
          isLoading={recentMusicLogsQuery.isLoading && momentLogs.length === 0}
          onSelectLog={handleSelectMusicLog}
        />
      </ScrollView>
      {currentTrack ? <MiniPlayer /> : null}
      {shouldShowTravelModeSuggestion && currentPlace ? (
        <TravelModeSuggestionSheet
          onDismiss={() => setDismissedSuggestionPlaceId(currentPlace.id)}
          onStartTravelMode={() => {
            handleSelectRecommendationMode('travel');
            setDismissedSuggestionPlaceId(currentPlace.id);
          }}
          place={currentPlace}
        />
      ) : null}
    </Screen>
  );
}

export default function HomeScreen() {
  const { isHydrated, profile } = useUserProfileStore();

  useEffect(() => {
    if (isHydrated && !profile.completedOnboarding) {
      router.replace('/onboarding' as never);
    }
  }, [isHydrated, profile.completedOnboarding]);

  if (!isHydrated || !profile.completedOnboarding) {
    return <Screen />;
  }

  return <HomeContent />;
}
