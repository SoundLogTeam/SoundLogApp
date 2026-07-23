import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';
import { RecapShare, RecapShareMoment } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

function createFallbackMoment(recap: RecapShare): RecapShareMoment {
  return {
    artistName: recap.artistName,
    id: recap.id,
    imageUrl: recap.backgroundImageUrl,
    placeName: recap.placeName,
    recordedAt: recap.recordedAt,
    trackTitle: recap.trackTitle,
  };
}

function getMoments(recap: RecapShare) {
  return recap.moments?.length ? recap.moments : [createFallbackMoment(recap)];
}

function createUniqueCount(values: string[]) {
  return new Set(values.map((value) => value.trim()).filter(Boolean)).size;
}

function createTrackKey(moment: RecapShareMoment) {
  return `${moment.trackTitle.trim()}::${moment.artistName.trim()}`;
}

function hasMusic(moment: RecapShareMoment) {
  return (
    moment.artistName.trim() !== '음악 없음' &&
    moment.trackTitle.trim() !== '음악 없음' &&
    moment.trackTitle.trim() !== '저장된 순간'
  );
}

function createPhotoCount(moments: RecapShareMoment[]) {
  return moments.filter((moment) => Boolean(moment.imageUrl)).length;
}

function createLocationMoments(moments: RecapShareMoment[]) {
  return moments.filter((moment) => Boolean(moment.location));
}

function createPlaceFlow(moments: RecapShareMoment[], fallbackPlaceName: string) {
  const firstPlace = moments[0]?.placeName?.trim() || fallbackPlaceName;
  const lastPlace = moments[moments.length - 1]?.placeName?.trim() || fallbackPlaceName;

  return firstPlace === lastPlace ? firstPlace : `${firstPlace} -> ${lastPlace}`;
}

function createRecordedRange(moments: RecapShareMoment[], fallbackRecordedAt: string) {
  const firstRecordedAt = moments[0]?.recordedAt ?? fallbackRecordedAt;
  const lastRecordedAt = moments[moments.length - 1]?.recordedAt ?? fallbackRecordedAt;
  const firstLabel = formatRecapRecordedAt(firstRecordedAt);
  const lastLabel = formatRecapRecordedAt(lastRecordedAt);

  return firstLabel === lastLabel ? firstLabel : `${firstLabel} -> ${lastLabel}`;
}

function createLocationFlow(moments: RecapShareMoment[], fallbackPlaceName: string) {
  const locationMoments = createLocationMoments(moments);

  if (!locationMoments.length) {
    return '촬영 위치 없음';
  }

  const firstPlace = locationMoments[0]?.placeName?.trim() || fallbackPlaceName;
  const lastPlace =
    locationMoments[locationMoments.length - 1]?.placeName?.trim() ||
    fallbackPlaceName;

  return firstPlace === lastPlace
    ? firstPlace
    : `${firstPlace} -> ${lastPlace}`;
}

export function RecapMusicSummary({
  onOpenMap,
  recap,
}: {
  onOpenMap?: () => void;
  recap: RecapShare;
}) {
  const moments = getMoments(recap);
  const photoCount = createPhotoCount(moments);
  const locationMoments = createLocationMoments(moments);
  const placeCount = createUniqueCount(moments.map((moment) => moment.placeName));
  const musicMoments = moments.filter(hasMusic);
  const trackCount = createUniqueCount(musicMoments.map(createTrackKey));
  const locationFlow = createLocationFlow(moments, recap.placeName);
  const placeFlow = createPlaceFlow(moments, recap.placeName);
  const recordedRange = createRecordedRange(moments, recap.recordedAt);
  const hasLocations = locationMoments.length > 0;

  return (
    <View className="w-full">
      <SectionTitle title="대표 정보" />
      <SettingsRow
        description={
          trackCount > 0
            ? `${recap.trackTitle} · ${recap.artistName}`
            : '음악 없이 남긴 기록'
        }
        icon="music"
        label={recap.placeName}
        rightText={`사진 ${photoCount} · 곡 ${trackCount}`}
      />
      <SettingsRow
        description={`${placeFlow} · ${recordedRange}`}
        icon="calendar"
        label={`기록 ${moments.length}개 · ${placeCount || 1}곳`}
      />
      <SettingsRow
        description={
          hasLocations
            ? `${locationMoments.length}개 위치 · ${locationFlow}`
            : '위치가 저장된 리캡이 없어요'
        }
        icon="map-pin"
        label="촬영 위치"
        rightContent={
          hasLocations && onOpenMap ? (
            <Pressable
              accessibilityLabel="지도 리캡 보기"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-soundlog-lime"
              onPress={onOpenMap}
            >
              <Feather color="#050916" name="map" size={17} />
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}
