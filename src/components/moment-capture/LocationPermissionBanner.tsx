import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';

type LocationPermissionBannerProps = {
  status: 'denied' | 'granted' | 'idle' | 'loading' | 'unavailable';
};

const statusText: Record<LocationPermissionBannerProps['status'], string> = {
  denied: '위치 권한 없이 저장돼요',
  granted: '현재 위치를 함께 저장할게요',
  idle: '위치를 준비하고 있어요',
  loading: '촬영 위치를 확인 중이에요',
  unavailable: '위치를 확인하지 못했지만 저장할 수 있어요',
};

export function LocationPermissionBanner({ status }: LocationPermissionBannerProps) {
  return (
    <View className="flex-row items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2">
      <Feather
        color={status === 'granted' ? '#86efac' : '#f8fafc'}
        name={status === 'loading' ? 'loader' : 'map-pin'}
        size={14}
      />
      <AppText className="text-xs text-white/80">{statusText[status]}</AppText>
    </View>
  );
}
