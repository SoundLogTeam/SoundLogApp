import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TrackActionMenu } from '@/components/playlist/TrackActionMenu';
import { getMiniPlayerBottom } from '@/constants/layout';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';
import { getTrackKeyColor, hexToRgba } from '@/utils/trackVisuals';

const webGlassPlayerStyle = {
  backdropFilter: 'blur(24px) saturate(155%)',
  WebkitBackdropFilter: 'blur(24px) saturate(155%)',
};

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    playNext,
    playPrevious,
    playlistId,
    queue,
    toggle,
  } = usePlayerStore();
  const { isLiked, isSaved, toggleLike, toggleSave } = useLibraryStore();
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);
  const [isActionMenuVisible, setIsActionMenuVisible] = useState(false);
  const [isFullPlayerVisible, setIsFullPlayerVisible] = useState(false);

  if (!currentTrack) {
    return null;
  }

  const liked = isLiked(currentTrack.id);
  const saved = isSaved(currentTrack.id);
  const keyColor = getTrackKeyColor(currentTrack);
  const playerGlow = hexToRgba(keyColor, 0.72);
  const playerSoftGlow = hexToRgba(keyColor, 0.24);
  const canSkip = queue.length > 1;
  const handleToggleLike = () => {
    toggleLike(currentTrack, playlistId);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId,
      trackId: currentTrack.id,
      type: liked ? 'track_unlike' : 'track_like',
    });
  };
  const handleTogglePlayback = () => {
    toggle();
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId,
      trackId: currentTrack.id,
      type: isPlaying ? 'track_pause' : 'track_resume',
    });
  };
  const handleToggleSave = () => {
    toggleSave(currentTrack, playlistId);
    addRecommendationEvent({
      context: createRecommendationEventContext(),
      playlistId,
      trackId: currentTrack.id,
      type: saved ? 'track_unsave' : 'track_save',
    });
  };
  const handlePlayNext = () => {
    if (!canSkip) {
      return;
    }

    playNext();
  };
  const handlePlayPrevious = () => {
    if (!canSkip) {
      return;
    }

    playPrevious();
  };
  const renderCover = (sizeClassName: string, radiusClassName: string) => (
    <View
      className={`overflow-hidden border ${radiusClassName} ${sizeClassName}`}
      style={{
        backgroundColor: hexToRgba(keyColor, 0.24),
        borderColor: 'rgba(255,255,255,0.24)',
      }}
    >
      {currentTrack.albumImageUrl ? (
        <Image contentFit="cover" source={{ uri: currentTrack.albumImageUrl }} style={{ flex: 1 }} />
      ) : (
        <View className="flex-1" style={{ backgroundColor: hexToRgba(keyColor, 0.32) }} />
      )}
    </View>
  );
  const renderLpCover = () => (
    <View
      className="h-[308px] w-[308px] items-center justify-center rounded-full border"
      style={{
        backgroundColor: 'rgba(0,0,0,0.88)',
        borderColor: hexToRgba(keyColor, 0.72),
      }}
    >
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.2)',
          'rgba(255,255,255,0.02)',
          hexToRgba(keyColor, 0.26),
          'rgba(0,0,0,0.76)',
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={{
          borderRadius: 154,
          bottom: 0,
          left: 0,
          pointerEvents: 'none',
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
      <View className="absolute h-[246px] w-[246px] rounded-full border border-white/10" />
      <View className="absolute h-[202px] w-[202px] rounded-full border border-white/8" />
      <View className="absolute h-[158px] w-[158px] rounded-full border border-white/8" />
      <View
        className="h-[118px] w-[118px] overflow-hidden rounded-full border"
        style={{
          backgroundColor: hexToRgba(keyColor, 0.24),
          borderColor: 'rgba(255,255,255,0.22)',
        }}
      >
        {currentTrack.albumImageUrl ? (
          <Image contentFit="cover" source={{ uri: currentTrack.albumImageUrl }} style={{ flex: 1 }} />
        ) : (
          <View className="flex-1" style={{ backgroundColor: hexToRgba(keyColor, 0.32) }} />
        )}
      </View>
      <View className="absolute h-[18px] w-[18px] rounded-full border border-white/25 bg-black/80" />
      <View
        className="absolute right-7 top-10 h-16 w-16 rounded-full opacity-30"
        style={{ backgroundColor: hexToRgba(keyColor, 0.62) }}
      />
    </View>
  );

  return (
    <>
      <View
        className="absolute left-5 right-5 h-[96px] overflow-hidden rounded-[28px] border border-white/30"
        style={{
          backgroundColor: 'rgba(255,255,255,0.16)',
          bottom: getMiniPlayerBottom(insets.bottom),
          boxShadow: '0 18px 46px rgba(0,0,0,0.36)',
          shadowColor: '#000',
          shadowOffset: { height: 18, width: 0 },
          shadowOpacity: 0.34,
          shadowRadius: 26,
          ...(Platform.OS === 'web' ? webGlassPlayerStyle : {}),
        }}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.14)', playerSoftGlow]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={{
            bottom: 0,
            left: 0,
            pointerEvents: 'none',
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        />

        <View className="flex-1 flex-row items-center px-4">
          <Pressable
            accessibilityLabel="전체 플레이어 열기"
            accessibilityRole="button"
            onPress={() => setIsFullPlayerVisible(true)}
          >
            {renderCover('h-[68px] w-[68px]', 'rounded-[22px]')}
          </Pressable>

          <View className="ml-4 min-w-0 flex-1">
            <AppText className="text-base font-semibold text-white" numberOfLines={1}>
              {currentTrack.title}
            </AppText>
            <AppText className="mt-1 text-xs font-medium text-white/60" numberOfLines={1}>
              {currentTrack.artist}
            </AppText>
            <View className="mt-3 h-[3px] overflow-hidden rounded-full bg-white/10">
              <View
                className="h-full rounded-full"
                style={{ backgroundColor: playerGlow, width: isPlaying ? '46%' : '24%' }}
              />
            </View>
          </View>

          <View className="ml-3 flex-row items-center gap-1">
            <Pressable
              accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center"
              onPress={handleToggleLike}
            >
              <Feather color={liked ? '#F5D0FE' : '#fff'} name="heart" size={18} />
            </Pressable>
            <Pressable
              accessibilityLabel={isPlaying ? '일시정지' : '재생'}
              accessibilityRole="button"
              className="h-12 w-12 items-center justify-center rounded-full border border-white/20"
              onPress={handleTogglePlayback}
              style={{ backgroundColor: playerGlow }}
            >
              <Feather color="#fff" name={isPlaying ? 'pause' : 'play'} size={20} />
            </Pressable>
            <Pressable
              accessibilityLabel="현재 곡 옵션 열기"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center"
              onPress={() => setIsActionMenuVisible(true)}
            >
              <Feather color="#fff" name="more-horizontal" size={18} />
            </Pressable>
          </View>
        </View>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setIsFullPlayerVisible(false)}
        transparent
        visible={isFullPlayerVisible}
      >
        <View className="flex-1 bg-black">
          <LinearGradient
            colors={[
              hexToRgba(keyColor, 0.48),
              'rgba(9,14,35,0.92)',
              'rgba(0,0,0,1)',
            ]}
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={{
              bottom: 0,
              left: 0,
              pointerEvents: 'none',
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />

          <View className="flex-1 px-7 pb-8 pt-14">
            <View className="flex-row items-center justify-between">
              <Pressable
                accessibilityLabel="전체 플레이어 닫기"
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
                onPress={() => setIsFullPlayerVisible(false)}
              >
                <Feather color="#fff" name="chevron-down" size={24} />
              </Pressable>
              <View className="min-w-0 flex-1 px-4">
                <AppText className="text-center text-sm font-semibold text-white" numberOfLines={1}>
                  {currentTrack.title}
                </AppText>
                <AppText className="mt-1 text-center text-xs text-white/55" numberOfLines={1}>
                  {currentTrack.artist}
                </AppText>
              </View>
              <Pressable
                accessibilityLabel="현재 곡 옵션 열기"
                accessibilityRole="button"
                className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
                onPress={() => setIsActionMenuVisible(true)}
              >
                <Feather color="#fff" name="more-horizontal" size={22} />
              </Pressable>
            </View>

            <View className="mt-10 items-center">
              <View
                className="rounded-full p-3"
                style={{ backgroundColor: hexToRgba(keyColor, 0.18) }}
              >
                {renderLpCover()}
              </View>
            </View>

            <View className="mt-8">
              <AppText className="text-center text-[28px] font-semibold text-white" numberOfLines={2}>
                {currentTrack.title}
              </AppText>
              <AppText className="mt-2 text-center text-base text-white/60" numberOfLines={1}>
                {currentTrack.artist}
              </AppText>
            </View>

            <View className="mt-8">
              <View className="h-[4px] overflow-hidden rounded-full bg-white/12">
                <View
                  className="h-full rounded-full"
                  style={{ backgroundColor: playerGlow, width: isPlaying ? '46%' : '24%' }}
                />
              </View>
              <View className="mt-3 flex-row justify-between">
                <AppText className="text-xs text-white/45">{isPlaying ? '0:48' : '0:00'}</AppText>
                <AppText className="text-xs text-white/45">2:58</AppText>
              </View>
            </View>

            <View className="mt-auto flex-row items-center justify-center gap-5">
              <Pressable
                accessibilityLabel="이전 곡"
                accessibilityRole="button"
                className="h-14 w-14 items-center justify-center rounded-full bg-white/10"
                disabled={!canSkip}
                onPress={handlePlayPrevious}
                style={{ opacity: canSkip ? 1 : 0.35 }}
              >
                <Feather color="#fff" name="skip-back" size={24} />
              </Pressable>

              <Pressable
                accessibilityLabel={isPlaying ? '일시정지' : '재생'}
                accessibilityRole="button"
                className="h-[86px] w-[86px] items-center justify-center rounded-full border border-white/20"
                onPress={handleTogglePlayback}
                style={{ backgroundColor: playerGlow }}
              >
                <Feather color="#fff" name={isPlaying ? 'pause' : 'play'} size={34} />
              </Pressable>

              <Pressable
                accessibilityLabel="다음 곡"
                accessibilityRole="button"
                className="h-14 w-14 items-center justify-center rounded-full bg-white/10"
                disabled={!canSkip}
                onPress={handlePlayNext}
                style={{ opacity: canSkip ? 1 : 0.35 }}
              >
                <Feather color="#fff" name="skip-forward" size={24} />
              </Pressable>
            </View>

            <View className="mt-7 flex-row justify-center gap-8">
              <Pressable
                accessibilityLabel={liked ? '좋아요 취소' : '좋아요'}
                accessibilityRole="button"
                className="h-12 w-12 items-center justify-center rounded-full bg-white/10"
                onPress={handleToggleLike}
              >
                <Feather color={liked ? '#F5D0FE' : '#fff'} name="heart" size={21} />
              </Pressable>
              <Pressable
                accessibilityLabel={saved ? '저장 취소' : '저장하기'}
                accessibilityRole="button"
                className="h-12 w-12 items-center justify-center rounded-full bg-white/10"
                onPress={handleToggleSave}
              >
                <Feather color={saved ? '#DDD6FE' : '#fff'} name="bookmark" size={21} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <TrackActionMenu
        isLiked={liked}
        isSaved={saved}
        onClose={() => setIsActionMenuVisible(false)}
        onToggleLike={handleToggleLike}
        onToggleSave={handleToggleSave}
        track={currentTrack}
        visible={isActionMenuVisible}
      />
    </>
  );
}
