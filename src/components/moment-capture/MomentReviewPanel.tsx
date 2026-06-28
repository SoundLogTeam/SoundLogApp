import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';

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
  includeMusic: boolean;
  isSaving: boolean;
  location?: GeoPoint;
  moodTags: MoodTag[];
  onChangeMoodTags: (moodTags: MoodTag[]) => void;
  onChangePlaceName: (placeName: string) => void;
  onRetake: () => void;
  onSave: () => void;
  onToggleMusic: () => void;
  photoUri: string;
  placeName: string;
  track?: Track;
  travelMode?: TravelMode;
};

const editableMoodTags = Object.entries(moodLabels) as Array<[MoodTag, string]>;

export function MomentReviewPanel({
  errorMessage,
  includeMusic,
  isSaving,
  location,
  moodTags,
  onChangeMoodTags,
  onChangePlaceName,
  onRetake,
  onSave,
  onToggleMusic,
  photoUri,
  placeName,
  track,
  travelMode,
}: MomentReviewPanelProps) {
  const moodLabel = moodTags.map((tag) => moodLabels[tag]).join(', ') || '무드 없음';
  const canToggleMusic = Boolean(track);
  const toggleMoodTag = (tag: MoodTag) => {
    if (moodTags.includes(tag)) {
      onChangeMoodTags(moodTags.filter((item) => item !== tag));
      return;
    }

    onChangeMoodTags([...moodTags, tag]);
  };

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

        <View className="mt-5 gap-4 rounded-[22px] border border-white/10 bg-white/10 p-4">
          <View>
            <View className="mb-2 flex-row items-center gap-2">
              <Feather color="rgba(255,255,255,0.6)" name="map-pin" size={14} />
              <AppText className="text-[11px] text-white/45">장소</AppText>
            </View>
            <TextInput
              className="h-12 rounded-[15px] border border-white/10 bg-black/20 px-4 text-sm font-semibold text-white"
              editable={!isSaving}
              onChangeText={onChangePlaceName}
              placeholder={formatPlaceLabel(location)}
              placeholderTextColor="rgba(255,255,255,0.32)"
              value={placeName}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-[15px] border border-white/10 bg-black/20 px-3 py-3"
            disabled={!canToggleMusic || isSaving}
            onPress={onToggleMusic}
            style={{ opacity: canToggleMusic ? 1 : 0.65 }}
          >
            <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <Feather color="#fff" name={includeMusic ? 'music' : 'x'} size={16} />
            </View>
            <View className="min-w-0 flex-1">
              <AppText className="text-[11px] text-white/45">음악</AppText>
              <AppText className="mt-0.5 text-sm font-semibold text-white" numberOfLines={1}>
                {includeMusic && track ? `${track.title} - ${track.artist}` : '음악 없음'}
              </AppText>
            </View>
            {canToggleMusic ? (
              <View
                className="h-6 w-11 justify-center rounded-full px-1"
                style={{ backgroundColor: includeMusic ? '#B7E628' : 'rgba(255,255,255,0.16)' }}
              >
                <View
                  className="h-4 w-4 rounded-full bg-white"
                  style={{ alignSelf: includeMusic ? 'flex-end' : 'flex-start' }}
                />
              </View>
            ) : null}
          </Pressable>

          <InfoRow
            icon="navigation"
            label="여행 모드"
            value={travelMode ? (travelModeLabels[travelMode] ?? '미설정') : '미설정'}
          />
          <View>
            <View className="mb-2 flex-row items-center gap-2">
              <Feather color="rgba(255,255,255,0.6)" name="sliders" size={14} />
              <AppText className="text-[11px] text-white/45">무드</AppText>
              <AppText className="text-[11px] font-semibold text-white/55">{moodLabel}</AppText>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {editableMoodTags.map(([tag, label]) => {
                const selected = moodTags.includes(tag);

                return (
                  <Pressable
                    key={tag}
                    accessibilityRole="button"
                    className="rounded-full border px-3 py-2"
                    disabled={isSaving}
                    onPress={() => toggleMoodTag(tag)}
                    style={{
                      backgroundColor: selected ? '#B7E628' : 'rgba(255,255,255,0.08)',
                      borderColor: selected ? '#B7E628' : 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <AppText
                      className="text-xs font-semibold"
                      style={{ color: selected ? '#090515' : 'rgba(255,255,255,0.72)' }}
                    >
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
          </View>
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
