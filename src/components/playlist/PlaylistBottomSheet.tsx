import { PropsWithChildren, ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

const COLLAPSED_TOP = 205;
const SHEET_BACKGROUND = 'rgba(5, 9, 22, 0.78)';

type PlaylistBottomSheetProps = PropsWithChildren<{
  stickyHeader?: ReactNode;
}>;

export function PlaylistBottomSheet({ children, stickyHeader }: PlaylistBottomSheetProps) {
  const { height } = useWindowDimensions();

  return (
    <ScrollView
      className="absolute inset-0"
      contentContainerStyle={{ minHeight: height + COLLAPSED_TOP, paddingTop: COLLAPSED_TOP }}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
    >
      {stickyHeader ? (
        [
          <View
            key="sticky-header"
            className="overflow-hidden rounded-t-[20px] border-x border-t border-white/10 pt-3"
            style={{ backgroundColor: SHEET_BACKGROUND }}
          >
            <View className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-white/80" />
            {stickyHeader}
          </View>,
          <View
            key="sheet-content"
            className="border-x border-white/10"
            style={{ backgroundColor: SHEET_BACKGROUND, minHeight: height }}
          >
            {children}
          </View>,
        ]
      ) : (
        <View
          className="min-h-full overflow-hidden rounded-t-[20px] border border-white/10 pt-3"
          style={{ backgroundColor: SHEET_BACKGROUND, height }}
        >
          <View className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-white/80" />
          {children}
        </View>
      )}
    </ScrollView>
  );
}
