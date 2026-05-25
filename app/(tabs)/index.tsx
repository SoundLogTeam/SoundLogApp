import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
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
import { HomeHeader } from '@/components/home/HomeHeader';
import { LocationContextCard } from '@/components/home/LocationContextCard';
import { MoodRecommendationSection } from '@/components/home/MoodRecommendationSection';
import { MusicLogSection } from '@/components/home/MusicLogSection';
import { Screen } from '@/components/Screen';
import { getHomeContentBottomPadding } from '@/constants/layout';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { momentLogToMusicLogItem, useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { MoodRecommendation } from '@/types/domain';
import { requestForegroundLocationWithStatus } from '@/utils/location';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

function HomeContent() {
  const insets = useSafeAreaInsets();
  const { selectedMoodFilter, selectedTopFilter, setSelectedMoodFilter, setSelectedTopFilter } =
    useHomeFilterStore();
  const { currentTrack, setTrack } = usePlayerStore();
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);
  const momentLogs = useMomentLogStore((state) => state.logs);
  const { profile, updateProfile } = useUserProfileStore();
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
  const featuredPlaylistsQuery = useFeaturedPlaylistsQuery({
    location: currentLocation,
    locationRecommendationEnabled: profile.locationRecommendationEnabled,
    place: currentPlace,
  });
  const moodRecommendationsQuery = useMoodRecommendationsQuery({
    moodFilter: selectedMoodFilter,
    preferredGenres: profile.preferredGenres,
    preferredMoods: profile.preferredMoods,
    topFilter: selectedTopFilter,
    travelStyles: profile.travelStyles,
  });
  const recentMusicLogsQuery = useRecentMusicLogsQuery();
  const musicLogs = [
    ...momentLogs.slice(0, 6).map(momentLogToMusicLogItem),
    ...(recentMusicLogsQuery.data ?? []),
  ].slice(0, 10);

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

  return (
    <Screen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          gap: 32,
          paddingBottom: getHomeContentBottomPadding(insets.bottom, Boolean(currentTrack)),
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          onSelectTopFilter={handleSelectTopFilter}
          selectedTopFilter={selectedTopFilter}
        />

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
            currentPlace?.source === 'mock' ? 'TourAPI 키가 없거나 실패해 임시 장소 데이터를 사용 중이에요.' : undefined
          }
          status={locationStatus}
          updatedAt={locationUpdatedAt}
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
        />
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
    return <Screen />;
  }

  return <HomeContent />;
}
