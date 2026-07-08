import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FeaturedPlaylist, PlaceContext } from '@/types/domain';

type CurrentSoundtrackCardProps = {
  currentPlace?: PlaceContext;
  isError?: boolean;
  isLoading?: boolean;
  moodLabel: string;
  onCaptureMoment: () => void;
  onOpenPlaylist: (playlist: FeaturedPlaylist) => void;
  onRetry?: () => void;
  playlist?: FeaturedPlaylist;
  travelLabel: string;
};

export function CurrentSoundtrackCard({
  currentPlace,
  isError = false,
  isLoading = false,
  moodLabel,
  onCaptureMoment,
  onOpenPlaylist,
  onRetry,
  playlist,
  travelLabel,
}: CurrentSoundtrackCardProps) {
  const placeTitle = currentPlace?.title ?? '지금 위치 주변';
  const placeCaption = currentPlace?.address ?? currentPlace?.category ?? '장소를 확인하며 추천을 준비 중';
  const playlistTitle = playlist?.regionName ?? `${travelLabel} 사운드트랙`;
  const playlistDescription =
    playlist?.description ??
    '현재 장소와 무드를 기준으로 오늘 들을 곡 목록을 준비하고 있어요.';
  const trackMeta = playlist
    ? `${playlist.trackCount}곡 · ${playlist.durationText}`
    : isLoading
      ? '추천 준비 중'
      : '샘플 추천 사용 가능';

  const handleOpenPlaylist = () => {
    if (playlist) {
      onOpenPlaylist(playlist);
      return;
    }

    onRetry?.();
  };

  return (
    <View className="overflow-hidden rounded-[28px] border border-white/10 bg-[#101722]">
      <View className="p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <View className="flex-row flex-wrap gap-2">
              <View className="flex-row items-center gap-2 rounded-full bg-[#B7E628] px-3 py-1.5">
                <AppText
                  className="text-[10px] font-semibold"
                  style={{ color: 'rgba(5,9,22,0.62)' }}
                >
                  상태
                </AppText>
                <AppText className="text-[11px] font-semibold text-[#050916]">{travelLabel}</AppText>
              </View>
              <View className="flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <AppText className="text-[10px] font-semibold text-white/40">무드</AppText>
                <AppText className="text-[11px] font-semibold text-white/80">{moodLabel}</AppText>
              </View>
            </View>
            <AppText className="mt-4 text-[26px] font-semibold leading-8 text-white">
              오늘의 사운드트랙
            </AppText>
            <AppText className="mt-2 text-sm leading-6 text-white/60">
              {placeTitle}
            </AppText>
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Feather color="#B7E628" name="map-pin" size={22} />
          </View>
        </View>

        <View className="mt-5 rounded-[22px] border border-white/10 bg-black/20 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-[18px] bg-white">
              <View className="h-11 w-11 rounded-full border-[10px] border-[#050916] bg-[#B7E628]" />
            </View>
            <View className="min-w-0 flex-1">
              <AppText className="text-base font-semibold text-white" numberOfLines={1}>
                {playlistTitle}
              </AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/55" numberOfLines={2}>
                {playlistDescription}
              </AppText>
            </View>
          </View>

          <View className="mt-4 flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-xs font-semibold text-[#B7E628]">
                {trackMeta}
              </AppText>
              <AppText className="mt-1 text-[11px] text-white/40" numberOfLines={1}>
                {isError ? '추천을 다시 시도할 수 있어요' : placeCaption}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              className={`h-11 flex-row items-center justify-center gap-2 rounded-full px-4 ${
                isLoading ? 'bg-white/10' : 'bg-[#B7E628]'
              }`}
              disabled={isLoading}
              onPress={handleOpenPlaylist}
            >
              <Feather color={isLoading ? 'rgba(255,255,255,0.42)' : '#050916'} name="music" size={16} />
              <AppText
                className={`text-xs font-semibold ${
                  isLoading ? 'text-white/40' : 'text-[#050916]'
                }`}
              >
                곡 보기
              </AppText>
            </Pressable>
          </View>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10"
            onPress={onCaptureMoment}
          >
            <Feather color="#fff" name="camera" size={16} />
            <AppText className="text-sm font-semibold text-white">기록</AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10"
            onPress={onRetry}
          >
            <Feather color="#fff" name="refresh-cw" size={15} />
            <AppText className="text-sm font-semibold text-white">다시 추천</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
