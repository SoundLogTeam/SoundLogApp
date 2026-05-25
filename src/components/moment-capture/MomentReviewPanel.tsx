import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MomentSaveState } from '@/components/moment-capture/MomentSaveState';
import { Screen } from '@/components/Screen';
import { GeoPoint, MoodTag, Track, TravelMode } from '@/types/domain';
import { formatPlaceLabel } from '@/utils/placeLabel';

const travelModeLabels: Partial<Record<TravelMode, string>> = {
  cafe: '카페 투어',
  drive: '드라이브',
  festival: '축제',
  night: '야경 감상',
  ocean: '바다 보기',
  walk: '산책',
};

const moodLabels: Record<MoodTag, string> = {
  active: '활기찬',
  calm: '잔잔한',
  emotional: '감성적인',
  fresh: '청량한',
  local: '로컬한',
};

type MomentReviewPanelProps = {
  errorMessage?: string;
  isSaving: boolean;
  location?: GeoPoint;
  moodTags: MoodTag[];
  onRetake: () => void;
  onSave: () => void;
  photoUri: string;
  track?: Track;
  travelMode?: TravelMode;
};

export function MomentReviewPanel({
  errorMessage,
  isSaving,
  location,
  moodTags,
  onRetake,
  onSave,
  photoUri,
  track,
  travelMode,
}: MomentReviewPanelProps) {
  const moodLabel = moodTags.map((tag) => moodLabels[tag]).join(', ') || '무드 없음';

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="다시 촬영"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
            disabled={isSaving}
            onPress={onRetake}
          >
            <Feather color="#fff" name="arrow-left" size={21} />
          </Pressable>
          <AppText className="text-lg font-semibold text-white">순간 저장</AppText>
          <View className="h-11 w-11" />
        </View>

        <Image
          className="mt-8 w-full rounded-[24px] bg-white/10"
          contentFit="cover"
          source={{ uri: photoUri }}
          style={{ aspectRatio: 4 / 5 }}
        />

        <View className="mt-5 gap-3 rounded-[22px] border border-white/10 bg-white/10 p-4">
          <InfoRow icon="map-pin" label="장소" value={formatPlaceLabel(location)} />
          <InfoRow
            icon="music"
            label="음악"
            value={track ? `${track.title} - ${track.artist}` : '음악 없음'}
          />
          <InfoRow
            icon="navigation"
            label="여행 모드"
            value={travelMode ? (travelModeLabels[travelMode] ?? '미설정') : '미설정'}
          />
          <InfoRow icon="sliders" label="무드" value={moodLabel} />
        </View>

        <MomentSaveState message={errorMessage} type="error" />

        <View className="mt-6 gap-3">
          <Pressable
            className="h-14 items-center justify-center rounded-full bg-white"
            disabled={isSaving}
            onPress={onSave}
            style={{ opacity: isSaving ? 0.72 : 1 }}
          >
            {isSaving ? (
              <ActivityIndicator color="#050916" />
            ) : (
              <AppText className="font-semibold text-[#050916]">이 순간 저장하기</AppText>
            )}
          </Pressable>
          <Pressable
            className="h-12 items-center justify-center rounded-full border border-white/15"
            disabled={isSaving}
            onPress={onRetake}
          >
            <AppText className="font-semibold text-white/80">다시 찍기</AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
        <Feather color="#fff" name={icon} size={16} />
      </View>
      <View className="min-w-0 flex-1">
        <AppText className="text-[11px] text-white/45">{label}</AppText>
        <AppText className="mt-0.5 text-sm font-semibold text-white" numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}
