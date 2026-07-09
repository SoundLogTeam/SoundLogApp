import { Feather } from '@expo/vector-icons';
import { Linking, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

type CameraPermissionStateProps = {
  canAskAgain?: boolean;
  onRequest: () => void;
  onSkipPhoto: () => void;
  status?: string;
};

export function CameraPermissionState({
  canAskAgain = true,
  onRequest,
  onSkipPhoto,
  status,
}: CameraPermissionStateProps) {
  const isDenied = status === 'denied';

  return (
    <View className="w-full items-center px-8">
      <View className="h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/10">
        <Feather color="#fff" name="camera" size={34} />
      </View>
      <AppText className="mt-8 text-center text-[24px] font-semibold text-white">
        카메라 권한이 필요해요
      </AppText>
      <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
        여행 순간을 사진과 음악, 장소 정보로 함께 저장하기 위해 카메라 접근을 허용해주세요.
      </AppText>

      <Pressable
        className="mt-8 rounded-full bg-white px-5 py-3"
        onPress={isDenied && !canAskAgain ? () => void Linking.openSettings() : onRequest}
      >
        <AppText className="font-semibold text-[#050916]">
          {isDenied && !canAskAgain ? '설정 열기' : '카메라 권한 허용'}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        className="mt-3 rounded-full border border-white/15 px-5 py-3"
        onPress={onSkipPhoto}
      >
        <AppText className="font-semibold text-white/80">사진 없이 기록하기</AppText>
      </Pressable>
    </View>
  );
}
