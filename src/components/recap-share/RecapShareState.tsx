import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SettingsRow } from '@/components/SettingsRow';

export function RecapShareLoadingState() {
  return (
    <View className="w-full items-center">
      <View className="h-[426px] w-[88%] max-w-[320px] rounded-lg bg-white/10" />
      <View className="mt-5 h-4 w-44 rounded bg-white/10" />
      <View className="mt-12 flex-row gap-5">
        {[0, 1].map((item) => (
          <View key={item} className="h-[54px] w-[54px] rounded-full bg-white/10" />
        ))}
      </View>
    </View>
  );
}

type RecapShareErrorStateProps = {
  onRetry?: () => void;
};

export function RecapShareErrorState({ onRetry }: RecapShareErrorStateProps) {
  return (
    <View className="w-full">
      <SettingsRow
        description="네트워크 상태를 확인한 뒤 다시 시도해주세요."
        icon="alert-circle"
        label="공유할 음악 기록을 불러오지 못했어요"
      />
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          className="mt-4 h-12 items-center justify-center rounded-xl bg-soundlog-lime px-5"
          onPress={onRetry}
        >
          <AppText className="font-semibold text-soundlog-inverse">다시 시도</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RecapShareEmptyState() {
  return (
    <View className="w-full">
      <SettingsRow
        description="여행 중 저장한 리캡이 생기면 이곳에서 로그를 볼 수 있어요."
        icon="image"
        label="공유할 음악 기록을 찾을 수 없어요"
      />
    </View>
  );
}
