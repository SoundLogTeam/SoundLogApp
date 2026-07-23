import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PlaylistMusicFilter } from '@/components/playlist/PlaylistMusicFilter';
import { PlaylistCuration } from '@/types/domain';

type PlaylistHeroInfoProps = {
  disabled?: boolean;
  onAdjustMood: (filter: string) => void;
  onOpenFirstTrack: () => void;
  playlist: PlaylistCuration;
  selectedMoodFilter: string;
};

function getRecommendationSourceCopy(source?: string) {
  if (source === 'ml-recommendation') {
    return {
      badgeClassName: 'border-[#B7E628]/20 bg-[#B7E628]/15',
      description: '현재 위치, 여행 상태, 무드를 기준으로 추천했어요.',
      label: 'ML 추천',
      textClassName: 'text-[#B7E628]',
    };
  }

  if (source === 'seed-fallback') {
    return {
      badgeClassName: 'border-amber-300/20 bg-amber-300/15',
      description: '추천 서버 응답이 없어서 기본 사운드트랙을 보여줘요.',
      label: '기본 추천',
      textClassName: 'text-amber-100',
    };
  }

  if (source === 'server-contextual') {
    return {
      badgeClassName: 'border-white/15 bg-white/10',
      description: '현재 선택한 장소와 무드를 서버에서 정리한 추천이에요.',
      label: '맞춤 추천',
      textClassName: 'text-white/80',
    };
  }

  return undefined;
}

export function PlaylistHeroInfo({
  disabled = false,
  onAdjustMood,
  onOpenFirstTrack,
  playlist,
  selectedMoodFilter,
}: PlaylistHeroInfoProps) {
  const sourceCopy = getRecommendationSourceCopy(playlist.context?.source);

  return (
    <View className="px-5 pb-5">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <AppText className="text-[30px] font-semibold leading-9 text-white" numberOfLines={1}>
            {playlist.regionName}
          </AppText>
          {playlist.placeName ? (
            <AppText className="mt-1 text-sm font-medium text-white/65" numberOfLines={1}>
              {playlist.placeName}
            </AppText>
          ) : null}
          <AppText className="mt-2 text-[17px] leading-6 text-white/85" numberOfLines={2}>
            {playlist.reason}
          </AppText>
          <View className="mt-4 flex-row flex-wrap gap-2">
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <AppText className="text-xs font-medium text-white/85">{playlist.trackCount}곡</AppText>
            </View>
            <View className="rounded-full border border-white/15 bg-white/10 px-3 py-1">
              <AppText className="text-xs font-medium text-white/85">{playlist.durationText}</AppText>
            </View>
            {sourceCopy ? (
              <View className={`rounded-full border px-3 py-1 ${sourceCopy.badgeClassName}`}>
                <AppText className={`text-xs font-semibold ${sourceCopy.textClassName}`}>
                  {sourceCopy.label}
                </AppText>
              </View>
            ) : null}
          </View>
          {sourceCopy?.description ? (
            <AppText className="mt-2 text-xs leading-5 text-white/55">
              {sourceCopy.description}
            </AppText>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="플레이리스트 대표곡 SoundLog 음악으로 선택"
          accessibilityRole="button"
          className="h-[52px] w-[52px] items-center justify-center rounded-full bg-soundlog-lime"
          disabled={disabled}
          onPress={onOpenFirstTrack}
          style={{ opacity: disabled ? 0.45 : 1 }}
        >
          <Feather color="#050916" name="music" size={22} />
        </Pressable>
      </View>

      <View className="mt-5">
        <PlaylistMusicFilter
          onSelectMoodFilter={onAdjustMood}
          selectedMoodFilter={selectedMoodFilter}
        />
      </View>
    </View>
  );
}
