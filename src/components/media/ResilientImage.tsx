import { Feather } from '@expo/vector-icons';
import { Image, type ImageProps } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

type ImageFallbackVariant = 'music' | 'place' | 'playlist' | 'recap';

type ResilientImageProps = Omit<ImageProps, 'source' | 'style'> & {
  className?: string;
  containerClassName?: string;
  fallbackVariant?: ImageFallbackVariant;
  source?: ImageProps['source'];
  sourceKey?: string;
  style?: StyleProp<ViewStyle>;
  uri?: string | null;
};

const fallbackConfig: Record<
  ImageFallbackVariant,
  {
    colors: readonly [string, string, ...string[]];
    icon: keyof typeof Feather.glyphMap;
  }
> = {
  music: {
    colors: ['#30205D', '#11172C'],
    icon: 'music',
  },
  place: {
    colors: ['#243A5E', '#0A1225'],
    icon: 'map-pin',
  },
  playlist: {
    colors: ['#3A286A', '#12182B'],
    icon: 'disc',
  },
  recap: {
    colors: ['#344561', '#101728'],
    icon: 'image',
  },
};

function getSourceKey(source: ImageProps['source'], uri?: string | null) {
  if (uri) {
    return uri;
  }

  if (typeof source === 'number' || typeof source === 'string') {
    return String(source);
  }

  if (Array.isArray(source)) {
    return source.map((item) => (typeof item === 'object' ? item?.uri : item)).join('|');
  }

  return source && typeof source === 'object' && 'uri' in source
    ? String(source.uri ?? '')
    : '';
}

export function ResilientImage({
  accessibilityLabel,
  className,
  containerClassName,
  fallbackVariant = 'recap',
  onError,
  source,
  sourceKey,
  style,
  uri,
  ...imageProps
}: ResilientImageProps) {
  const resolvedSource = uri ? { uri } : source;
  const resolvedSourceKey = useMemo(
    () => sourceKey ?? getSourceKey(resolvedSource, uri),
    [resolvedSource, sourceKey, uri],
  );
  const [failedSourceKey, setFailedSourceKey] = useState<string>();
  const shouldShowFallback = !resolvedSource || failedSourceKey === resolvedSourceKey;
  const fallback = fallbackConfig[fallbackVariant];

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      className={containerClassName ?? className}
      style={[styles.container, style]}
    >
      {shouldShowFallback ? (
        <LinearGradient
          colors={fallback.colors}
          end={{ x: 0.85, y: 1 }}
          start={{ x: 0.15, y: 0 }}
          style={StyleSheet.absoluteFill}
        >
          <View style={styles.glowLarge} />
          <View style={styles.glowSmall} />
          <View style={styles.fallbackIcon}>
            <Feather color="rgba(255,255,255,0.82)" name={fallback.icon} size={24} />
          </View>
        </LinearGradient>
      ) : (
        <Image
          {...imageProps}
          accessibilityLabel={accessibilityLabel}
          onError={(event) => {
            setFailedSourceKey(resolvedSourceKey);
            onError?.(event);
          }}
          source={resolvedSource}
          style={StyleSheet.absoluteFill}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fallbackIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    position: 'absolute',
    top: '50%',
    width: 50,
  },
  glowLarge: {
    backgroundColor: 'rgba(183,230,40,0.10)',
    borderRadius: 999,
    height: 150,
    position: 'absolute',
    right: -62,
    top: -74,
    width: 150,
  },
  glowSmall: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 999,
    bottom: -36,
    height: 90,
    left: -26,
    position: 'absolute',
    width: 90,
  },
});
