import { Image } from 'expo-image';
import { View } from 'react-native';

type RecordDiscProps = {
  imageUrl?: string;
};

export function RecordDisc({ imageUrl }: RecordDiscProps) {
  return (
    <View className="h-[210px] w-[210px] items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/15">
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={{ height: '100%', position: 'absolute', width: '100%' }}
          transition={300}
        />
      ) : null}
      <View className="absolute inset-0 rounded-full bg-black/20" />
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-white/25 bg-[#1A111D]">
        <View className="h-5 w-5 rounded-full bg-white/20" />
      </View>
    </View>
  );
}
