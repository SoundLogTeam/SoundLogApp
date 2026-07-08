import { useEffect, useMemo, useRef } from 'react';
import { View } from 'react-native';
import Feature from 'ol/Feature';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';

import type { SoundMapPin, SoundMapPinKind, SoundMapViewport } from './types';

const pinColors: Record<SoundMapPinKind, { fill: string; stroke: string; text: string }> = {
  companion: {
    fill: '#132244',
    stroke: '#6EA8FF',
    text: '#E4E8FF',
  },
  me: {
    fill: '#B7E628',
    stroke: '#090515',
    text: '#090515',
  },
  nearby: {
    fill: '#2A1A15',
    stroke: '#FF8A3D',
    text: '#FFD0B0',
  },
};

const openLayersThemeCss = `
  .soundlog-openlayers-map,
  .soundlog-openlayers-map .ol-viewport {
    border-radius: 22px;
    overflow: hidden;
    background: #10172A;
  }

  .soundlog-openlayers-map .ol-layer canvas {
    filter: invert(1) hue-rotate(180deg) saturate(0.48) brightness(0.58) contrast(1.18);
  }

  .soundlog-openlayers-map .ol-control,
  .soundlog-openlayers-map .ol-attribution {
    display: none;
  }

  .soundlog-map-attribution {
    position: absolute;
    right: 10px;
    bottom: 8px;
    padding: 3px 6px;
    border-radius: 999px;
    background: rgba(8,13,24,0.72);
    color: rgba(255,255,255,0.62);
    font: 600 10px -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif;
    pointer-events: none;
  }
`;

function toMapCenter(location: { lat: number; lng: number }) {
  return fromLonLat([location.lng, location.lat]);
}

function createPinStyle(pin: SoundMapPin) {
  const colors = pinColors[pin.kind];
  const label = pin.kind === 'nearby' && pin.matchScore ? `${pin.matchScore}%` : pin.label;
  const isMe = pin.kind === 'me';

  return new Style({
    image: new CircleStyle({
      fill: new Fill({ color: colors.fill }),
      radius: pin.kind === 'me' ? 13 : 11,
      stroke: new Stroke({
        color: colors.stroke,
        width: pin.kind === 'me' ? 4 : 3,
      }),
    }),
    text: new Text({
      backgroundFill: new Fill({ color: isMe ? '#B7E628' : 'rgba(8,13,24,0.9)' }),
      backgroundStroke: new Stroke({ color: colors.stroke, width: 1 }),
      fill: new Fill({ color: colors.text }),
      font: '700 12px -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, sans-serif',
      offsetY: -30,
      padding: [6, 9, 6, 9],
      text: `${label} · ${pin.trackTitle}`,
    }),
  });
}

function createFeature(pin: SoundMapPin) {
  const feature = new Feature({
    geometry: new Point(toMapCenter(pin.location)),
    soundlogPinId: pin.id,
  });

  feature.setStyle(createPinStyle(pin));

  return feature;
}

export function OpenLayersSoundMap({ center, pins }: SoundMapViewport) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<OlMap | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const initialCenter = useMemo(() => toMapCenter(center), [center]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      zIndex: 2,
    });
    const tileLayer = new TileLayer({
      source: new OSM({
        crossOrigin: 'anonymous',
      }),
      zIndex: 1,
    });

    vectorSourceRef.current = vectorSource;
    mapRef.current = new OlMap({
      controls: [],
      layers: [tileLayer, vectorLayer],
      target: mapElementRef.current,
      view: new OlView({
        center: initialCenter,
        maxZoom: 17,
        minZoom: 11,
        zoom: 14,
      }),
    });

    return () => {
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      vectorSourceRef.current = null;
    };
  }, [initialCenter]);

  useEffect(() => {
    const vectorSource = vectorSourceRef.current;
    const map = mapRef.current;

    if (!vectorSource || !map) {
      return;
    }

    vectorSource.clear();
    vectorSource.addFeatures(pins.map(createFeature));
    map.getView().animate({
      center: toMapCenter(center),
      duration: 220,
      zoom: pins.length > 2 ? 13 : 14,
    });
  }, [center, pins]);

  return (
    <View className="relative h-[260px] overflow-hidden rounded-[22px] border border-white/12 bg-[#10172A]">
      <style>{openLayersThemeCss}</style>
      <div
        aria-label="Soundlog Live Sound Map"
        className="soundlog-openlayers-map"
        ref={mapElementRef}
        style={{
          height: '100%',
          minHeight: 260,
          width: '100%',
        }}
      />
      <div className="soundlog-map-attribution">© OpenStreetMap contributors</div>
    </View>
  );
}
