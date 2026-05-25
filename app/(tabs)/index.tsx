import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useFeaturedPlaylistsQuery,
  useMoodRecommendationsQuery,
  useRecentMusicLogsQuery,
} from '@/api/homeQueries';
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
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { MoodRecommendation } from '@/types/domain';
import { requestForegroundLocationWithStatus } from '@/utils/location';

function HomeContent() {
  const insets = useSafeAreaInsets();
  const { selectedMoodFilter, selectedTopFilter, setSelectedMoodFilter, setSelectedTopFilter } =
    useHomeFilterStore();
  const { currentTrack, setTrack } = usePlayerStore();
  const momentLogs = useMomentLogStore((state) => state.logs);
  const { profile, updateProfile } = useUserProfileStore();
  const {
    currentLocation,
    locationStatus,
    locationUpdatedAt,
    setLocation,
    setLocationStatus,
  } = useTravelSessionStore();

  const featuredPlaylistsQuery = useFeaturedPlaylistsQuery({
    location: currentLocation,
    locationRecommendationEnabled: profile.locationRecommendationEnabled,
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

  const handleSelectRecommendation = (item: MoodRecommendation) => {
    setTrack(item.track);
  };
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
          onSelectTopFilter={setSelectedTopFilter}
          selectedTopFilter={selectedTopFilter}
        />

        <LocationContextCard
          enabled={profile.locationRecommendationEnabled}
          isLoading={locationStatus === 'loading'}
          location={currentLocation}
          onEnable={handleEnableLocationRecommendation}
          onRefresh={handleRefreshLocation}
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
          onSelectMoodFilter={setSelectedMoodFilter}
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
