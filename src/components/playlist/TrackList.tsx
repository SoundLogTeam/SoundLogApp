import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { TrackRow } from '@/components/playlist/TrackRow';
import { Track } from '@/types/domain';

type TrackListProps = {
  bottomPadding: number;
  currentTrackId?: string;
  likedTrackIds: Set<string>;
  onOpenMenu: (track: Track) => void;
  onSelectTrack: (track: Track) => void;
  savedTrackIds: Set<string>;
  tracks: Track[];
};

export function TrackList({
  bottomPadding,
  currentTrackId,
  likedTrackIds,
  onOpenMenu,
  onSelectTrack,
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
      {tracks.map((item) => (
        <TrackRow
          key={item.id}
          isActive={currentTrackId === item.id}
          isLiked={likedTrackIds.has(item.id)}
          isSaved={savedTrackIds.has(item.id)}
          onMore={onOpenMenu}
          onPress={onSelectTrack}
          track={item}
        />
      ))}
    </View>
  );
}
