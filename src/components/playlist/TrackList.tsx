import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TrackRow } from '@/components/playlist/TrackRow';
import { Track } from '@/types/domain';

type TrackListProps = {
  bottomPadding: number;
  currentTrackId?: string;
  likedTrackIds: Set<string>;
  onSelectTrack: (track: Track) => void;
  onToggleLike: (track: Track) => void;
  onToggleSave: (track: Track) => void;
  savedTrackIds: Set<string>;
  tracks: Track[];
};

export function TrackList({
  bottomPadding,
  currentTrackId,
  likedTrackIds,
  onSelectTrack,
  onToggleLike,
  onToggleSave,
  savedTrackIds,
  tracks,
}: TrackListProps) {
  if (tracks.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-8" style={{ paddingBottom: bottomPadding }}>
        <AppText className="text-center text-[22px] font-semibold text-white">
          아직 추천 곡을 준비 중이에요
        </AppText>
        <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
          곧 이 장소와 어울리는 음악을 보여드릴게요.
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ paddingBottom: bottomPadding }}>
      <View className="mx-5 mb-3">
        <AppText className="text-lg font-semibold text-white">추천 곡</AppText>
        <AppText className="mt-1 text-xs leading-5 text-white/50">
          좋아요 · 저장 · 선택으로 지금 장소의 사운드트랙을 골라보세요.
        </AppText>
      </View>
      {tracks.map((item) => (
        <TrackRow
          key={item.id}
          isActive={currentTrackId === item.id}
          isLiked={likedTrackIds.has(item.id)}
          isSaved={savedTrackIds.has(item.id)}
          onPress={onSelectTrack}
          onToggleLike={onToggleLike}
          onToggleSave={onToggleSave}
          track={item}
        />
      ))}
    </View>
  );
}
