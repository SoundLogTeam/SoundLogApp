import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

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

export function RecapMusicSummary({ recap }: { recap: RecapShare }) {
  const moments = getMoments(recap);
  const photoCount = createPhotoCount(moments);
  const placeCount = createUniqueCount(moments.map((moment) => moment.placeName));
  const trackCount = createUniqueCount(moments.map(createTrackKey));
  const placeFlow = createPlaceFlow(moments, recap.placeName);
  const recordedRange = createRecordedRange(moments, recap.recordedAt);

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
        {moments.length}개 Moment · {placeCount || 1}곳 · {placeFlow} · {recordedRange}
      </AppText>
    </View>
  );
}
