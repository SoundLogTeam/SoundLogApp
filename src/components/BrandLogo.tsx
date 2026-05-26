import { Image } from 'expo-image';
import { View } from 'react-native';

const soundlogLogo = require('../../assets/soundlog-logo.png');

type BrandLogoProps = {
  className?: string;
  size?: number;
};

export function BrandLogo({ className, size = 40 }: BrandLogoProps) {
  return (
    <View
      className={className}
      style={{
        borderRadius: size / 2,
        height: size,
        overflow: 'hidden',
        width: size,
      }}
    >
      <Image
        accessibilityIgnoresInvertColors
        accessibilityLabel="Soundlog logo"
        contentFit="cover"
        source={soundlogLogo}
        style={{ height: '100%', width: '100%' }}
      />
    </View>
  );
}
