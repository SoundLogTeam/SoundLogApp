import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TrackList } from '@/components/playlist/TrackList';
import type { PlaylistCuration, Track } from '@/types/domain';

type HomeSoundtrackBottomSheetProps = {
  actionMessage?: string;
  currentTrackId?: string;
  isLoading?: boolean;
  likedTrackIds: Set<string>;
  onClose: () => void;
  onSelectTrack: (track: Track) => void;
  onToggleLike: (track: Track) => void;
  onToggleSave: (track: Track) => void;
  playlist?: PlaylistCuration;
  savedTrackIds: Set<string>;
  visible: boolean;
};

const CLOSE_DRAG_DISTANCE = 86;
const CLOSE_DRAG_VELOCITY = 0.75;

export function HomeSoundtrackBottomSheet({
  actionMessage,
  currentTrackId,
  isLoading = false,
  likedTrackIds,
  onClose,
  onSelectTrack,
  onToggleLike,
  onToggleSave,
  playlist,
  savedTrackIds,
  visible,
}: HomeSoundtrackBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(0)).current;
  const sheetMaxHeight = Math.min(height * 0.82, 680);
  const listBottomPadding = insets.bottom + 32;

  useEffect(() => {
    if (!visible) {
      translateY.setValue(0);
      return;
    }

    translateY.setValue(32);
    Animated.spring(translateY, {
      damping: 22,
      mass: 0.7,
      stiffness: 210,
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, [translateY, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(Math.max(gesture.dy, 0));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > CLOSE_DRAG_DISTANCE || gesture.vy > CLOSE_DRAG_VELOCITY) {
            onClose();
            return;
          }

          Animated.spring(translateY, {
            damping: 20,
            stiffness: 220,
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, translateY],
  );

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="오늘의 사운드트랙 닫기"
          accessibilityRole="button"
          className="absolute inset-0 bg-black/58"
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.sheet,
            {
              maxHeight: sheetMaxHeight,
              paddingBottom: insets.bottom + 10,
              transform: [{ translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} className="px-5 pt-3">
            <View className="mx-auto mb-4 h-[5px] w-10 rounded-full bg-white/70" />
            <View className="flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <AppText className="text-[11px] font-semibold text-[#B7E628]">
                  오늘의 사운드트랙
                </AppText>
                <AppText className="mt-1 text-[24px] font-semibold leading-8 text-white" numberOfLines={1}>
                  {playlist?.regionName ?? '추천 곡'}
                </AppText>
                {playlist ? (
                  <AppText className="mt-2 text-xs leading-5 text-white/55" numberOfLines={2}>
                    {playlist.reason}
                  </AppText>
                ) : null}
              </View>
              <Pressable
                accessibilityLabel="오늘의 사운드트랙 닫기"
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                onPress={onClose}
              >
                <Feather color="#FFFFFF" name="x" size={18} />
              </Pressable>
            </View>

            {playlist ? (
              <View className="mt-4 flex-row gap-2">
                <View className="rounded-full bg-white/10 px-3 py-1.5">
                  <AppText className="text-[11px] font-semibold text-white/70">
                    {playlist.trackCount}곡
                  </AppText>
                </View>
                <View className="rounded-full bg-white/10 px-3 py-1.5">
                  <AppText className="text-[11px] font-semibold text-white/70">
                    {playlist.durationText}
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>

          {isLoading ? (
            <View className="items-center justify-center px-5 py-12">
              <ActivityIndicator color="#B7E628" />
              <AppText className="mt-4 text-sm font-semibold text-white">
                추천 곡을 불러오고 있어요
              </AppText>
            </View>
          ) : playlist ? (
            <ScrollView
              className="mt-5"
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: sheetMaxHeight - 190 }}
            >
              <TrackList
                bottomPadding={listBottomPadding}
                currentTrackId={currentTrackId}
                likedTrackIds={likedTrackIds}
                onSelectTrack={onSelectTrack}
                onToggleLike={onToggleLike}
                onToggleSave={onToggleSave}
                savedTrackIds={savedTrackIds}
                tracks={playlist.tracks}
              />
            </ScrollView>
          ) : (
            <View className="px-5 py-10">
              <AppText className="text-center text-base font-semibold text-white">
                추천 곡을 열지 못했어요
              </AppText>
            </View>
          )}

          {actionMessage ? (
            <View className="mx-5 mt-3 rounded-[14px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
              <AppText className="text-center text-xs leading-5 text-amber-100">
                {actionMessage}
              </AppText>
            </View>
          ) : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: '#08101D',
    borderColor: 'rgba(255,255,255,0.14)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
