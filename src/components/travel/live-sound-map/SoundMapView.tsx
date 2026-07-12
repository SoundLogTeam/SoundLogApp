import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Callout, Marker, type MapStyleElement, type Region } from 'react-native-maps';

import { AppText } from '@/components/AppText';

import type { SoundMapPin, SoundMapPinKind, SoundMapViewport } from './types';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

const DEFAULT_LATITUDE_DELTA = 0.018;
const DEFAULT_LONGITUDE_DELTA = 0.018;

const markerIconByKind: Record<SoundMapPinKind, FeatherIconName> = {
  companion: 'users',
  me: 'music',
  nearby: 'radio',
};

const markerPalette: Record<
  SoundMapPinKind,
  { background: string; border: string; icon: string; labelBackground: string; labelText: string }
> = {
  companion: {
    background: '#132244',
    border: '#6EA8FF',
    icon: '#DDE8FF',
    labelBackground: 'rgba(110,168,255,0.18)',
    labelText: '#DDE8FF',
  },
  me: {
    background: '#B7E628',
    border: '#090515',
    icon: '#090515',
    labelBackground: 'rgba(9,5,21,0.18)',
    labelText: '#090515',
  },
  nearby: {
    background: '#2A1A15',
    border: '#FF8A3D',
    icon: '#FFD0B0',
    labelBackground: 'rgba(255,138,61,0.18)',
    labelText: '#FFD0B0',
  },
};

const googleDarkMapStyle: MapStyleElement[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#10172A' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#B8C0D8' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0B1020' }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#2B3550' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#151F35' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#163020' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#273147' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#111827' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#38435C' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1B2940' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0A2238' }],
  },
];

function createRegion(center: SoundMapViewport['center']): Region {
  return {
    latitude: center.lat,
    latitudeDelta: DEFAULT_LATITUDE_DELTA,
    longitude: center.lng,
    longitudeDelta: DEFAULT_LONGITUDE_DELTA,
  };
}

function toCoordinate(location: SoundMapPin['location']) {
  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}

function getPinLabel(pin: SoundMapPin) {
  if (pin.kind === 'nearby' && pin.matchScore) {
    return `${pin.matchScore}%`;
  }

  return pin.label;
}

function getCalloutTitle(pin: SoundMapPin) {
  return `${pin.label} · ${pin.trackTitle}`;
}

function getCalloutDescription(pin: SoundMapPin) {
  return [pin.artistName, pin.subtitle].filter(Boolean).join(' · ');
}

function getMapStatusLabel(
  sessionStatus: SoundMapViewport['sessionStatus'],
  visibility: SoundMapViewport['visibility'],
) {
  if (sessionStatus !== 'active') {
    return 'PREVIEW';
  }

  if (visibility === 'private') {
    return 'PRIVATE';
  }

  return 'LIVE';
}

export function SoundMapView({
  center,
  fullBleed = false,
  height,
  legendItems,
  pins,
  sessionStatus,
  showChrome = true,
  statusLabel: customStatusLabel,
  visibility,
}: SoundMapViewport) {
  const mapRef = useRef<MapView | null>(null);
  const initialRegion = useMemo(() => createRegion(center), [center]);
  const statusLabel = customStatusLabel ?? getMapStatusLabel(sessionStatus, visibility);
  const isLive = statusLabel === 'LIVE';
  const mapLegendItems = legendItems ?? [
    { color: markerPalette.me.border, label: '나' },
    { color: markerPalette.companion.border, label: '동행' },
    { color: markerPalette.nearby.border, label: '주변' },
  ];

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!mapRef.current) {
        return;
      }

      if (pins.length < 2) {
        mapRef.current.animateToRegion(createRegion(center), 260);
        return;
      }

      mapRef.current.fitToCoordinates(pins.map((pin) => toCoordinate(pin.location)), {
        animated: true,
        edgePadding: {
          bottom: 68,
          left: 44,
          right: 44,
          top: 70,
        },
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [center, pins]);

  return (
    <View
      style={[
        styles.container,
        fullBleed ? styles.fullBleedContainer : undefined,
        height ? { height } : undefined,
      ]}
    >
      <MapView
        customMapStyle={Platform.OS === 'android' ? googleDarkMapStyle : undefined}
        initialRegion={initialRegion}
        loadingBackgroundColor="#070B1F"
        loadingEnabled
        loadingIndicatorColor="#B7E628"
        mapType="standard"
        pitchEnabled={false}
        ref={mapRef}
        rotateEnabled={false}
        showsBuildings={false}
        showsCompass={false}
        showsPointsOfInterests={false}
        showsScale={false}
        showsTraffic={false}
        style={styles.map}
        toolbarEnabled={false}
        userInterfaceStyle="dark"
      >
        {pins.map((pin) => {
          const palette = markerPalette[pin.kind];

          return (
            <Marker
              accessibilityLabel={`${pin.label} ${pin.trackTitle}`}
              coordinate={toCoordinate(pin.location)}
              description={getCalloutDescription(pin)}
              key={pin.id}
              title={getCalloutTitle(pin)}
            >
              <View
                style={[
                  styles.markerHalo,
                  {
                    backgroundColor: `${palette.border}24`,
                  },
                ]}
              >
                <View
                  style={[
                    styles.marker,
                    {
                      backgroundColor: palette.background,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <Feather color={palette.icon} name={markerIconByKind[pin.kind]} size={15} />
                </View>
                <View
                  style={[
                    styles.markerLabel,
                    {
                      backgroundColor: palette.labelBackground,
                      borderColor: palette.border,
                    },
                  ]}
                >
                  <AppText
                    numberOfLines={1}
                    style={[
                      styles.markerLabelText,
                      {
                        color: palette.labelText,
                      },
                    ]}
                  >
                    {getPinLabel(pin)}
                  </AppText>
                </View>
              </View>

              <Callout tooltip>
                <View style={styles.callout}>
                  <AppText numberOfLines={1} style={styles.calloutTitle}>
                    {getCalloutTitle(pin)}
                  </AppText>
                  <AppText numberOfLines={2} style={styles.calloutDescription}>
                    {getCalloutDescription(pin)}
                  </AppText>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {showChrome ? (
        <>
          <View pointerEvents="none" style={styles.statusPill}>
            <Feather
              color={isLive ? '#B7E628' : 'rgba(255,255,255,0.68)'}
              name={isLive ? 'radio' : 'map-pin'}
              size={13}
            />
            <AppText
              style={[
                styles.statusText,
                {
                  color: isLive ? '#B7E628' : 'rgba(255,255,255,0.68)',
                },
              ]}
            >
              {statusLabel}
            </AppText>
          </View>

          <View pointerEvents="none" style={styles.legend}>
            {mapLegendItems.map((item) => (
              <LegendItem color={item.color} key={item.label} label={item.label} />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText style={styles.legendText}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: {
    backgroundColor: 'rgba(8,13,24,0.96)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  calloutDescription: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  calloutTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#070B1F',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 22,
    borderWidth: 1,
    height: 260,
    overflow: 'hidden',
  },
  fullBleedContainer: {
    borderRadius: 0,
    borderWidth: 0,
    flex: 1,
    height: '100%',
  },
  legend: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,13,24,0.72)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    bottom: 10,
    flexDirection: 'row',
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
    right: 10,
  },
  legendDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 10,
    fontWeight: '700',
  },
  map: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  marker: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 2,
    height: 34,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    width: 34,
  },
  markerHalo: {
    alignItems: 'center',
    borderRadius: 999,
    padding: 5,
  },
  markerLabel: {
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 3,
    maxWidth: 62,
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  markerLabelText: {
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,13,24,0.72)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    position: 'absolute',
    top: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
