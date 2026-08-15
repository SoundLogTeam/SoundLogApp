import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError } from '@/api/client';
import { communityApi } from '@/api/communityApi';
import { AppText } from '@/components/AppText';
import type { ModerationTarget } from '@/types/domain';

type ReportReason = 'inappropriate' | 'other' | 'safety' | 'spam';

const reasons: Array<{ label: string; value: ReportReason }> = [
  { label: '부적절한 콘텐츠', value: 'inappropriate' },
  { label: '괴롭힘 또는 안전 문제', value: 'safety' },
  { label: '스팸 또는 홍보', value: 'spam' },
  { label: '기타', value: 'other' },
];

type ReportContentSheetProps = {
  onClose: () => void;
  onReported?: () => void;
  target?: ModerationTarget;
  title?: string;
  visible: boolean;
};

export function ReportContentSheet({
  onClose,
  onReported,
  target,
  title = '콘텐츠 신고',
  visible,
}: ReportContentSheetProps) {
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState<ReportReason>('inappropriate');

  useEffect(() => {
    if (visible) {
      setDetails('');
      setErrorMessage(undefined);
      setReason('inappropriate');
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!target || isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage(undefined);

    try {
      await communityApi.reportTarget({
        ...target,
        details: details.trim() || undefined,
        reason,
      });
      onReported?.();
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : '신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          accessibilityLabel="신고 닫기"
          className="absolute inset-0 bg-black/70"
          onPress={onClose}
        />
        <View
          className="rounded-t-[28px] border-t border-white/15 bg-[#111522] px-5 pt-5"
          style={{ paddingBottom: Math.max(insets.bottom, 18) }}
        >
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-xl font-semibold text-white">{title}</AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/55">
                신고 내용은 운영자에게 전달되며 24시간 안에 검토합니다.
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="신고 화면 닫기"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center"
              onPress={onClose}
            >
              <Feather color="rgba(255,255,255,0.7)" name="x" size={20} />
            </Pressable>
          </View>

          <View className="mt-5 gap-2">
            {reasons.map((option) => {
              const selected = option.value === reason;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className={`min-h-12 flex-row items-center rounded-xl border px-4 ${
                    selected
                      ? 'border-soundlog-lime bg-soundlog-lime/10'
                      : 'border-white/10 bg-white/5'
                  }`}
                  key={option.value}
                  onPress={() => setReason(option.value)}
                >
                  <AppText className={selected ? 'text-soundlog-lime' : 'text-white/70'}>
                    {option.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            className="mt-4 min-h-[92px] rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            editable={!isSubmitting}
            maxLength={500}
            multiline
            onChangeText={setDetails}
            placeholder="필요하면 상황을 자세히 적어주세요."
            placeholderTextColor="rgba(255,255,255,0.35)"
            textAlignVertical="top"
            value={details}
          />

          {errorMessage ? (
            <AppText className="mt-3 text-xs leading-5 text-[#FFB3B3]">{errorMessage}</AppText>
          ) : null}

          <Pressable
            accessibilityRole="button"
            className="mt-5 min-h-[52px] items-center justify-center rounded-full bg-soundlog-lime px-5"
            disabled={isSubmitting || !target}
            onPress={() => void handleSubmit()}
            style={{ opacity: isSubmitting || !target ? 0.55 : 1 }}
          >
            <AppText className="text-sm font-semibold text-soundlog-inverse">
              {isSubmitting ? '접수 중' : '신고 접수'}
            </AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
