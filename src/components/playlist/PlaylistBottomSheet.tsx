import { PropsWithChildren, ReactNode } from 'react';
import { Animated, Platform, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSnappingBottomSheetGesture } from '@/hooks/useBottomSheetGesture';

const COLLAPSED_TOP = 205;
const SHEET_BACKGROUND = 'rgba(7, 11, 31, 0.88)';
const glassSurfaceStyle = Platform.select({
  web: {
    WebkitBackdropFilter: 'blur(18px) saturate(135%)',
    backdropFilter: 'blur(18px) saturate(135%)',
  },
  default: {},
});

type PlaylistBottomSheetProps = PropsWithChildren<{
  stickyHeader?: ReactNode;
}>;

export function PlaylistBottomSheet({ children, stickyHeader }: PlaylistBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const expandedTop = Math.max(insets.top + 58, 78);
  const collapsedTop = Math.min(COLLAPSED_TOP, Math.max(expandedTop + 72, height * 0.28));
  const collapsedOffset = collapsedTop - expandedTop;
  const sheetHeight = height - expandedTop;
  const { panHandlers, translateY } = useSnappingBottomSheetGesture({
    collapsedOffset,
  });
  const sheetStyle = {
    ...glassSurfaceStyle,
    backgroundColor: SHEET_BACKGROUND,
  };

  return (
    <Animated.View
      className="absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[20px] border-x border-t border-white/20"
      style={[
        sheetStyle,
        {
          height: sheetHeight,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        {...panHandlers}
        accessible
        accessibilityHint="위아래로 드래그해 추천 목록을 펼치거나 접을 수 있습니다."
        accessibilityLabel="플레이리스트 시트 핸들"
        className="min-h-11 items-center justify-center"
      >
        <View className="h-[5px] w-10 rounded-full bg-white/80" />
      </View>

      {stickyHeader ? <View>{stickyHeader}</View> : null}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          minHeight: stickyHeader ? undefined : sheetHeight - 44,
        }}
        nestedScrollEnabled
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}
