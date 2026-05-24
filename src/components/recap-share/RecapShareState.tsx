import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

export function RecapShareLoadingState() {
  return (
    <View className="w-full items-center">
      <View className="h-[426px] w-[88%] max-w-[320px] rounded-[20px] bg-white/10" />
      <View className="mt-5 h-4 w-44 rounded-full bg-white/10" />
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
    <View className="items-center px-8">
      <AppText className="text-center text-[24px] font-semibold text-white">
        공유할 음악 기록을 불러오지 못했어요
      </AppText>
      <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
        네트워크 상태를 확인한 뒤 다시 시도해주세요.
      </AppText>
      {onRetry ? (
        <Pressable className="mt-6 rounded-full bg-white px-5 py-3" onPress={onRetry}>
          <AppText className="font-semibold text-[#050916]">다시 시도</AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RecapShareEmptyState() {
  return (
    <View className="items-center px-8">
      <AppText className="text-center text-[24px] font-semibold text-white">
        공유할 음악 기록을 찾을 수 없어요
      </AppText>
      <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
        여행 중 저장한 음악 로그가 생기면 이곳에서 공유할 수 있어요.
      </AppText>
    </View>
  );
}
