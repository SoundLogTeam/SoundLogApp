import { Image } from 'expo-image';
import { View } from 'react-native';

type RecordDiscProps = {
  imageUrl?: string;
};

export function RecordDisc({ imageUrl }: RecordDiscProps) {
  return (
    <View className="h-[210px] w-[210px] items-center justify-center overflow-hidden rounded-full border border-white/30 bg-[#060810]">
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={{ height: '100%', position: 'absolute', width: '100%' }}
          transition={300}
        />
      ) : (
        <>
          <View className="absolute h-[178px] w-[178px] rounded-full border border-white/10" />
          <View className="absolute h-[142px] w-[142px] rounded-full border border-white/[0.08]" />
          <View className="absolute h-[106px] w-[106px] rounded-full border border-white/[0.07]" />
        </>
      )}
      <View
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: imageUrl ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
        }}
      />
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-white/25 bg-[#1A111D]">
        <View className="h-5 w-5 rounded-full bg-white/20" />
      </View>
    </View>
  );
}
