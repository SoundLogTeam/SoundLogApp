import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MusicLogItem } from '@/types/domain';

type MusicLogCardProps = {
  index: number;
  item: MusicLogItem;
  onPress?: () => void;
};

export function MusicLogCard({ index, item, onPress }: MusicLogCardProps) {
  const hasImage = Boolean(item.imageUrl);

  return (
    <Pressable
      accessibilityLabel={`${item.placeName}에서 들은 ${item.trackTitle} 리캡 열기`}
      accessibilityRole={onPress ? 'button' : undefined}
      className={`mr-3 h-[170px] w-[116px] justify-end overflow-hidden rounded-[18px] p-3 ${
        hasImage ? 'bg-black/40' : 'bg-[#f4f4f4]'
      }`}
      disabled={!onPress}
      onPress={onPress}
      style={{
        transform: [{ rotate: index === 0 ? '-8deg' : index === 2 ? '8deg' : '0deg' }],
      }}
    >
      {item.imageUrl ? (
        <>
          <Image
            contentFit="cover"
            source={{ uri: item.imageUrl }}
            style={StyleSheet.absoluteFill}
            transition={250}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.68)']}
            end={{ x: 0.5, y: 1 }}
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </>
      ) : null}

      <View className="absolute left-3 top-3 rounded-full bg-black/25 px-2 py-1">
        <AppText className="text-[9px] font-semibold text-white/80">LOG</AppText>
      </View>

      <AppText
        className={`text-[12px] font-semibold ${hasImage ? 'text-white' : 'text-[#111827]'}`}
        numberOfLines={1}
      >
        {item.placeName}
      </AppText>
      <AppText
        className={`text-[10px] ${hasImage ? 'text-white/70' : 'text-[#4b5563]'}`}
        numberOfLines={1}
      >
        {item.trackTitle}
      </AppText>
    </Pressable>
  );
}
