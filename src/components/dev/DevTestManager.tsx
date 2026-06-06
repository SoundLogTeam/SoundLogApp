import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ReactNode, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { queryClient } from '@/providers/queryClient';
import { AppText } from '@/components/AppText';
import { playlistCurationById } from '@/mocks/playlistMocks';
import { mockEndpointIds, useDevToolsStore } from '@/store/devToolsStore';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { useUserProfileStore } from '@/store/userProfileStore';
import { GeoPoint, MomentLog, PlaceContext, Track, TravelMode } from '@/types/domain';

const BUTTON_SIZE = 58;
const DEFAULT_DELAY_MS = 300;
const SLOW_DELAY_MS = 1600;
const samplePlaylist = playlistCurationById['busan-ocean'];
const sampleTracks = samplePlaylist.tracks;

const placePresets: Array<{
  label: string;
  location: GeoPoint;
  place: PlaceContext;
}> = [
  {
    label: '부산 광안리',
    location: { lat: 35.1532, lng: 129.1186 },
    place: {
      category: '해변',
      contentType: '관광지',
      id: 'dev-busan-gwangalli',
      imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
      location: { lat: 35.1532, lng: 129.1186 },
      overview: '바다와 야경, 산책 맥락을 테스트하는 개발용 장소입니다.',
      source: 'mock',
      title: '광안리 해수욕장',
    },
  },
  {
    label: '서울 야경',
    location: { lat: 37.5512, lng: 126.9882 },
    place: {
      category: '야경',
      contentType: '문화시설',
      id: 'dev-seoul-night',
      imageUrl: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
      location: { lat: 37.5512, lng: 126.9882 },
      overview: '도시 야경과 감성 음악 추천을 테스트하는 개발용 장소입니다.',
      source: 'mock',
      title: '남산서울타워',
    },
  },
];

const topFilterOptions = ['전체', '근처', '지역 트렌드', '내 취향', '저장 많은'];
const moodFilterOptions = ['전체', '잔잔한', '신나는', '감성적인', '청량한', '활기찬', '로컬한'];
const travelModeOptions: Array<{ label: string; value: TravelMode }> = [
  { label: '산책', value: 'walk' },
  { label: '드라이브', value: 'drive' },
  { label: '카페', value: 'cafe' },
  { label: '바다', value: 'ocean' },
  { label: '축제', value: 'festival' },
  { label: '야경', value: 'night' },
];

type ManagerButtonProps = {
  active?: boolean;
  destructive?: boolean;
  label: string;
  onPress: () => void;
};

type ManagerSectionProps = {
  children: ReactNode;
  subtitle?: string;
  title: string;
};

type StatusPillProps = {
  label: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function invalidateMockQueries() {
  void queryClient.invalidateQueries();
}

function ManagerSection({ children, subtitle, title }: ManagerSectionProps) {
  return (
    <View className="rounded-[20px] border border-white/10 bg-white/[0.07] p-4">
      <AppText className="text-base font-semibold text-white">{title}</AppText>
      {subtitle ? (
        <AppText className="mt-1 text-xs leading-5 text-white/45">{subtitle}</AppText>
      ) : null}
      <View className="mt-3 flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

function ManagerButton({
  active = false,
  destructive = false,
  label,
  onPress,
}: ManagerButtonProps) {
  const backgroundColor = active
    ? '#ffffff'
    : destructive
      ? 'rgba(248,113,113,0.16)'
      : 'rgba(255,255,255,0.1)';
  const borderColor = active
    ? '#ffffff'
    : destructive
      ? 'rgba(248,113,113,0.28)'
      : 'rgba(255,255,255,0.12)';
  const color = active ? '#050916' : destructive ? '#fecaca' : 'rgba(255,255,255,0.78)';

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-10 justify-center rounded-full border px-4 py-2"
      onPress={onPress}
      style={{ backgroundColor, borderColor }}
    >
      <AppText className="text-xs font-semibold" style={{ color }}>
        {label}
      </AppText>
    </Pressable>
  );
}

function StatusPill({ label }: StatusPillProps) {
  return (
    <View className="min-h-10 justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2">
      <AppText className="text-xs font-semibold text-white/58">{label}</AppText>
    </View>
  );
}

function getSampleTrack(index = 0): Track {
  return sampleTracks[index % sampleTracks.length];
}

export function DevTestManager() {
  if (!__DEV__) {
    return null;
  }

  return <DevTestManagerContent />;
}

function DevTestManagerContent() {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const maxX = Math.max(width - BUTTON_SIZE - 12, 12);
  const maxY = Math.max(height - BUTTON_SIZE - Math.max(insets.bottom, 12) - 12, 80);
  const defaultPosition = useMemo(
    () => ({
      x: 14,
      y: Math.max(height - BUTTON_SIZE - Math.max(insets.bottom, 12) - 110, 90),
    }),
    [height, insets.bottom],
  );
  const pan = useRef(new Animated.ValueXY(defaultPosition)).current;
  const lastPosition = useRef(defaultPosition);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4,
        onPanResponderMove: (_, gesture) => {
          pan.setValue({
            x: clamp(lastPosition.current.x + gesture.dx, 8, maxX),
            y: clamp(lastPosition.current.y + gesture.dy, 64, maxY),
          });
        },
        onPanResponderRelease: (_, gesture) => {
          const nextPosition = {
            x: clamp(lastPosition.current.x + gesture.dx, 8, maxX),
            y: clamp(lastPosition.current.y + gesture.dy, 64, maxY),
          };

          lastPosition.current = nextPosition;
          Animated.spring(pan, {
            toValue: nextPosition,
            useNativeDriver: false,
          }).start();
        },
      }),
    [maxX, maxY, pan],
  );

  const { selectedMoodFilter, selectedTopFilter, setSelectedMoodFilter, setSelectedTopFilter } =
    useHomeFilterStore();
  const { currentLocation, currentPlace, locationStatus, selectedMode, session } =
    useTravelSessionStore();
  const clearLocation = useTravelSessionStore((state) => state.clearLocation);
  const endSession = useTravelSessionStore((state) => state.endSession);
  const resetSession = useTravelSessionStore((state) => state.resetSession);
  const setLocation = useTravelSessionStore((state) => state.setLocation);
  const setLocationStatus = useTravelSessionStore((state) => state.setLocationStatus);
  const setMode = useTravelSessionStore((state) => state.setMode);
  const setPlace = useTravelSessionStore((state) => state.setPlace);
  const startSession = useTravelSessionStore((state) => state.startSession);
  const travelSessionActions = useMemo(
    () => ({
      clearLocation,
      endSession,
      resetSession,
      setLocation,
      setLocationStatus,
      setMode,
      setPlace,
      startSession,
    }),
    [
      clearLocation,
      endSession,
      resetSession,
      setLocation,
      setLocationStatus,
      setMode,
      setPlace,
      startSession,
    ],
  );
  const {
    apiSource,
    failedEndpointIds,
    failAllEndpoints,
    mockDelayMs,
    resetMockRuntime,
    setApiSource,
    setFailAllEndpoints,
    setMockDelayMs,
    toggleFailedEndpoint,
  } = useDevToolsStore();
  const { completeOnboarding, resetOnboarding } = useUserProfileStore();
  const { logs, addLog, removeLog } = useMomentLogStore();
  const { likedTracks, savedTracks, removeLikedTrack, removeSavedTrack, toggleLike, toggleSave } =
    useLibraryStore();
  const { clearTrack, currentTrack, setTrack } = usePlayerStore();
  const { clearEvents, events } = useRecommendationEventStore();

  const navigate = (path: string) => {
    setIsOpen(false);
    router.push(path as never);
  };
  const applyProfilePreset = () => {
    completeOnboarding({
      companionType: '친구',
      locationRecommendationEnabled: true,
      preferredGenres: ['K-POP', '인디', '팝'],
      preferredMoods: ['청량한', '잔잔한'],
      travelStyles: ['산책', '바다 보기'],
    });
    setSelectedTopFilter('전체');
    setSelectedMoodFilter('청량한');
    router.replace('/' as never);
  };
  const resetProfile = () => {
    resetOnboarding();
    setSelectedTopFilter('전체');
    setSelectedMoodFilter('전체');
    setIsOpen(false);
    router.replace('/onboarding' as never);
  };
  const applyPlacePreset = (preset: (typeof placePresets)[number]) => {
    travelSessionActions.setLocation(preset.location);
    travelSessionActions.setPlace(preset.place);
    invalidateMockQueries();
  };
  const setLocationState = (status: 'denied' | 'idle' | 'unavailable') => {
    travelSessionActions.clearLocation();
    travelSessionActions.setLocationStatus(status);
    invalidateMockQueries();
  };
  const addSampleMomentLogs = () => {
    const baseTime = Date.now();
    const sampleLogs: MomentLog[] = [
      {
        createdAt: new Date(baseTime - 1000 * 60 * 24).toISOString(),
        id: `dev-moment-busan-${baseTime}`,
        location: placePresets[0].location,
        moodTags: ['fresh', 'local'],
        photoUri: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
        placeCategory: '해변',
        placeId: placePresets[0].place.id,
        placeName: '광안리 해수욕장',
        sessionId: 'dev-session-busan',
        source: 'camera',
        syncStatus: 'local',
        track: getSampleTrack(0),
        travelMode: 'walk',
      },
      {
        createdAt: new Date(baseTime - 1000 * 60 * 12).toISOString(),
        id: `dev-moment-cafe-${baseTime}`,
        location: placePresets[0].location,
        moodTags: ['calm', 'emotional'],
        photoUri: 'https://tong.visitkorea.or.kr/cms2/website/75/2012175.jpg',
        placeCategory: '카페거리',
        placeId: 'dev-busan-cafe',
        placeName: '민락동 카페거리',
        sessionId: 'dev-session-busan',
        source: 'camera',
        syncStatus: 'local',
        track: getSampleTrack(2),
        travelMode: 'cafe',
      },
      {
        createdAt: new Date(baseTime - 1000 * 60 * 4).toISOString(),
        id: `dev-moment-seoul-${baseTime}`,
        location: placePresets[1].location,
        moodTags: ['emotional'],
        photoUri: 'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
        placeCategory: '야경',
        placeId: placePresets[1].place.id,
        placeName: '남산서울타워',
        sessionId: 'dev-session-seoul',
        source: 'camera',
        syncStatus: 'local',
        track: getSampleTrack(5),
        travelMode: 'night',
      },
    ];

    sampleLogs.forEach(addLog);
  };
  const clearMomentLogs = () => {
    logs.forEach((log) => removeLog(log.id));
  };
  const seedLibrary = () => {
    const libraryState = useLibraryStore.getState();

    sampleTracks.slice(0, 3).forEach((track) => {
      if (!libraryState.isLiked(track.id)) {
        libraryState.toggleLike(track, samplePlaylist.id);
      }
    });
    sampleTracks.slice(1, 4).forEach((track) => {
      if (!libraryState.isSaved(track.id)) {
        libraryState.toggleSave(track, samplePlaylist.id);
      }
    });
  };
  const clearLibrary = () => {
    likedTracks.forEach((record) => removeLikedTrack(record.track.id));
    savedTracks.forEach((record) => removeSavedTrack(record.track.id));
  };
  const resetMockState = () => {
    resetMockRuntime();
    invalidateMockQueries();
  };
  const setSlowMockState = () => {
    setMockDelayMs(SLOW_DELAY_MS);
    setFailAllEndpoints(false);
    invalidateMockQueries();
  };
  const setFailAllMockState = () => {
    setFailAllEndpoints(true);
    invalidateMockQueries();
  };
  const toggleEndpoint = (endpointId: (typeof mockEndpointIds)[number]) => {
    toggleFailedEndpoint(endpointId);
    invalidateMockQueries();
  };
  const selectApiSource = (nextApiSource: typeof apiSource) => {
    setApiSource(nextApiSource);
    invalidateMockQueries();
  };

  return (
    <>
      <Animated.View
        {...panResponder.panHandlers}
        className="absolute left-0 top-0 z-50"
        style={{ transform: pan.getTranslateTransform() }}
      >
        <Pressable
          accessibilityLabel="테스트 매니저 열기"
          accessibilityRole="button"
          className="h-[58px] w-[58px] items-center justify-center rounded-full border border-white/20 bg-[#7A2CFF]"
          onPress={() => setIsOpen(true)}
        >
          <Feather color="#fff" name="tool" size={21} />
          <View className="absolute -right-1 -top-1 h-4 w-4 rounded-full border border-[#050916] bg-emerald-400" />
        </Pressable>
      </Animated.View>

      <Modal animationType="slide" onRequestClose={() => setIsOpen(false)} transparent visible={isOpen}>
        <View className="flex-1 justify-end bg-black/58">
          <Pressable className="flex-1" onPress={() => setIsOpen(false)} />
          <View
            className="max-h-[84%] rounded-t-[28px] border border-white/10 bg-[#0B1020]"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="px-5 pb-3 pt-4">
              <View className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-white/30" />
              <View className="flex-row items-start justify-between gap-3">
                <View className="min-w-0 flex-1">
                  <AppText className="text-[22px] font-semibold text-white">
                    Test Manager
                  </AppText>
                  <AppText className="mt-2 text-xs leading-5 text-white/50">
                    페이지 이동, 조건문, mock 실패/지연, 로컬 데이터를 빠르게 검수해요.
                  </AppText>
                </View>
                <Pressable
                  accessibilityLabel="테스트 매니저 닫기"
                  accessibilityRole="button"
                  className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                  onPress={() => setIsOpen(false)}
                >
                  <Feather color="#fff" name="x" size={18} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={{ gap: 12, paddingBottom: 18, paddingHorizontal: 20 }}
              showsVerticalScrollIndicator={false}
            >
              <ManagerSection
                subtitle={`세션 ${session.status} · 위치 ${locationStatus} · 로그 ${logs.length}개 · 이벤트 ${events.length}개`}
                title="현재 상태"
              >
                <StatusPill label={`상단 ${selectedTopFilter}`} />
                <StatusPill label={`무드 ${selectedMoodFilter}`} />
                <StatusPill label={`모드 ${selectedMode ?? '없음'}`} />
                <StatusPill label={`장소 ${currentPlace?.title ?? '없음'}`} />
                <StatusPill label={`곡 ${currentTrack?.title ?? '없음'}`} />
                <StatusPill label={`API ${apiSource === 'server' ? 'Server' : 'Mock'}`} />
                <StatusPill
                  label={`Mock ${failAllEndpoints ? '전체 실패' : `${mockDelayMs ?? DEFAULT_DELAY_MS}ms`}`}
                />
              </ManagerSection>

              <ManagerSection
                subtitle="Mock은 앱 내부 데이터를, Server는 로컬 SoundLogServer API를 사용합니다."
                title="API Source"
              >
                <ManagerButton
                  active={apiSource === 'mock'}
                  label="Mock"
                  onPress={() => selectApiSource('mock')}
                />
                <ManagerButton
                  active={apiSource === 'server'}
                  label="Server"
                  onPress={() => selectApiSource('server')}
                />
              </ManagerSection>

              <ManagerSection title="페이지 이동">
                <ManagerButton label="홈" onPress={() => navigate('/')} />
                <ManagerButton label="온보딩" onPress={() => navigate('/onboarding')} />
                <ManagerButton
                  label="부산 플레이리스트"
                  onPress={() => navigate('/playlist/busan-ocean')}
                />
                <ManagerButton
                  label="서울 플레이리스트"
                  onPress={() => navigate('/playlist/seoul-night')}
                />
                <ManagerButton label="Recap" onPress={() => navigate('/recap')} />
                <ManagerButton label="Recap 공유" onPress={() => navigate('/recap-share/log-1')} />
                <ManagerButton label="보관함" onPress={() => navigate('/library')} />
                <ManagerButton label="마이" onPress={() => navigate('/my')} />
                <ManagerButton label="카메라" onPress={() => navigate('/camera')} />
              </ManagerSection>

              <ManagerSection subtitle="온보딩 gate와 홈 필터 기본값을 테스트합니다." title="프로필">
                <ManagerButton label="온보딩 완료 seed" onPress={applyProfilePreset} />
                <ManagerButton destructive label="온보딩 초기화" onPress={resetProfile} />
              </ManagerSection>

              <ManagerSection title="추천 필터">
                {topFilterOptions.map((filter) => (
                  <ManagerButton
                    key={filter}
                    active={selectedTopFilter === filter}
                    label={filter}
                    onPress={() => setSelectedTopFilter(filter)}
                  />
                ))}
                {moodFilterOptions.map((filter) => (
                  <ManagerButton
                    key={filter}
                    active={selectedMoodFilter === filter}
                    label={`무드 ${filter}`}
                    onPress={() => setSelectedMoodFilter(filter)}
                  />
                ))}
              </ManagerSection>

              <ManagerSection title="위치와 여행 세션">
                {placePresets.map((preset) => (
                  <ManagerButton
                    key={preset.label}
                    label={preset.label}
                    onPress={() => applyPlacePreset(preset)}
                  />
                ))}
                <ManagerButton
                  active={locationStatus === 'denied'}
                  label="위치 거부"
                  onPress={() => setLocationState('denied')}
                />
                <ManagerButton
                  active={locationStatus === 'unavailable'}
                  label="위치 불가"
                  onPress={() => setLocationState('unavailable')}
                />
                <ManagerButton
                  active={locationStatus === 'idle' && !currentLocation}
                  label="위치 초기화"
                  onPress={() => setLocationState('idle')}
                />
                <ManagerButton
                  active={session.status === 'active'}
                  label="여행 시작"
                  onPress={travelSessionActions.startSession}
                />
                <ManagerButton
                  active={session.status === 'ended'}
                  label="여행 종료"
                  onPress={travelSessionActions.endSession}
                />
                <ManagerButton destructive label="세션 리셋" onPress={travelSessionActions.resetSession} />
                {travelModeOptions.map((mode) => (
                  <ManagerButton
                    key={mode.value}
                    active={selectedMode === mode.value}
                    label={mode.label}
                    onPress={() => travelSessionActions.setMode(mode.value)}
                  />
                ))}
              </ManagerSection>

              <ManagerSection title="데이터 seed / clear">
                <ManagerButton label="샘플 순간 로그 추가" onPress={addSampleMomentLogs} />
                <ManagerButton destructive label="순간 로그 비우기" onPress={clearMomentLogs} />
                <ManagerButton label="보관함 seed" onPress={seedLibrary} />
                <ManagerButton destructive label="보관함 비우기" onPress={clearLibrary} />
                <ManagerButton
                  label="샘플 곡 재생"
                  onPress={() => setTrack(getSampleTrack(0), samplePlaylist.id)}
                />
                <ManagerButton destructive label="플레이어 비우기" onPress={clearTrack} />
                <ManagerButton destructive label="추천 이벤트 비우기" onPress={clearEvents} />
              </ManagerSection>

              <ManagerSection subtitle="상태 변경 후 현재 화면의 React Query를 다시 불러옵니다." title="Mock API">
                <ManagerButton
                  active={!failAllEndpoints && failedEndpointIds.length === 0 && !mockDelayMs}
                  label="정상"
                  onPress={resetMockState}
                />
                <ManagerButton
                  active={mockDelayMs === SLOW_DELAY_MS}
                  label="느림 1.6s"
                  onPress={setSlowMockState}
                />
                <ManagerButton
                  active={failAllEndpoints}
                  destructive
                  label="전체 실패"
                  onPress={setFailAllMockState}
                />
                {mockEndpointIds.map((endpointId) => (
                  <ManagerButton
                    key={endpointId}
                    active={failedEndpointIds.includes(endpointId)}
                    destructive={failedEndpointIds.includes(endpointId)}
                    label={endpointId}
                    onPress={() => toggleEndpoint(endpointId)}
                  />
                ))}
              </ManagerSection>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
