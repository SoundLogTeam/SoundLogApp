import { Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';

export function PlaylistLoadingState() {
  return (
    <View className="px-5">
      <View className="mb-5 h-[118px] rounded-[20px] bg-white/10" />
      {[0, 1, 2, 3, 4].map((item) => (
        <View key={item} className="mb-4 h-[54px] flex-row items-center">
          <View className="h-[42px] w-[42px] rounded-[10px] bg-white/10" />
          <View className="ml-3 flex-1">
            <View className="h-4 w-2/3 rounded-full bg-white/10" />
            <View className="mt-2 h-3 w-1/3 rounded-full bg-white/10" />
          </View>
        </View>
      ))}
    </View>
  );
}

type PlaylistErrorStateProps = {
  onRetry?: () => void;
};

export function PlaylistErrorState({ onRetry }: PlaylistErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <AppText className="text-center text-[24px] font-semibold text-white">
        추천 음악을 불러오지 못했어요
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

export function PlaylistEmptyState() {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <AppText className="text-center text-[24px] font-semibold text-white">
        이 위치에 맞는 음악을 찾는 중이에요
      </AppText>
      <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
        관광 모드와 무드를 바꾸면 더 어울리는 추천을 준비할 수 있어요.
      </AppText>
    </View>
  );
}
