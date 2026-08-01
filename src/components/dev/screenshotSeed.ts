import { playlistCurationById } from '@/mocks/playlistMocks';
import type { AuthSession } from '@/types/auth';
import type {
  GeoPoint,
  MomentLog,
  PlaceContext,
  PlaylistCuration,
  RoutePoint,
  Track,
} from '@/types/domain';

import type { LibraryTrackRecord } from '@/store/libraryStore';
import type { UserProfileInput } from '@/store/userProfileStore';

export const SCREENSHOT_SEED_USER_ID = 'dev-screenshot-user';
export const SCREENSHOT_SEED_SESSION_ID = 'dev-screenshot-trip-busan';

const screenshotPlaylist = playlistCurationById['busan-ocean'];

export const SCREENSHOT_SEED_LOCATION: GeoPoint = { lat: 35.1532, lng: 129.1186 };

export const SCREENSHOT_SEED_PLACE: PlaceContext = {
  category: '해변',
  contentType: '관광지',
  id: 'dev-screenshot-gwangalli',
  imageUrl: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
  location: SCREENSHOT_SEED_LOCATION,
  overview: '광안리 바다와 산책의 분위기에 맞춘 App Store 스크린샷용 개발 데이터입니다.',
  source: 'seed',
  title: '광안리 해수욕장',
};

function getTrack(index: number): Track {
  return screenshotPlaylist.tracks[index % screenshotPlaylist.tracks.length];
}

function getTimestamp(now: Date, minutesBefore: number) {
  return new Date(now.getTime() - minutesBefore * 60 * 1000).toISOString();
}

function createLibraryRecord(track: Track, createdAt: string): LibraryTrackRecord {
  return {
    createdAt,
    playlist: screenshotPlaylist,
    playlistId: screenshotPlaylist.id,
    track: { ...track, isLiked: undefined, isSaved: undefined },
  };
}

export type ScreenshotSeed = {
  authSession: AuthSession;
  currentTrack: Track;
  library: {
    likedTracks: LibraryTrackRecord[];
    savedTracks: LibraryTrackRecord[];
    seededPlaylistIds: string[];
  };
  location: GeoPoint;
  momentLogs: MomentLog[];
  place: PlaceContext;
  playlist: PlaylistCuration;
  profile: UserProfileInput;
  selectedMoodFilter: '시원한';
  selectedMode: 'ocean';
  session: {
    endedAt: string;
    id: string;
    ownerUserId: string;
    routePoints: RoutePoint[];
    startedAt: string;
    status: 'ended';
  };
};

export function createScreenshotSeed(now = new Date()): ScreenshotSeed {
  const startedAt = getTimestamp(now, 92);
  const endedAt = getTimestamp(now, 4);
  const routePoints: RoutePoint[] = [
    { lat: 35.1527, lng: 129.1176, recordedAt: startedAt },
    { lat: 35.1529, lng: 129.1180, recordedAt: getTimestamp(now, 67) },
    { lat: 35.1531, lng: 129.1184, recordedAt: getTimestamp(now, 38) },
    { lat: 35.1532, lng: 129.1186, recordedAt: endedAt },
  ];
  const createdAt = getTimestamp(now, 12);

  return {
    authSession: {
      accessToken: 'dev-screenshot-access-token',
      expiresIn: 3600,
      isNewUser: false,
      refreshToken: 'dev-screenshot-refresh-token',
      user: {
        displayName: '광안리 산책자',
        email: 'screenshot@soundlog.test',
        id: SCREENSHOT_SEED_USER_ID,
        provider: 'email',
      },
    },
    currentTrack: getTrack(0),
    library: {
      likedTracks: [createLibraryRecord(getTrack(0), createdAt), createLibraryRecord(getTrack(2), createdAt)],
      savedTracks: [createLibraryRecord(getTrack(1), createdAt), createLibraryRecord(getTrack(3), createdAt)],
      seededPlaylistIds: [screenshotPlaylist.id],
    },
    location: SCREENSHOT_SEED_LOCATION,
    momentLogs: [
      {
        createdAt: getTimestamp(now, 74),
        id: 'dev-screenshot-gwangalli-sunset',
        location: routePoints[0],
        moodTags: ['fresh', 'local'],
        note: '바닷바람이 가장 시원했던 시작점',
        photoUri: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
        placeCategory: '해변',
        placeId: SCREENSHOT_SEED_PLACE.id,
        placeName: '광안리 해수욕장',
        recapVisibility: 'private',
        sessionId: SCREENSHOT_SEED_SESSION_ID,
        source: 'camera',
        syncStatus: 'synced',
        templateId: 'film',
        track: getTrack(0),
        travelMode: 'ocean',
      },
      {
        createdAt: getTimestamp(now, 43),
        id: 'dev-screenshot-gwangalli-walk',
        location: routePoints[1],
        moodTags: ['fresh', 'calm'],
        note: '파도 소리를 들으며 걷는 시간',
        photoUri: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
        placeCategory: '산책로',
        placeId: SCREENSHOT_SEED_PLACE.id,
        placeName: '광안리 해변 산책로',
        recapVisibility: 'private',
        sessionId: SCREENSHOT_SEED_SESSION_ID,
        source: 'camera',
        syncStatus: 'synced',
        templateId: 'album',
        track: getTrack(1),
        travelMode: 'ocean',
      },
      {
        createdAt,
        id: 'dev-screenshot-gwangalli-night',
        location: routePoints[3],
        moodTags: ['fresh', 'emotional'],
        note: '광안대교 불빛과 함께 남긴 오늘의 마지막 곡',
        photoUri: 'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
        placeCategory: '야경',
        placeId: SCREENSHOT_SEED_PLACE.id,
        placeName: '광안리 해수욕장',
        recapVisibility: 'private',
        sessionId: SCREENSHOT_SEED_SESSION_ID,
        source: 'camera',
        syncStatus: 'synced',
        templateId: 'map',
        track: getTrack(2),
        travelMode: 'ocean',
      },
    ],
    place: SCREENSHOT_SEED_PLACE,
    playlist: screenshotPlaylist,
    profile: {
      companionType: '친구',
      locationRecommendationEnabled: true,
      preferredGenres: ['K-POP', '인디', '팝'],
      preferredMoods: ['시원한', '잔잔한'],
      travelStyles: ['산책', '바다 보기'],
    },
    selectedMoodFilter: '시원한',
    selectedMode: 'ocean',
    session: {
      endedAt,
      id: SCREENSHOT_SEED_SESSION_ID,
      ownerUserId: SCREENSHOT_SEED_USER_ID,
      routePoints,
      startedAt,
      status: 'ended',
    },
  };
}
