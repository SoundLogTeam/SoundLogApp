import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { useDismissibleBottomSheetGesture } from '@/hooks/useBottomSheetGesture';

export type RecommendationFeedbackRating = 'great' | 'not_for_me' | 'okay';

type RecommendationFeedbackSheetProps = {
  onClose: () => void;
  onSubmit: (rating: RecommendationFeedbackRating, moodFilter?: string) => void;
  playlistReason?: string;
  regionName?: string;
  visible: boolean;
};

const moodOptions = [
  { icon: '🌿', label: '잔잔한' },
  { icon: '⚡', label: '신나는' },
  { icon: '🌙', label: '감성적인' },
  { icon: '🌊', label: '시원한' },
] as const;

const ratingOptions: Array<{
  description: string;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: RecommendationFeedbackRating;
}> = [
  {
    description: '지금 장소와 분위기에 잘 맞아요',
    icon: 'thumbs-up',
    label: '딱 좋아요',
    value: 'great',
  },
  {
    description: '들어볼 만하지만 조금 더 맞출 수 있어요',
    icon: 'minus-circle',
    label: '괜찮아요',
    value: 'okay',
  },
  {
    description: '다른 분위기의 추천을 받고 싶어요',
    icon: 'refresh-cw',
    label: '다른 느낌이 좋아요',
    value: 'not_for_me',
  },
];

export function RecommendationFeedbackSheet({
  onClose,
  onSubmit,
  playlistReason,
  regionName,
  visible,
}: RecommendationFeedbackSheetProps) {
  const insets = useSafeAreaInsets();
  const [isChoosingMood, setIsChoosingMood] = useState(false);
  const { panHandlers, translateY } = useDismissibleBottomSheetGesture({
    onDismiss: onClose,
    visible,
  });

  useEffect(() => {
    if (visible) {
      setIsChoosingMood(false);
    }
  }, [visible]);

  const handleSelectRating = (rating: RecommendationFeedbackRating) => {
    if (rating === 'not_for_me') {
      setIsChoosingMood(true);
      return;
    }

    onSubmit(rating);
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityLabel="추천 피드백 닫기"
          className="absolute inset-0 bg-black/68"
          onPress={onClose}
        />
        <Animated.View
          className="rounded-t-[30px] border border-white/12 bg-[#0B1020] px-5 pt-3"
          style={{
            paddingBottom: Math.max(insets.bottom, 18),
            transform: [{ translateY }],
          }}
        >
          <View
            {...panHandlers}
            accessible
            accessibilityHint="아래로 드래그해 닫을 수 있습니다."
            accessibilityLabel="추천 피드백 시트 핸들"
            className="min-h-9 items-center justify-center"
          >
            <View className="h-[5px] w-11 rounded-full bg-white/35" />
          </View>

          <View className="mt-2 flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <AppText className="text-[11px] font-semibold text-soundlog-lime">
                추천 피드백
              </AppText>
              <AppText className="mt-1 text-[22px] font-semibold leading-8 text-white">
                {isChoosingMood ? '어떤 느낌으로 바꿔볼까요?' : '이번 추천 어땠나요?'}
              </AppText>
              {!isChoosingMood && regionName ? (
                <AppText className="mt-2 text-sm leading-6 text-white/58" numberOfLines={2}>
                  {regionName}의 사운드트랙을 더 잘 맞추는 데 반영할게요.
                </AppText>
              ) : null}
            </View>
            <Pressable
              accessibilityLabel="추천 피드백 닫기"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              onPress={onClose}
            >
              <Feather color="#FFFFFF" name="x" size={18} />
            </Pressable>
          </View>

          {playlistReason && !isChoosingMood ? (
            <View className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3">
              <AppText className="text-xs leading-5 text-white/58" numberOfLines={3}>
                {playlistReason}
              </AppText>
            </View>
          ) : null}

          {isChoosingMood ? (
            <>
              <View className="mt-5 flex-row flex-wrap gap-2.5">
                {moodOptions.map((option) => (
                  <Pressable
                    accessibilityLabel={`${option.label} 무드로 다시 추천`}
                    accessibilityRole="button"
                    className="min-h-12 flex-row items-center rounded-full border border-white/12 bg-white/[0.07] px-4"
                    key={option.label}
                    onPress={() => onSubmit('not_for_me', option.label)}
                  >
                    <AppText className="mr-2 text-base">{option.icon}</AppText>
                    <AppText className="text-sm font-semibold text-white">
                      더 {option.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                className="mt-5 min-h-12 items-center justify-center rounded-full border border-white/12"
                onPress={() => onSubmit('not_for_me')}
              >
                <AppText className="text-sm font-semibold text-white/68">
                  무드 변경 없이 보내기
                </AppText>
              </Pressable>
            </>
          ) : (
            <View className="mt-5 gap-2.5">
              {ratingOptions.map((option) => (
                <Pressable
                  accessibilityRole="button"
                  className="min-h-[62px] flex-row items-center rounded-[18px] border border-white/10 bg-white/[0.06] px-4"
                  key={option.value}
                  onPress={() => handleSelectRating(option.value)}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    <Feather color="#B7E628" name={option.icon} size={18} />
                  </View>
                  <View className="ml-3 min-w-0 flex-1">
                    <AppText className="text-sm font-semibold text-white">{option.label}</AppText>
                    <AppText className="mt-1 text-xs leading-5 text-white/48">
                      {option.description}
                    </AppText>
                  </View>
                  <Feather color="rgba(255,255,255,0.38)" name="chevron-right" size={18} />
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            accessibilityRole="button"
            className="mt-4 min-h-11 items-center justify-center"
            onPress={onClose}
          >
            <AppText className="text-sm font-medium text-white/42">건너뛰기</AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
