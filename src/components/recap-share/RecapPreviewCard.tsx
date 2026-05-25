import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RecordDisc } from '@/components/recap-share/RecordDisc';
import { RecapShare } from '@/types/domain';

type RecapPreviewCardProps = {
  recap: RecapShare;
};

export function RecapPreviewCard({ recap }: RecapPreviewCardProps) {
  return (
    <View
      className="h-full w-full overflow-hidden rounded-[20px] border border-white/15 bg-black/60"
    >
      {recap.backgroundImageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: recap.backgroundImageUrl }}
          style={StyleSheet.absoluteFill}
          transition={300}
        />
      ) : (
        <LinearGradient
          colors={['#10172A', '#251339', '#392136']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View className="absolute inset-0 bg-black/35" />
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.62)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <AppText
        className="absolute left-5 right-5 top-6 text-base font-semibold text-white"
        numberOfLines={1}
      >
        {recap.placeName}
      </AppText>

      <View className="absolute inset-x-0 top-[88px] items-center">
        <RecordDisc imageUrl={recap.discImageUrl ?? recap.backgroundImageUrl} />
      </View>

      <View className="absolute bottom-6 left-5 right-5">
        <AppText className="text-[24px] font-semibold leading-8 text-white" numberOfLines={1}>
          {recap.trackTitle}
        </AppText>
        <AppText className="mt-1 text-xs font-medium text-white/80" numberOfLines={1}>
          {recap.artistName}
        </AppText>
      </View>
    </View>
  );
}
