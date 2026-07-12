import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { FeaturedPlaylist, PlaceContext } from '@/types/domain';

type CurrentSoundtrackCardProps = {
  cachedAt?: string;
  currentPlace?: PlaceContext;
  isCached?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  isOpeningPlaylist?: boolean;
  moodLabel: string;
  needsLocation?: boolean;
  onCaptureMoment: () => void;
  onOpenPlaylist: (playlist: FeaturedPlaylist) => void;
  onRetry?: () => void;
  playlist?: FeaturedPlaylist;
  placeLabel: string;
  recommendationSource?: string;
};

function getRecommendationSourceBadge(source?: string) {
  if (source === 'ml-recommendation') {
    return {
      className: 'bg-[#B7E628]/15',
      label: 'ML 추천',
      textClassName: 'text-[#B7E628]',
    };
  }

  if (source === 'seed-fallback') {
    return {
      className: 'bg-amber-300/15',
      label: '기본 추천',
      textClassName: 'text-amber-100',
    };
  }

  return undefined;
}

export function CurrentSoundtrackCard({
  cachedAt,
  currentPlace,
  isCached = false,
  isError = false,
  isLoading = false,
  isOpeningPlaylist = false,
  moodLabel,
  needsLocation = false,
  onCaptureMoment,
  onOpenPlaylist,
  onRetry,
  playlist,
  placeLabel,
  recommendationSource,
}: CurrentSoundtrackCardProps) {
  const placeTitle = currentPlace?.title ?? '지금 위치 주변';
  const placeCaption = currentPlace?.address ?? currentPlace?.category ?? '장소를 확인하며 추천을 준비 중';
  const playlistTitle = playlist?.regionName ?? `${placeLabel} 사운드트랙`;
  const playlistDescription =
    playlist?.description ??
    (needsLocation
      ? '위치를 확인하면 지금 상황에 맞춘 곡 목록을 준비할게요.'
      : '현재 장소 맥락으로 오늘 들을 곡 목록을 준비하고 있어요.');
  const trackMeta = playlist
    ? `${playlist.trackCount}곡 · ${playlist.durationText}`
    : isLoading
      ? '추천 준비 중'
      : needsLocation
        ? '위치 확인 필요'
        : '추천을 다시 시도해보세요';
  const cacheCaption = cachedAt
    ? `최근 추천 · ${new Date(cachedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`
    : '최근 추천';
  const isPlaylistButtonDisabled = isLoading || isOpeningPlaylist;
  const sourceBadge = getRecommendationSourceBadge(recommendationSource);

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
                  장소
                </AppText>
                <AppText
                  className="max-w-[160px] text-[11px] font-semibold text-[#050916]"
                  numberOfLines={1}
                >
                  {placeLabel}
                </AppText>
              </View>
              <View className="flex-row items-center gap-2 rounded-full bg-white/10 px-3 py-1.5">
                <AppText className="text-[10px] font-semibold text-white/40">무드</AppText>
                <AppText className="text-[11px] font-semibold text-white/80">{moodLabel}</AppText>
              </View>
              {isCached ? (
                <View className="flex-row items-center gap-2 rounded-full bg-amber-300/15 px-3 py-1.5">
                  <AppText className="text-[10px] font-semibold text-amber-100">
                    {cacheCaption}
                  </AppText>
                </View>
              ) : null}
              {sourceBadge ? (
                <View className={`rounded-full px-3 py-1.5 ${sourceBadge.className}`}>
                  <AppText className={`text-[10px] font-semibold ${sourceBadge.textClassName}`}>
                    {sourceBadge.label}
                  </AppText>
                </View>
              ) : null}
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
                isPlaylistButtonDisabled ? 'bg-white/10' : 'bg-[#B7E628]'
              }`}
              disabled={isPlaylistButtonDisabled}
              onPress={handleOpenPlaylist}
            >
              <Feather
                color={isPlaylistButtonDisabled ? 'rgba(255,255,255,0.42)' : '#050916'}
                name="music"
                size={16}
              />
              <AppText
                className={`text-xs font-semibold ${
                  isPlaylistButtonDisabled ? 'text-white/40' : 'text-[#050916]'
                }`}
              >
                {isOpeningPlaylist ? '여는 중' : needsLocation && !playlist ? '위치로 추천' : '곡 보기'}
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
