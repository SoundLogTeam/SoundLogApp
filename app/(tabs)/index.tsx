import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useFeaturedPlaylistsQuery,
  useMoodRecommendationsQuery,
  useRecentMusicLogsQuery,
} from '@/api/homeQueries';
import { libraryApi } from '@/api/libraryApi';
import { meApi } from '@/api/meApi';
import { PlaylistMlMood, PlaylistMlState } from '@/api/playlistApi';
import {
  playlistQueryKeys,
  useRecommendedPlaylistQuery,
} from '@/api/playlistQueries';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { useNearbyPlacesQuery } from '@/api/tourQueries';
import { MiniPlayer } from '@/components/MiniPlayer';
import { FeaturedPlaylistSection } from '@/components/home/FeaturedPlaylistSection';
import { CurrentSoundtrackCard } from '@/components/home/CurrentSoundtrackCard';
import { HomeSoundtrackBottomSheet } from '@/components/home/HomeSoundtrackBottomSheet';
import {
  HomeHeader,
  HomeNavigationBar,
  HomeTopFilterBar,
  isHomeTopFilter,
} from '@/components/home/HomeHeader';
import { LocationContextCard } from '@/components/home/LocationContextCard';
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
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import {
  createFeaturedPlaylistsCacheKey,
  createMoodRecommendationsCacheKey,
  useRecommendationCacheStore,
} from '@/store/recommendationCacheStore';
import { queryClient } from '@/providers/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import {
  FeaturedPlaylist,
  MoodRecommendation,
  MusicLogItem,
  PlaylistCuration,
  Track,
  TravelMode,
} from '@/types/domain';
import { toLibraryPlaylistSummary } from '@/utils/libraryPlaylistSummary';
import { requestForegroundLocationWithStatus } from '@/utils/location';
import { getMoodTagsFromFilter } from '@/utils/moodTags';
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

const travelModeDisplayLabel: Record<TravelMode, string> = {
  cafe: '카페',
  drive: '드라이브',
  festival: '축제',
  night: '야경',
  ocean: '바다',
  walk: '산책',
};

const travelStyleDisplayLabel: Record<string, string> = {
  '바다 보기': '바다',
  '야경 감상': '야경',
  '카페 투어': '카페',
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

function resolveCurrentTravelLabel(mode: TravelMode | undefined, travelStyles: string[]) {
  if (mode) {
    return travelModeDisplayLabel[mode];
  }

  const firstTravelStyle = travelStyles[0];

  return firstTravelStyle ? travelStyleDisplayLabel[firstTravelStyle] ?? firstTravelStyle : '산책';
}

function resolveCurrentMoodLabel(filter: string, preferredMoods: string[]) {
  if (filter !== '전체') {
    return filter;
  }

  return preferredMoods[0] ?? '잔잔한';
}

function toFeaturedPlaylist(playlist: PlaylistCuration): FeaturedPlaylist {
  return {
    id: playlist.id,
    regionName: playlist.regionName,
    description: playlist.reason,
    durationText: playlist.durationText,
    trackCount: playlist.trackCount,
  };
}

function HomeContent() {
  const insets = useSafeAreaInsets();
  const authStatus = useAuthStore((state) => state.status);
  const [actionMessage, setActionMessage] = useState<string>();
  const [isSoundtrackSheetVisible, setIsSoundtrackSheetVisible] = useState(false);
  const {
    selectedMoodFilter,
    selectedTopFilter,
    setSelectedMoodFilter,
    setSelectedTopFilter,
  } = useHomeFilterStore();
  const { currentTrack, setTrack } = usePlayerStore();
  const {
    isLiked,
    isSaved,
    likedTracks,
    savedTracks,
    seedFromPlaylist,
    setLikeState,
    setSaveState,
  } = useLibraryStore();
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
  const featuredPlaylistParams = useMemo(
    () => ({
      location: currentLocation,
      locationRecommendationEnabled: profile.locationRecommendationEnabled,
      place: currentPlace,
      recommendationMode,
    }),
    [
      currentLocation,
      currentPlace,
      profile.locationRecommendationEnabled,
      recommendationMode,
    ],
  );
  const moodRecommendationParams = useMemo(
    () => ({
      currentPlace,
      moodFilter: selectedMoodFilter,
      preferredGenres: profile.preferredGenres,
      preferredMoods: profile.preferredMoods,
      recommendationMode,
      topFilter: selectedTopFilter,
      travelStyles: profile.travelStyles,
    }),
    [
      currentPlace,
      profile.preferredGenres,
      profile.preferredMoods,
      profile.travelStyles,
      recommendationMode,
      selectedMoodFilter,
      selectedTopFilter,
    ],
  );
  const recommendedPlaylistInput = useMemo(
    () => ({
      location: currentLocation ?? currentPlace?.location,
      mood: resolvePlaylistMood(selectedMoodFilter, profile.preferredMoods),
      moodTags: getMoodTagsFromFilter(selectedMoodFilter),
      placeId: currentPlace?.id,
      preferredGenres: profile.preferredGenres,
      preferredMoods: profile.preferredMoods,
      state: resolvePlaylistState(selectedMode),
      travelMode: selectedMode,
    }),
    [
      currentLocation,
      currentPlace?.id,
      currentPlace?.location,
      profile.preferredGenres,
      profile.preferredMoods,
      selectedMode,
      selectedMoodFilter,
    ],
  );
  const featuredCacheKey = useMemo(
    () => createFeaturedPlaylistsCacheKey(featuredPlaylistParams),
    [featuredPlaylistParams],
  );
  const moodCacheKey = useMemo(
    () => createMoodRecommendationsCacheKey(moodRecommendationParams),
    [moodRecommendationParams],
  );
  const featuredFallback = useRecommendationCacheStore((state) => state.featuredFallback);
  const moodFallback = useRecommendationCacheStore((state) => state.moodFallback);
  const isUsingCachedFeaturedPlaylists = featuredFallback?.key === featuredCacheKey;
  const isUsingCachedMoodRecommendations = moodFallback?.key === moodCacheKey;
  const isAuthenticated = authStatus === 'authenticated';

  const nearbyPlacesQuery = useNearbyPlacesQuery({
    enabled: isAuthenticated && profile.locationRecommendationEnabled,
    location: currentLocation,
    radiusMeters: 2000,
  });
  const featuredPlaylistsQuery = useFeaturedPlaylistsQuery(featuredPlaylistParams, {
    enabled: isAuthenticated,
  });
  const recommendedPlaylistQuery = useRecommendedPlaylistQuery(recommendedPlaylistInput, {
    enabled: isAuthenticated && Boolean(recommendedPlaylistInput.location),
  });
  const {
    data: recommendedPlaylist,
    isError: isRecommendedPlaylistError,
    isFetching: isRecommendedPlaylistFetching,
    isLoading: isRecommendedPlaylistLoading,
    refetch: refetchRecommendedPlaylist,
  } = recommendedPlaylistQuery;
  const moodRecommendationsQuery = useMoodRecommendationsQuery(moodRecommendationParams, {
    enabled: isAuthenticated,
  });
  const recentMusicLogsQuery = useRecentMusicLogsQuery({ enabled: isAuthenticated });
  const currentSoundtrackPlaylist = useMemo(
    () => (recommendedPlaylist ? toFeaturedPlaylist(recommendedPlaylist) : undefined),
    [recommendedPlaylist],
  );
  const displayedFeaturedPlaylists = useMemo(() => {
    if (!currentSoundtrackPlaylist) {
      return featuredPlaylistsQuery.data;
    }

    return [
      currentSoundtrackPlaylist,
      ...(featuredPlaylistsQuery.data ?? []).filter(
        (playlist) => playlist.id !== currentSoundtrackPlaylist.id,
      ),
    ];
  }, [currentSoundtrackPlaylist, featuredPlaylistsQuery.data]);
  const currentSoundtrackSummary = useMemo(
    () => (recommendedPlaylist ? toLibraryPlaylistSummary(recommendedPlaylist) : undefined),
    [recommendedPlaylist],
  );
  const currentSoundtrackLikedTrackIds = useMemo(
    () =>
      new Set(
        recommendedPlaylist?.tracks
          .filter((track) => likedTracks.some((record) => record.track.id === track.id))
          .map((track) => track.id) ?? [],
      ),
    [likedTracks, recommendedPlaylist?.tracks],
  );
  const currentSoundtrackSavedTrackIds = useMemo(
    () =>
      new Set(
        recommendedPlaylist?.tracks
          .filter((track) => savedTracks.some((record) => record.track.id === track.id))
          .map((track) => track.id) ?? [],
      ),
    [recommendedPlaylist?.tracks, savedTracks],
  );
  const musicLogs = [
    ...momentLogs.slice(0, 6).map(momentLogToMusicLogItem),
    ...(recentMusicLogsQuery.data ?? []),
  ].slice(0, 10);
  const placeInfoMessage =
    profile.locationRecommendationEnabled &&
    currentLocation &&
    !nearbyPlacesQuery.isFetching &&
    (nearbyPlacesQuery.data?.length ?? 0) === 0
      ? '주변 관광지 결과가 없어도 기본 추천은 계속 사용할 수 있어요.'
      : nearbyPlacesQuery.isError
        ? '주변 관광지를 불러오지 못했지만 기본 추천은 계속 사용할 수 있어요.'
        : undefined;

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

  useEffect(() => {
    if (!recommendedPlaylist) {
      return;
    }

    queryClient.setQueryData(
      playlistQueryKeys.detail(recommendedPlaylist.id),
      recommendedPlaylist,
    );
  }, [recommendedPlaylist]);

  useEffect(() => {
    if (!recommendedPlaylist || !currentSoundtrackSummary) {
      return;
    }

    seedFromPlaylist(
      recommendedPlaylist.id,
      recommendedPlaylist.tracks,
      currentSoundtrackSummary,
    );
  }, [currentSoundtrackSummary, recommendedPlaylist, seedFromPlaylist]);

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

    setTrack(item.track);
    syncRecommendationEvent(
      addRecommendationEvent({
        context: createRecommendationEventContext(),
        playlistId: item.playlistId,
        trackId: item.track.id,
        type: 'track_selected',
        value: 'home_mood_recommendation',
      }),
    );
    setActionMessage('이 곡을 SoundLog 음악으로 선택했어요. 하단 패널에서 저장하거나 순간 기록에 담을 수 있어요.');
  };
  const handleSelectFeaturedPlaylist = useCallback(
    (playlist: FeaturedPlaylist) => {
      const isCurrentRecommendation = playlist.id === recommendedPlaylist?.id;

      setActionMessage(undefined);

      if (isCurrentRecommendation && recommendedPlaylist) {
        queryClient.setQueryData(
          playlistQueryKeys.detail(recommendedPlaylist.id),
          recommendedPlaylist,
        );
      }

      syncRecommendationEvent(
        addRecommendationEvent({
          context: createRecommendationEventContext({
            source: isCurrentRecommendation
              ? recommendedPlaylist?.context?.source
              : 'featured-playlist',
          }),
          playlistId: playlist.id,
          type: 'playlist_open',
          value: playlist.id,
        }),
      );
      router.push(`/playlist/${playlist.id}`);
    },
    [addRecommendationEvent, recommendedPlaylist],
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

  const handleRefreshCurrentSoundtrack = useCallback(() => {
    setActionMessage(undefined);

    if (!recommendedPlaylistInput.location) {
      void handleSetCurrentLocation();
      return;
    }

    void refetchRecommendedPlaylist();
  }, [
    handleSetCurrentLocation,
    recommendedPlaylistInput.location,
    refetchRecommendedPlaylist,
  ]);
  const handleOpenCurrentSoundtrack = useCallback(() => {
    setActionMessage(undefined);

    if (!recommendedPlaylistInput.location) {
      handleRefreshCurrentSoundtrack();
      return;
    }

    setIsSoundtrackSheetVisible(true);

    if (!recommendedPlaylist) {
      void refetchRecommendedPlaylist();
      return;
    }

    queryClient.setQueryData(
      playlistQueryKeys.detail(recommendedPlaylist.id),
      recommendedPlaylist,
    );
    syncRecommendationEvent(
      addRecommendationEvent({
        context: createRecommendationEventContext({
          moodFilter: selectedMoodFilter,
          source: recommendedPlaylist.context?.source,
        }),
        playlistId: recommendedPlaylist.id,
        type: 'playlist_open',
        value: recommendedPlaylist.id,
      }),
    );
  }, [
    addRecommendationEvent,
    handleRefreshCurrentSoundtrack,
    recommendedPlaylist,
    recommendedPlaylistInput.location,
    refetchRecommendedPlaylist,
    selectedMoodFilter,
  ]);
  const handleCloseCurrentSoundtrack = useCallback(() => {
    setIsSoundtrackSheetVisible(false);
  }, []);
  const handleSelectCurrentSoundtrackTrack = useCallback(
    (track: Track) => {
      if (!recommendedPlaylist) {
        return;
      }

      const context = createRecommendationEventContext({
        moodFilter: selectedMoodFilter,
        source: recommendedPlaylist.context?.source,
      });

      setActionMessage(undefined);
      setTrack(
        track,
        recommendedPlaylist.id,
        recommendedPlaylist.tracks,
        currentSoundtrackSummary,
      );
      syncRecommendationEvent(
        addRecommendationEvent({
          context,
          playlistId: recommendedPlaylist.id,
          trackId: track.id,
          type: 'track_selected',
          value: 'home_current_soundtrack',
        }),
      );
      setActionMessage('이 곡을 SoundLog 음악으로 선택했어요. 하단 패널에서 저장하거나 순간 기록에 담을 수 있어요.');
    },
    [
      addRecommendationEvent,
      currentSoundtrackSummary,
      recommendedPlaylist,
      selectedMoodFilter,
      setTrack,
    ],
  );
  const handleToggleCurrentSoundtrackLike = useCallback(
    (track: Track) => {
      const nextLiked = !isLiked(track.id);
      const context = createRecommendationEventContext({
        moodFilter: selectedMoodFilter,
        source: recommendedPlaylist?.context?.source,
      });

      setActionMessage(undefined);
      setLikeState(track, nextLiked, recommendedPlaylist?.id, currentSoundtrackSummary);
      void libraryApi
        .updateTrackState(track.id, {
          action: nextLiked ? 'like' : 'unlike',
          context,
          playlistId: recommendedPlaylist?.id,
        })
        .catch(() => {
          setLikeState(track, !nextLiked, recommendedPlaylist?.id, currentSoundtrackSummary);
          setActionMessage('서버 저장에 실패해서 좋아요 상태를 되돌렸어요.');
        });
      syncRecommendationEvent(
        addRecommendationEvent({
          context,
          playlistId: recommendedPlaylist?.id,
          trackId: track.id,
          type: nextLiked ? 'track_like' : 'track_unlike',
        }),
      );
    },
    [
      addRecommendationEvent,
      currentSoundtrackSummary,
      isLiked,
      recommendedPlaylist,
      selectedMoodFilter,
      setLikeState,
    ],
  );
  const handleToggleCurrentSoundtrackSave = useCallback(
    (track: Track) => {
      const nextSaved = !isSaved(track.id);
      const context = createRecommendationEventContext({
        moodFilter: selectedMoodFilter,
        source: recommendedPlaylist?.context?.source,
      });

      setActionMessage(undefined);
      setSaveState(track, nextSaved, recommendedPlaylist?.id, currentSoundtrackSummary);
      void libraryApi
        .updateTrackState(track.id, {
          action: nextSaved ? 'save' : 'unsave',
          context,
          playlistId: recommendedPlaylist?.id,
        })
        .catch(() => {
          setSaveState(track, !nextSaved, recommendedPlaylist?.id, currentSoundtrackSummary);
          setActionMessage('서버 저장에 실패해서 저장 상태를 되돌렸어요.');
        });
      syncRecommendationEvent(
        addRecommendationEvent({
          context,
          playlistId: recommendedPlaylist?.id,
          trackId: track.id,
          type: nextSaved ? 'track_save' : 'track_unsave',
        }),
      );
    },
    [
      addRecommendationEvent,
      currentSoundtrackSummary,
      isSaved,
      recommendedPlaylist,
      selectedMoodFilter,
      setSaveState,
    ],
  );

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

        <LocationContextCard
          enabled={profile.locationRecommendationEnabled}
          isLoading={locationStatus === 'loading'}
          isPlaceLoading={nearbyPlacesQuery.isFetching}
          location={currentLocation}
          onEnable={handleSetCurrentLocation}
          onRefresh={handleRefreshLocation}
          place={currentPlace}
          placeCount={nearbyPlacesQuery.data?.length ?? 0}
          placeInfoMessage={placeInfoMessage}
          status={locationStatus}
          updatedAt={locationUpdatedAt}
        />

        <CurrentSoundtrackCard
          currentPlace={currentPlace}
          isError={isRecommendedPlaylistError}
          isLoading={
            locationStatus === 'loading' ||
            isRecommendedPlaylistLoading ||
            isRecommendedPlaylistFetching
          }
          isOpeningPlaylist={
            isSoundtrackSheetVisible &&
            (isRecommendedPlaylistLoading || isRecommendedPlaylistFetching)
          }
          moodLabel={resolveCurrentMoodLabel(selectedMoodFilter, profile.preferredMoods)}
          needsLocation={!recommendedPlaylistInput.location}
          onCaptureMoment={() => router.push('/camera' as never)}
          onOpenPlaylist={handleOpenCurrentSoundtrack}
          onRetry={handleRefreshCurrentSoundtrack}
          playlist={currentSoundtrackPlaylist}
          recommendationSource={recommendedPlaylist?.context?.source}
          travelLabel={resolveCurrentTravelLabel(selectedMode, profile.travelStyles)}
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
          cachedAt={isUsingCachedFeaturedPlaylists ? featuredFallback?.cachedAt : undefined}
          data={displayedFeaturedPlaylists}
          isCached={isUsingCachedFeaturedPlaylists}
          isError={featuredPlaylistsQuery.isError}
          isLoading={featuredPlaylistsQuery.isLoading}
          onSelectPlaylist={handleSelectFeaturedPlaylist}
          onRetry={() => void featuredPlaylistsQuery.refetch()}
        />

        <View className="mt-2">
          <MoodRecommendationSection
            cachedAt={isUsingCachedMoodRecommendations ? moodFallback?.cachedAt : undefined}
            data={moodRecommendationsQuery.data}
            isCached={isUsingCachedMoodRecommendations}
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
      <HomeSoundtrackBottomSheet
        actionMessage={isSoundtrackSheetVisible ? actionMessage : undefined}
        currentTrackId={currentTrack?.id}
        isLoading={
          (isRecommendedPlaylistLoading || isRecommendedPlaylistFetching) &&
          !recommendedPlaylist
        }
        likedTrackIds={currentSoundtrackLikedTrackIds}
        onClose={handleCloseCurrentSoundtrack}
        onSelectTrack={handleSelectCurrentSoundtrackTrack}
        onToggleLike={handleToggleCurrentSoundtrackLike}
        onToggleSave={handleToggleCurrentSoundtrackSave}
        playlist={recommendedPlaylist}
        savedTrackIds={currentSoundtrackSavedTrackIds}
        visible={isSoundtrackSheetVisible}
      />
      {currentTrack ? <MiniPlayer /> : null}
    </Screen>
  );
}

export default function HomeScreen() {
  const { isHydrated: authHydrated, status } = useAuthStore();
  const { isHydrated, profile } = useUserProfileStore();

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

  return <HomeContent />;
}
