import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

type PlaylistBackgroundProps = {
  accentColor?: string;
  imageUrl?: string;
};

export function PlaylistBackground({ accentColor, imageUrl }: PlaylistBackgroundProps) {
  const { height, width } = useWindowDimensions();
  const repeatedImageStyle = { height: height / 2, width };

  return (
    <View style={StyleSheet.absoluteFill}>
      {imageUrl ? (
        <>
          <Image
            contentFit="cover"
            source={{ uri: imageUrl }}
            style={repeatedImageStyle}
            transition={300}
          />
          <Image
            contentFit="cover"
            source={{ uri: imageUrl }}
            style={repeatedImageStyle}
            transition={300}
          />
        </>
      ) : (
        <LinearGradient
          colors={['#050916', '#0C1531', '#211337']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View className="absolute inset-0 bg-black/28" />
      <LinearGradient
        colors={['rgba(5,9,22,0.04)', 'rgba(5,9,22,0.62)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {accentColor ? (
        <LinearGradient
          colors={[accentColor, `${accentColor}00`]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={{ height: 150, left: 0, pointerEvents: 'none', position: 'absolute', right: 0, top: 0 }}
        />
      ) : null}
    </View>
  );
}
