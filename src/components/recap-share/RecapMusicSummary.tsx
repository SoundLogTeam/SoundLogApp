import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RecapShare, RecapShareMoment } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type SummaryRowProps = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
};

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
  const trackCount = createUniqueCount(moments.map(createTrackKey));
  const locationFlow = createLocationFlow(moments, recap.placeName);
  const placeFlow = createPlaceFlow(moments, recap.placeName);
  const recordedRange = createRecordedRange(moments, recap.recordedAt);
  const hasLocations = locationMoments.length > 0;

  return (
    <View className="w-full rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold text-white/45">
            대표 정보
          </AppText>
          <AppText className="mt-2 text-lg font-semibold text-white" numberOfLines={1}>
            {recap.placeName} · {recap.trackTitle}
          </AppText>
          <AppText className="mt-1 text-sm text-white/58" numberOfLines={1}>
            사진 {photoCount}장 · 곡 {trackCount || 1}개 · {recap.artistName}
          </AppText>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name="music" size={19} />
        </View>
      </View>

      <AppText className="mt-3 text-xs leading-5 text-white/45" numberOfLines={2}>
        리캡 {moments.length}개 · {placeCount || 1}곳 · {placeFlow} · {recordedRange}
      </AppText>

      <View className="mt-4 flex-row items-center gap-3 rounded-[16px] border border-white/10 bg-black/20 px-4 py-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <Feather color={hasLocations ? '#B7E628' : 'rgba(255,255,255,0.5)'} name="map-pin" size={16} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold text-white/45">
            촬영 위치
          </AppText>
          <AppText className="mt-1 text-sm font-semibold text-white" numberOfLines={1}>
            {hasLocations
              ? `${locationMoments.length}개 위치 · ${locationFlow}`
              : '위치가 저장된 리캡이 없어요'}
          </AppText>
        </View>
        {hasLocations && onOpenMap ? (
          <Pressable
            accessibilityLabel="지도 리캡 보기"
            accessibilityRole="button"
            className="rounded-full bg-soundlog-lime px-3 py-2"
            onPress={onOpenMap}
          >
            <AppText className="text-[11px] font-semibold text-soundlog-inverse">
              지도
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
