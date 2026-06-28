import { Redirect, router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useFeaturedPlaylistsQuery,
  useMoodRecommendationsQuery,
  useRecentMusicLogsQuery,
} from '@/api/homeQueries';
import { meApi } from '@/api/meApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { useNearbyPlacesQuery } from '@/api/tourQueries';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FeaturedPlaylistSection } from '@/components/home/FeaturedPlaylistSection';
import {
  HomeHeader,
  HomeNavigationBar,
  HomeTopFilterBar,
  isHomeTopFilter,
} from '@/components/home/HomeHeader';
import {
  MoodRecommendationSection,
  isMoodRecommendationFilter,
} from '@/components/home/MoodRecommendationSection';
import { MusicLogSection } from '@/components/home/MusicLogSection';
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
import { playSelectedSpotifyOrFallback } from '@/spotify/spotifyPlayback';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { MoodRecommendation, MusicLogItem } from '@/types/domain';
import { requestForegroundLocationWithStatus } from '@/utils/location';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

function HomeContent() {
  const insets = useSafeAreaInsets();
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
    resetSession,
    setLocation,
    setLocationStatus,
    setPlace,
    setRecommendationMode,
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
    if (item.playlistId) {
      router.push(`/playlist/${item.playlistId}`);
      syncRecommendationEvent(
        addRecommendationEvent({
          context: createRecommendationEventContext(),
          playlistId: item.playlistId,
          type: 'playlist_open',
          value: item.playlistId,
        }),
      );
      return;
    }

    setTrack(item.track);
    void playSelectedSpotifyOrFallback(item.track);
    syncRecommendationEvent(
      addRecommendationEvent({
        context: createRecommendationEventContext(),
        trackId: item.track.id,
        type: 'track_play',
        value: item.id,
      }),
    );
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
      syncRecommendationEvent(
        addRecommendationEvent({
          context: createRecommendationEventContext({ topFilter: filter }),
          type: 'top_filter_change',
          value: filter,
        }),
      );
    },
    [addRecommendationEvent, selectedTopFilter, setSelectedTopFilter],
  );
  const handleSelectMoodFilter = useCallback(
    (filter: string) => {
      if (filter === selectedMoodFilter) {
        return;
      }

      setSelectedMoodFilter(filter);
      syncRecommendationEvent(
        addRecommendationEvent({
          context: createRecommendationEventContext({ moodFilter: filter }),
          type: 'mood_filter_change',
          value: filter,
        }),
      );
    },
    [addRecommendationEvent, selectedMoodFilter, setSelectedMoodFilter],
  );
  const handleSelectRecommendationMode = useCallback(
    (mode: typeof recommendationMode) => {
      if (mode === recommendationMode) {
        return;
      }

      setRecommendationMode(mode);
      syncRecommendationEvent(
        addRecommendationEvent({
          context: createRecommendationEventContext({ recommendationMode: mode }),
          type: 'recommendation_mode_change',
          value: mode,
        }),
      );
    },
    [addRecommendationEvent, recommendationMode, setRecommendationMode],
  );
  const handleEnableLocationRecommendation = () => {
    const nextProfile = {
      companionType: profile.companionType,
      locationRecommendationEnabled: true,
      preferredGenres: profile.preferredGenres,
      preferredMoods: profile.preferredMoods,
      travelStyles: profile.travelStyles,
    };

    updateProfile(nextProfile);
    void meApi.updateProfile(nextProfile).catch(() => undefined);
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

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 20,
          paddingBottom: getHomeContentBottomPadding(
            insets.bottom,
            Boolean(currentTrack),
          ),
          paddingHorizontal: 20,
          paddingTop: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeNavigationBar />

        <HomeHeader
          onSelectRecommendationMode={handleSelectRecommendationMode}
          recommendationMode={recommendationMode}
        />

        {recommendationMode === 'travel' ? (
          <View className="-mt-2">
            <TravelSessionCard
              currentPlace={currentPlace}
              endedAt={session.endedAt}
              onDismissEnded={resetSession}
              onOpenRecap={() => router.push('/recap')}
              onOpenTravel={() => router.push('/(tabs)/travel' as never)}
              selectedMode={selectedMode}
              startedAt={session.startedAt}
              status={session.status}
            />
          </View>
        ) : null}

        <View className={recommendationMode === 'travel' ? '' : '-mt-2'}>
          <HomeTopFilterBar
            onSelectTopFilter={handleSelectTopFilter}
            selectedTopFilter={selectedTopFilter}
          />
        </View>

        <FeaturedPlaylistSection
          data={featuredPlaylistsQuery.data}
          isError={featuredPlaylistsQuery.isError}
          isLoading={featuredPlaylistsQuery.isLoading}
          onRetry={() => void featuredPlaylistsQuery.refetch()}
        />

        <View className="mt-2">
          <MoodRecommendationSection
            data={moodRecommendationsQuery.data}
            isError={moodRecommendationsQuery.isError}
            isLoading={moodRecommendationsQuery.isLoading}
            onSelectMoodFilter={handleSelectMoodFilter}
            onSelectRecommendation={handleSelectRecommendation}
            selectedMoodFilter={selectedMoodFilter}
          />
        </View>

        <View className="mt-2">
          <MusicLogSection
            data={musicLogs}
            isError={recentMusicLogsQuery.isError}
            isLoading={recentMusicLogsQuery.isLoading && momentLogs.length === 0}
            onSelectLog={handleSelectMusicLog}
          />
        </View>
      </ScrollView>
      {currentTrack ? <MiniPlayer /> : null}
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
    return isHydrated ? <Redirect href="/onboarding" /> : <Screen />;
  }

  return <HomeContent />;
}
