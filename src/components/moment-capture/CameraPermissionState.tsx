import { Linking, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PageHeader } from '@/components/PageHeader';
import { SectionTitle } from '@/components/SectionTitle';
import { SettingsRow } from '@/components/SettingsRow';

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
    <View className="w-full flex-1 px-6 pb-10 pt-10">
      <PageHeader title="카메라 권한" />

      <View className="mt-9">
        <SectionTitle title="리캡 촬영" />
        <SettingsRow
          description="여행 순간을 사진과 음악, 장소 정보로 함께 저장할 때 사용해요."
          icon="camera"
          label="카메라 접근"
          rightText={isDenied ? '권한 꺼짐' : '확인 필요'}
        />
      </View>

      <AppText className="mt-5 text-sm leading-6 text-white/48">
        권한을 허용하지 않아도 사진 없이 장소, 음악, 무드를 리캡으로 저장할 수 있어요.
      </AppText>

      <Pressable
        accessibilityRole="button"
        className="mt-auto h-14 items-center justify-center rounded-xl bg-soundlog-lime px-5"
        onPress={isDenied && !canAskAgain ? () => void Linking.openSettings() : onRequest}
      >
        <AppText className="font-semibold text-soundlog-inverse">
          {isDenied && !canAskAgain ? '설정 열기' : '카메라 권한 허용'}
        </AppText>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        className="mt-2 h-12 items-center justify-center"
        onPress={onSkipPhoto}
      >
        <AppText className="font-semibold text-white/58">사진 없이 기록하기</AppText>
      </Pressable>
    </View>
  );
}
