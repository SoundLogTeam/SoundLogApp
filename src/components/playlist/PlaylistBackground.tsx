import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { ResilientImage } from "@/components/media/ResilientImage";

type PlaylistBackgroundProps = {
  accentColor?: string;
  imageUrl?: string;
};

export function PlaylistBackground({
  accentColor,
  imageUrl,
}: PlaylistBackgroundProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <ResilientImage
        accessibilityLabel="플레이리스트 배경 이미지"
        contentFit="cover"
        fallbackVariant="playlist"
        style={StyleSheet.absoluteFill}
        transition={300}
        uri={imageUrl}
      />
      <View className="absolute inset-0 bg-black/28" />
      <LinearGradient
        colors={["rgba(5,9,22,0.04)", "rgba(5,9,22,0.62)"]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {accentColor ? (
        <LinearGradient
          colors={[accentColor, `${accentColor}00`]}
          end={{ x: 0.5, y: 1 }}
          start={{ x: 0.5, y: 0 }}
          style={{
            height: 150,
            left: 0,
            pointerEvents: "none",
            position: "absolute",
            right: 0,
            top: 0,
          }}
        />
      ) : null}
    </View>
  );
}
