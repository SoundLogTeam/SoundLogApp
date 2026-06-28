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

function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
        <Feather color="rgba(255,255,255,0.78)" name={icon} size={16} />
      </View>
      <View className="min-w-0 flex-1">
        <AppText className="text-[11px] font-semibold text-white/42">{label}</AppText>
        <AppText className="mt-1 text-sm font-medium text-white/82" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function RecapMusicSummary({ recap }: { recap: RecapShare }) {
  const moments = getMoments(recap);
  const placeCount = createUniqueCount(moments.map((moment) => moment.placeName));
  const trackCount = createUniqueCount(moments.map(createTrackKey));
  const placeFlow = createPlaceFlow(moments, recap.placeName);
  const recordedRange = createRecordedRange(moments, recap.recordedAt);

  return (
    <View className="mt-6 w-full rounded-[20px] border border-white/10 bg-white/[0.06] p-5">
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold tracking-[1.8px] text-white/45">
            MUSIC RECAP
          </AppText>
          <AppText className="mt-2 text-lg font-semibold text-white" numberOfLines={1}>
            {recap.trackTitle}
          </AppText>
          <AppText className="mt-1 text-sm text-white/58" numberOfLines={1}>
            {recap.artistName}
          </AppText>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name="music" size={19} />
        </View>
      </View>

      <View className="mt-5 gap-4">
        <SummaryRow icon="camera" label="저장된 순간" value={`${moments.length}개 Moment`} />
        <SummaryRow icon="map-pin" label="장소 흐름" value={`${placeCount || 1}곳 · ${placeFlow}`} />
        <SummaryRow icon="disc" label="수록곡" value={`${trackCount || 1}곡`} />
        <SummaryRow icon="clock" label="기록 시간" value={recordedRange} />
      </View>
    </View>
  );
}
