import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { libraryApi } from '@/api/libraryApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { TrackActionMenu } from '@/components/playlist/TrackActionMenu';
import { getMiniPlayerBottom } from '@/constants/layout';
import { useLibraryStore } from '@/store/libraryStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import {
  getExternalMusicLinks,
  openExternalMusicLink,
  type ExternalMusicLink,
} from '@/utils/externalMusicLinks';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';
import { getTrackKeyColor, hexToRgba } from '@/utils/trackVisuals';

const webGlassPlayerStyle = {
  backdropFilter: 'blur(30px) saturate(170%)',
  WebkitBackdropFilter: 'blur(30px) saturate(170%)',
};

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    currentTrack,
    playNext,
    playPrevious,
    playlist,
    playlistId,
    queue,
  } = usePlayerStore();
  const { isLiked, isSaved, setLikeState, setSaveState } = useLibraryStore();
  const addRecommendationEvent = useRecommendationEventStore((state) => state.addEvent);
  const [actionMessage, setActionMessage] = useState<string>();
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
  const externalLinks = getExternalMusicLinks(currentTrack);
  const handleToggleLike = () => {
    const context = createRecommendationEventContext();

    setActionMessage(undefined);
    setLikeState(currentTrack, !liked, playlistId, playlist);
    void libraryApi
      .updateTrackState(currentTrack.id, {
        action: liked ? 'unlike' : 'like',
        context,
        playlistId,
      })
      .catch(() => {
        setLikeState(currentTrack, liked, playlistId, playlist);
        setActionMessage('서버 저장에 실패해서 좋아요 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId,
        trackId: currentTrack.id,
        type: liked ? 'track_unlike' : 'track_like',
      }),
    );
  };
  const handleToggleSave = () => {
    const context = createRecommendationEventContext();

    setActionMessage(undefined);
    setSaveState(currentTrack, !saved, playlistId, playlist);
    void libraryApi
      .updateTrackState(currentTrack.id, {
        action: saved ? 'unsave' : 'save',
        context,
        playlistId,
      })
      .catch(() => {
        setSaveState(currentTrack, saved, playlistId, playlist);
        setActionMessage('서버 저장에 실패해서 저장 상태를 되돌렸어요.');
      });
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId,
        trackId: currentTrack.id,
        type: saved ? 'track_unsave' : 'track_save',
      }),
    );
  };
  const handleSelectNextTrack = () => {
    if (!canSkip) {
      return;
    }

    playNext();
  };
  const handleSelectPreviousTrack = () => {
    if (!canSkip) {
      return;
    }

    playPrevious();
  };
  const handleCaptureMoment = () => {
    setIsFullPlayerVisible(false);
    router.push('/camera');
  };
  const handleOpenLiveSoundMap = () => {
    setIsFullPlayerVisible(false);
    router.push('/travel');
  };
  const handleOpenExternalLink = async (link: ExternalMusicLink) => {
    const context = createRecommendationEventContext();

    setActionMessage(undefined);
    syncRecommendationEvent(
      addRecommendationEvent({
        context,
        playlistId,
        trackId: currentTrack.id,
        type: 'track_external_open',
        value: link.id,
      }),
    );

    try {
      await openExternalMusicLink(link);
      setActionMessage(`${link.label} 링크를 열었어요. 돌아오면 이 곡을 기록할 수 있어요.`);
    } catch {
      syncRecommendationEvent(
        addRecommendationEvent({
          context,
          playlistId,
          trackId: currentTrack.id,
          type: 'external_music_open_failed',
          value: link.id,
        }),
      );
      setActionMessage('외부 음악 링크를 열지 못했어요. 웹 검색을 다시 시도해보세요.');
    }
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
        className="absolute left-5 right-5 h-[96px] overflow-hidden rounded-[28px]"
        style={{
          backgroundColor: 'rgba(6,10,22,0.62)',
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
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.06)', playerSoftGlow]}
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
            <AppText className="mt-2 text-[11px] font-semibold text-white/40" numberOfLines={1}>
              SoundLog 음악으로 선택됨
            </AppText>
          </View>

          <View className="ml-3 flex-row items-center gap-1">
            <Pressable
              accessibilityLabel="이전 추천 곡 선택"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center"
              disabled={!canSkip}
              onPress={handleSelectPreviousTrack}
              style={{ opacity: canSkip ? 1 : 0.35 }}
            >
              <Feather color="#fff" name="chevron-left" size={22} />
            </Pressable>
            <Pressable
              accessibilityLabel="선택한 음악 상세 보기"
              accessibilityRole="button"
              className="h-12 w-12 items-center justify-center rounded-full border border-white/20"
              onPress={() => setIsFullPlayerVisible(true)}
              style={{ backgroundColor: playerGlow }}
            >
              <Feather color="#fff" name="music" size={19} />
            </Pressable>
            <Pressable
              accessibilityLabel="다음 추천 곡 선택"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center"
              disabled={!canSkip}
              onPress={handleSelectNextTrack}
              style={{ opacity: canSkip ? 1 : 0.35 }}
            >
              <Feather color="#fff" name="chevron-right" size={22} />
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

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: 32,
              paddingHorizontal: 28,
              paddingTop: 56,
            }}
            showsVerticalScrollIndicator={false}
          >
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
              <AppText className="mb-3 text-xs font-semibold uppercase text-white/40">
                선택한 곡
              </AppText>
              <AppText className="text-center text-[28px] font-semibold text-white" numberOfLines={2}>
                {currentTrack.title}
              </AppText>
              <AppText className="mt-2 text-center text-base text-white/60" numberOfLines={1}>
                {currentTrack.artist}
              </AppText>
              <AppText className="mt-3 text-center text-xs font-semibold text-white/45">
                SoundLog 안에서 현재 여행 음악으로 선택됐어요
              </AppText>
            </View>

            <View className="mt-6 rounded-[22px] border border-white/10 bg-white/10 p-4">
              <AppText className="text-xs font-semibold uppercase text-white/40">
                어디에서 들을까요?
              </AppText>
              <View className="mt-3 gap-2">
                {externalLinks.slice(0, 3).map((link) => (
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-12 flex-row items-center justify-between rounded-full border border-white/10 bg-white/10 px-4"
                    key={link.id}
                    onPress={() => void handleOpenExternalLink(link)}
                  >
                    <View className="min-w-0 flex-1 flex-row items-center gap-2">
                      <Feather color="#fff" name="external-link" size={16} />
                      <AppText className="text-sm font-semibold text-white" numberOfLines={1}>
                        {link.label}
                      </AppText>
                    </View>
                    <Feather color="rgba(255,255,255,0.45)" name="chevron-right" size={17} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mt-6 flex-row items-center justify-center gap-5">
              <Pressable
                accessibilityLabel="이전 추천 곡 선택"
                accessibilityRole="button"
                className="h-14 w-14 items-center justify-center rounded-full bg-white/10"
                disabled={!canSkip}
                onPress={handleSelectPreviousTrack}
                style={{ opacity: canSkip ? 1 : 0.35 }}
              >
                <Feather color="#fff" name="chevron-left" size={30} />
              </Pressable>

              <Pressable
                accessibilityLabel="이 곡으로 순간 기록"
                accessibilityRole="button"
                className="h-[86px] w-[86px] items-center justify-center rounded-full border border-white/20"
                onPress={handleCaptureMoment}
                style={{ backgroundColor: playerGlow }}
              >
                <Feather color="#fff" name="camera" size={32} />
              </Pressable>

              <Pressable
                accessibilityLabel="다음 추천 곡 선택"
                accessibilityRole="button"
                className="h-14 w-14 items-center justify-center rounded-full bg-white/10"
                disabled={!canSkip}
                onPress={handleSelectNextTrack}
                style={{ opacity: canSkip ? 1 : 0.35 }}
              >
                <Feather color="#fff" name="chevron-right" size={30} />
              </Pressable>
            </View>

            <View className="mt-6">
              <Pressable
                accessibilityRole="button"
                className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-white"
                onPress={handleCaptureMoment}
              >
                <Feather color="#050916" name="camera" size={17} />
                <AppText className="text-sm font-semibold text-[#050916]">
                  이 곡으로 기록
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                className="mt-3 h-12 flex-row items-center justify-center gap-2 rounded-full border border-soundlog-lime/40 bg-soundlog-lime/10"
                onPress={handleOpenLiveSoundMap}
              >
                <Feather color="#B7E628" name="map-pin" size={17} />
                <AppText className="text-sm font-semibold text-soundlog-lime">
                  Live Sound Map 열기
                </AppText>
              </Pressable>
              <View className="mt-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-3">
                <AppText className="text-center text-xs leading-5 text-white/55">
                  음원을 재생하지 않고 곡 정보와 여행 순간을 SoundLog 안에 기록하거나, 여행 모드에서 지도에 공개해요.
                </AppText>
              </View>
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

            {actionMessage ? (
              <View className="mt-4 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
                <AppText className="text-center text-xs leading-5 text-amber-100">
                  {actionMessage}
                </AppText>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <TrackActionMenu
        actionMessage={actionMessage}
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
