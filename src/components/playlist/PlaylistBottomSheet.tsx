import { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function PlaylistBottomSheet({ children }: PropsWithChildren) {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-[20px] border border-white/10 pt-3"
      style={{ backgroundColor: 'rgba(5, 9, 22, 0.78)', top: 205 }}
    >
      <View className="mx-auto mb-5 h-[5px] w-9 rounded-full bg-white/80" />
      {children}
    </View>
  );
}
