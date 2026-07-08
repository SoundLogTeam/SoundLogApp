import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';

import type { SoundMapViewport } from './types';

const pinPositions: Record<string, { left: `${number}%`; top: `${number}%` }> = {
  'companion-su': { left: '62%', top: '28%' },
  me: { left: '36%', top: '43%' },
  'nearby-night': { left: '22%', top: '31%' },
  'nearby-rainy': { left: '52%', top: '66%' },
};

const kindClassName = {
  companion: 'border-soundlog-blue bg-[#132244]',
  me: 'border-soundlog-lime bg-[#1E2B16]',
  nearby: 'border-soundlog-warning bg-[#2A1A15]',
} as const;

export function OpenLayersSoundMap({ pins, sessionStatus, visibility }: SoundMapViewport) {
  const isLive = sessionStatus === 'active' && visibility !== 'private';

  return (
    <View className="relative h-[260px] overflow-hidden rounded-[22px] border border-white/12 bg-[#10172A]">
      <View className="absolute inset-x-0 top-[28%] h-px bg-white/10" />
      <View className="absolute inset-x-0 top-[58%] h-px bg-white/10" />
      <View className="absolute inset-y-0 left-[32%] w-px bg-white/10" />
      <View className="absolute inset-y-0 left-[68%] w-px bg-white/10" />

      <View className="absolute left-4 top-4 flex-row items-center gap-2 rounded-full border border-white/12 bg-black/25 px-3 py-1.5">
        <Feather color={isLive ? '#B7E628' : 'rgba(255,255,255,0.55)'} name="radio" size={13} />
        <AppText className={isLive ? 'text-[11px] font-semibold text-soundlog-lime' : 'text-[11px] font-semibold text-white/55'}>
          {isLive ? 'Live preview' : 'Map preview'}
        </AppText>
      </View>

      {pins.map((pin) => {
        const position = pinPositions[pin.id] ?? pinPositions.me;

        return (
          <View
            className={`absolute max-w-[148px] rounded-full border px-3 py-2 ${kindClassName[pin.kind]}`}
            key={pin.id}
            style={position}
          >
            <AppText className="text-[11px] font-semibold text-white" numberOfLines={1}>
              {pin.label} · {pin.trackTitle}
            </AppText>
            <AppText className="mt-0.5 text-[10px] text-white/55" numberOfLines={1}>
              {pin.subtitle}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}
