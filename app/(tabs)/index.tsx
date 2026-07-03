import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useFeaturedPlaylistsQuery,
  useMoodRecommendationsQuery,
  useRecentMusicLogsQuery,
} from '@/api/homeQueries';
import { meApi } from '@/api/meApi';
import { playlistApi, PlaylistMlMood, PlaylistMlState } from '@/api/playlistApi';
import { playlistQueryKeys } from '@/api/playlistQueries';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
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
import { queryClient } from '@/providers/queryClient';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { FeaturedPlaylist, MoodRecommendation, MusicLogItem, TravelMode } from '@/types/domain';
import { requestForegroundLocationWithStatus } from '@/utils/location';
import { getMoodTagsFromFilter } from '@/utils/moodTags';
import { getTrackExternalLink, openMusicPlatformUrl } from '@/utils/musicPlatformLinks';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

const moodFilterToMlMood: Record<string, PlaylistMlMood> = {
  감성적인: '감성적인',
  로컬한: '설레는',
  설레는: '설레는',
  시원한: '시원한',
  신나는: '신나는',
  잔잔한: '잔잔한',
  청량한: '시원한',
  활기찬: '신나는',
};

const travelModeToMlState: Partial<Record<TravelMode, PlaylistMlState>> = {
  cafe: '카페',
  drive: '드라이브',
  night: '야경',
  ocean: '바다',
  walk: '산책',
};

function resolvePlaylistMood(filter: string, preferredMoods: string[]): PlaylistMlMood {
  if (filter !== '전체' && moodFilterToMlMood[filter]) {
    return moodFilterToMlMood[filter];
  }

  return preferredMoods.map((mood) => moodFilterToMlMood[mood]).find(Boolean) ?? '잔잔한';
}

function resolvePlaylistState(mode?: TravelMode): PlaylistMlState {
  return (mode ? travelModeToMlState[mode] : undefined) ?? '산책';
}

function HomeContent() {
  const insets = useSafeAreaInsets();
  const [actionMessage, setActionMessage] = useState<string>();
  const [creatingPlaylistId, setCreatingPlaylistId] = useState<string>();
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

  const handleSelectRecommendation = async (item: MoodRecommendation) => {
    setActionMessage(undefined);

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

    const externalLink = getTrackExternalLink(item.track);

    setTrack(item.track);

    try {
      await openMusicPlatformUrl(externalLink);
      syncRecommendationEvent(
        addRecommendationEvent({
          context: createRecommendationEventContext(),
          trackId: item.track.id,
          type: 'track_external_open',
          value: externalLink.platformId,
        }),
      );
    } catch {
      setActionMessage('음악 링크를 열지 못했어요. 다시 시도해주세요.');
    }
  };
  const handleSelectFeaturedPlaylist = useCallback(
    async (playlist: FeaturedPlaylist) => {
      if (creatingPlaylistId) {
        return;
      }

      setActionMessage(undefined);
      setCreatingPlaylistId(playlist.id);

      try {
        const contextualPlaylist = await playlistApi.createContextualPlaylist(
          {
            location: currentLocation ?? currentPlace?.location,
            mood: resolvePlaylistMood(selectedMoodFilter, profile.preferredMoods),
            moodTags: getMoodTagsFromFilter(selectedMoodFilter),
            placeId: currentPlace?.id,
            preferredMoods: profile.preferredMoods,
            state: resolvePlaylistState(selectedMode),
            travelMode: selectedMode,
          },
          playlist.id,
        );
        const nextPlaylistId = contextualPlaylist?.id ?? playlist.id;

        if (contextualPlaylist) {
          queryClient.setQueryData(
            playlistQueryKeys.detail(nextPlaylistId),
            contextualPlaylist,
          );
        }

        syncRecommendationEvent(
          addRecommendationEvent({
            context: createRecommendationEventContext({
              moodFilter: selectedMoodFilter,
            }),
            playlistId: nextPlaylistId,
            type: 'playlist_open',
            value: nextPlaylistId,
          }),
        );
        router.push(`/playlist/${nextPlaylistId}`);
      } catch {
        setActionMessage('맞춤 플레이리스트를 만들지 못했어요. 잠시 후 다시 시도해주세요.');
      } finally {
        setCreatingPlaylistId(undefined);
      }
    },
    [
      addRecommendationEvent,
      creatingPlaylistId,
      currentLocation,
      currentPlace,
      profile.preferredMoods,
      selectedMode,
      selectedMoodFilter,
    ],
  );
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
  const handleEnableLocationRecommendation = useCallback(async () => {
    const nextProfile = {
      companionType: profile.companionType,
      locationRecommendationEnabled: true,
      preferredGenres: profile.preferredGenres,
      preferredMoods: profile.preferredMoods,
      travelStyles: profile.travelStyles,
    };

    setActionMessage(undefined);

    try {
      await meApi.updateProfile(nextProfile);
      updateProfile(nextProfile);
      return true;
    } catch {
      setActionMessage('위치 추천 설정을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
      return false;
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
  const handleSetCurrentLocation = useCallback(async () => {
    if (!profile.locationRecommendationEnabled) {
      const didEnable = await handleEnableLocationRecommendation();

      if (!didEnable) {
        return;
      }
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
          onSelectPlaylist={handleSelectFeaturedPlaylist}
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

        {actionMessage ? (
          <View className="rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
            <AppText className="text-xs leading-5 text-amber-100">{actionMessage}</AppText>
          </View>
        ) : null}

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
