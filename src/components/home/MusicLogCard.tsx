import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { MusicLogItem } from '@/types/domain';

type MusicLogCardProps = {
  animatedStyle?: StyleProp<ViewStyle>;
  cardHeight?: number;
  cardWidth?: number;
  index: number;
  item: MusicLogItem;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function MusicLogCard({
  animatedStyle,
  cardHeight = 170,
  cardWidth = 116,
  item,
  onPress,
  style,
}: MusicLogCardProps) {
  const hasImage = Boolean(item.imageUrl);

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        accessibilityLabel={`${item.placeName}에서 들은 ${item.trackTitle} 리캡 열기`}
        accessibilityRole={onPress ? 'button' : undefined}
        className={`justify-end overflow-hidden rounded-[18px] p-3 ${
          hasImage ? 'bg-black/40' : 'bg-[#251A4A]'
        }`}
        disabled={!onPress}
        onPress={onPress}
        style={{
          height: cardHeight,
          width: cardWidth,
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
          className="text-[12px] font-semibold text-white"
          numberOfLines={1}
        >
          {item.placeName}
        </AppText>
        <AppText
          className="text-[10px] text-white/70"
          numberOfLines={1}
        >
          {item.trackTitle}
        </AppText>
      </Pressable>
    </Animated.View>
  );
}
