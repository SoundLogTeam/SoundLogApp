import { Feather } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { ResilientImage } from "@/components/media/ResilientImage";
import { LibraryTrackRecord } from "@/store/libraryStore";
import { formatRecapRecordedAt } from "@/utils/dateFormat";

type LibraryTrackRowProps = {
  isDeleteOpen: boolean;
  onRemove: () => void;
  onToggleDelete: () => void;
  record: LibraryTrackRecord;
};

const DELETE_ACTION_WIDTH = 84;
const DELETE_REVEAL_DURATION_MS = 220;

export function LibraryTrackRow({
  isDeleteOpen,
  onRemove,
  onToggleDelete,
  record,
}: LibraryTrackRowProps) {
  const { track } = record;
  const artworkUrl =
    track.albumImageUrl ??
    record.playlist?.coverImageUrl ??
    record.playlist?.backgroundImageUrl;
  const revealProgress = useRef(new Animated.Value(0)).current;
  const actionTranslateX = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [DELETE_ACTION_WIDTH, 0],
  });
  const rowTranslateX = revealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  useEffect(() => {
    const animation = Animated.timing(revealProgress, {
      duration: DELETE_REVEAL_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      toValue: isDeleteOpen ? 1 : 0,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [isDeleteOpen, revealProgress]);

  const handleRemove = () => {
    onRemove();
  };

  return (
    <View
      className="relative min-h-[72px] overflow-hidden border-b border-white/[0.06]"
      style={styles.rowContainer}
    >
      <Animated.View
        accessibilityElementsHidden={!isDeleteOpen}
        className="absolute inset-y-0 right-0 bg-[#D92D3C]"
        importantForAccessibility={isDeleteOpen ? "yes" : "no-hide-descendants"}
        pointerEvents={isDeleteOpen ? "auto" : "none"}
        style={[
          styles.deleteAction,
          { transform: [{ translateX: actionTranslateX }] },
        ]}
      >
        <Pressable
          accessibilityHint="보관함에서 이 곡을 제거합니다."
          accessibilityLabel={`${track.title} 보관함에서 삭제`}
          accessibilityRole="button"
          className="min-h-[72px] flex-1 items-center justify-center gap-1"
          onPress={handleRemove}
        >
          <Feather color="#FFFFFF" name="trash-2" size={19} />
          <AppText className="text-[11px] font-semibold text-white">
            삭제
          </AppText>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={[
          styles.rowSurface,
          { transform: [{ translateX: rowTranslateX }] },
        ]}
      >
        <Pressable
          accessibilityActions={[
            { label: "삭제 버튼 열기 또는 닫기", name: "activate" },
            { label: "보관함에서 삭제", name: "delete" },
          ]}
          accessibilityHint={
            isDeleteOpen
              ? "두 번 탭하면 삭제 버튼을 닫습니다."
              : "두 번 탭하면 삭제 버튼이 나타납니다."
          }
          accessibilityLabel={`${track.title}, ${track.artist}`}
          accessibilityRole="button"
          className="min-h-[72px] flex-row items-center bg-soundlog-bg py-2"
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === "delete") {
              handleRemove();
              return;
            }

            onToggleDelete();
          }}
          onPress={onToggleDelete}
        >
          <View
            className="h-[52px] w-[52px] overflow-hidden rounded-lg"
            style={{ backgroundColor: track.fallbackColor ?? "#2B176C" }}
          >
            <ResilientImage
              accessibilityLabel={`${track.title} 앨범 이미지`}
              contentFit="cover"
              fallbackVariant="music"
              style={{ height: "100%", width: "100%" }}
              uri={artworkUrl}
            />
          </View>

          <View className="ml-3 min-w-0 flex-1">
            <AppText
              className="text-base font-semibold text-white"
              numberOfLines={1}
            >
              {track.title}
            </AppText>
            <AppText className="mt-1 text-xs text-white/55" numberOfLines={1}>
              {track.artist}
            </AppText>
            <AppText
              className="mt-1.5 text-[11px] text-white/35"
              numberOfLines={1}
            >
              {formatRecapRecordedAt(record.createdAt)}
            </AppText>
          </View>
          <Feather
            color="rgba(255,255,255,0.32)"
            name={isDeleteOpen ? "x" : "more-horizontal"}
            size={18}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    flexShrink: 0,
    width: DELETE_ACTION_WIDTH,
    zIndex: 1,
  },
  rowSurface: {
    backgroundColor: "#070B1F",
    width: "100%",
  },
  rowContainer: {
    width: "100%",
  },
});
