import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

type PlaylistBackgroundProps = {
  imageUrl?: string;
};

export function PlaylistBackground({ imageUrl }: PlaylistBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          transition={300}
        />
      ) : (
        <LinearGradient
          colors={['#050916', '#0C1531', '#211337']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View className="absolute inset-0 bg-black/55" />
      <LinearGradient
        colors={['rgba(5,9,22,0.05)', 'rgba(5,9,22,0.88)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
