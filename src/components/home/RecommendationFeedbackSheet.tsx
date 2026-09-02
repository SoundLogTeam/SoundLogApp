import { Feather } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/AppText";
import { useDismissibleBottomSheetGesture } from "@/hooks/useBottomSheetGesture";
import {
  RECOMMENDATION_FEEDBACK_MAX_LENGTH,
  type RecommendationFeedbackRating,
  type RecommendationFeedbackSubject,
  type RecommendationFeedbackSubmission,
} from "@/utils/recommendationFeedback";

export type {
  RecommendationFeedbackRating,
  RecommendationFeedbackSubmission,
} from "@/utils/recommendationFeedback";

type RecommendationFeedbackSheetProps = {
  contextLabel?: string;
  onClose: () => void;
  onSubmit: (submission: RecommendationFeedbackSubmission) => void;
  recommendationReason?: string;
  subject: RecommendationFeedbackSubject;
  visible: boolean;
};

const ratings: RecommendationFeedbackRating[] = [1, 2, 3, 4, 5];

const subjectCopy: Record<
  RecommendationFeedbackSubject,
  { description: string; title: string }
> = {
  music: {
    description: "다음 음악 추천을 더 잘 맞추는 데 반영할게요.",
    title: "이번 음악 추천은 어땠나요?",
  },
  photo: {
    description: "다음 추천사진을 더 잘 고르는 데 반영할게요.",
    title: "이번 추천사진은 어땠나요?",
  },
};

export function RecommendationFeedbackSheet({
  contextLabel,
  onClose,
  onSubmit,
  recommendationReason,
  subject,
  visible,
}: RecommendationFeedbackSheetProps) {
  const insets = useSafeAreaInsets();
  const [isOpinionVisible, setIsOpinionVisible] = useState(false);
  const [opinion, setOpinion] = useState("");
  const [rating, setRating] = useState<RecommendationFeedbackRating>();
  const isSubmittingRef = useRef(false);
  const { panHandlers, translateY } = useDismissibleBottomSheetGesture({
    onDismiss: onClose,
    visible,
  });
  const copy = subjectCopy[subject];

  useEffect(() => {
    if (!visible) {
      return;
    }

    setIsOpinionVisible(false);
    setOpinion("");
    setRating(undefined);
    isSubmittingRef.current = false;
  }, [visible]);

  const handleSubmit = () => {
    if (!rating || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    onSubmit({ opinion, rating });
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          accessibilityLabel="추천 피드백 닫기"
          className="absolute inset-0 bg-black/68"
          onPress={onClose}
        />
        <Animated.View
          className="rounded-t-[30px] border border-white/12 bg-[#0B1020] px-5 pt-3"
          style={{
            maxHeight: "92%",
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

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mt-2 flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <AppText className="text-[11px] font-semibold text-soundlog-lime">
                  추천 피드백
                </AppText>
                <AppText className="mt-1 text-[22px] font-semibold leading-8 text-white">
                  {copy.title}
                </AppText>
                <AppText className="mt-2 text-sm leading-6 text-white/58">
                  {contextLabel ? `${contextLabel}에 어울리는 ` : ""}
                  {copy.description}
                </AppText>
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

            {recommendationReason ? (
              <View className="mt-4 rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3">
                <AppText
                  className="text-xs leading-5 text-white/58"
                  numberOfLines={3}
                >
                  {recommendationReason}
                </AppText>
              </View>
            ) : null}

            <View className="mt-6">
              <View className="flex-row items-center justify-between">
                {ratings.map((value) => {
                  const selected = Boolean(rating && value <= rating);

                  return (
                    <Pressable
                      accessibilityLabel={`${value}점`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: rating === value }}
                      className={`h-12 w-12 items-center justify-center rounded-full border ${
                        selected
                          ? "border-soundlog-lime bg-soundlog-lime/15"
                          : "border-white/12 bg-white/[0.06]"
                      }`}
                      key={value}
                      onPress={() => setRating(value)}
                    >
                      <Feather
                        color={selected ? "#B7E628" : "rgba(255,255,255,0.42)"}
                        name="star"
                        size={23}
                      />
                    </Pressable>
                  );
                })}
              </View>
              <AppText
                accessibilityLiveRegion="polite"
                className={`mt-3 text-center text-sm font-semibold ${
                  rating ? "text-soundlog-lime" : "text-white/42"
                }`}
              >
                {rating ? `${rating}점 선택됨` : "별점을 선택해주세요"}
              </AppText>
            </View>

            {isOpinionVisible ? (
              <View className="mt-5">
                <View className="flex-row items-center justify-between">
                  <AppText className="text-sm font-semibold text-white">
                    의견
                  </AppText>
                  <AppText className="text-xs text-white/42">
                    {opinion.length}/{RECOMMENDATION_FEEDBACK_MAX_LENGTH}
                  </AppText>
                </View>
                <TextInput
                  accessibilityLabel="추천 의견 입력"
                  className="mt-3 min-h-[104px] rounded-[18px] border border-white/12 bg-white/[0.06] px-4 py-3 text-[15px] leading-6 text-white"
                  maxLength={RECOMMENDATION_FEEDBACK_MAX_LENGTH}
                  multiline
                  onChangeText={setOpinion}
                  placeholder="좋았던 점이나 아쉬웠던 점을 알려주세요."
                  placeholderTextColor="rgba(255,255,255,0.38)"
                  textAlignVertical="top"
                  value={opinion}
                />
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="mt-5 min-h-11 flex-row items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-4"
                onPress={() => setIsOpinionVisible(true)}
              >
                <Feather
                  color="rgba(255,255,255,0.68)"
                  name="edit-3"
                  size={16}
                />
                <AppText className="ml-2 text-sm font-semibold text-white/68">
                  의견도 남길래요
                </AppText>
              </Pressable>
            )}

            <Pressable
              accessibilityLabel={
                isOpinionVisible ? "별점과 의견 보내기" : "별점만 보내기"
              }
              accessibilityRole="button"
              accessibilityState={{ disabled: !rating }}
              className={`mt-5 min-h-14 items-center justify-center rounded-xl border ${
                rating
                  ? "border-soundlog-lime/45 bg-soundlog-action"
                  : "border-white/10 bg-white/[0.06]"
              }`}
              disabled={!rating}
              onPress={handleSubmit}
            >
              <AppText
                className={`font-semibold ${
                  rating ? "text-soundlog-inverse" : "text-white/38"
                }`}
              >
                {isOpinionVisible ? "별점과 의견 보내기" : "별점만 보내기"}
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              className="mt-2 min-h-11 items-center justify-center"
              onPress={onClose}
            >
              <AppText className="text-sm font-medium text-white/42">
                건너뛰기
              </AppText>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
