import { PropsWithChildren, ReactNode } from "react";
import { Platform, ScrollView, useWindowDimensions, View } from "react-native";

const COLLAPSED_TOP = 205;
const SHEET_BACKGROUND = "rgba(7, 11, 31, 0.1)";
const glassSurfaceStyle = Platform.select({
  web: {
    WebkitBackdropFilter: "blur(18px) saturate(135%)",
    backdropFilter: "blur(18px) saturate(135%)",
  },
  default: {},
});

type PlaylistBottomSheetProps = PropsWithChildren<{
  stickyHeader?: ReactNode;
}>;

export function PlaylistBottomSheet({
  children,
  stickyHeader,
}: PlaylistBottomSheetProps) {
  const { height } = useWindowDimensions();
  const sheetStyle = {
    ...glassSurfaceStyle,
    backgroundColor: SHEET_BACKGROUND,
  };

  return (
    <ScrollView
      className="absolute inset-0"
      contentContainerStyle={{
        minHeight: height + COLLAPSED_TOP,
        paddingTop: COLLAPSED_TOP,
      }}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {stickyHeader ? (
        <View
          className="overflow-hidden rounded-t-[20px] border-x border-t border-white/20 pt-3"
          style={{ ...sheetStyle, minHeight: height }}
        >
          <View className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-white/80" />
          {stickyHeader}
          {children}
        </View>
      ) : (
        <View
          className="min-h-full overflow-hidden rounded-t-[20px] border border-white/20 pt-3"
          style={{ ...sheetStyle, height }}
        >
          <View className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-white/80" />
          {children}
        </View>
      )}
    </ScrollView>
  );
}
