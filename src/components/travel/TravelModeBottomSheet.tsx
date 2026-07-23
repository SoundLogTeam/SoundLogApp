import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import type { TravelMode } from '@/types/domain';

import { travelModeOptions } from './travelData';

type TravelModeBottomSheetProps = {
  onClose: () => void;
  onSelectMode: (mode: TravelMode) => void;
  onStart: () => void;
  selectedMode?: TravelMode;
  submitLabel?: string;
  visible: boolean;
};

export function TravelModeBottomSheet({
  onClose,
  onSelectMode,
  onStart,
  selectedMode,
  submitLabel = '여행 시작',
  visible,
}: TravelModeBottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end bg-black/55">
        <Pressable accessibilityRole="button" className="flex-1" onPress={onClose} />
        <View
          className="rounded-t-[30px] border border-white/10 bg-[#0B1020] px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 18) }}
        >
          <View className="mx-auto h-1.5 w-11 rounded-full bg-white/25" />

          <View className="mt-5 flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <AppText className="text-[22px] font-semibold text-white">여행 모드 선택</AppText>
              <AppText className="mt-2 text-sm leading-6 text-white">
                지금의 여행 맥락을 고르면 음악 추천과 리캡이 같은 로그로 묶여요.
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="여행 모드 선택 닫기"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              onPress={onClose}
            >
              <Feather color="#fff" name="x" size={18} />
            </Pressable>
          </View>

          <View className="mt-6 flex-row flex-wrap gap-2.5">
            {travelModeOptions.map((mode) => {
              const selected = selectedMode === mode.value;

              return (
                <Pressable
                  key={mode.value}
                  accessibilityRole="button"
                  className={`min-h-[46px] flex-row items-center rounded-full border px-4 ${
                    selected
                      ? 'border-soundlog-lime bg-soundlog-lime'
                      : 'border-white/10 bg-white/10'
                  }`}
                  onPress={() => onSelectMode(mode.value)}
                >
                  <AppText className="mr-2 text-base">{mode.icon}</AppText>
                  <AppText
                    className={`text-sm font-semibold ${
                      selected ? 'text-soundlog-inverse' : 'text-white'
                    }`}
                  >
                    {mode.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            className={`mt-7 h-14 items-center justify-center rounded-full ${
              selectedMode ? 'bg-soundlog-lime' : 'bg-white/12'
            }`}
            disabled={!selectedMode}
            onPress={onStart}
          >
            <AppText
              className={`text-base font-semibold ${
                selectedMode ? 'text-soundlog-inverse' : 'text-white/38'
              }`}
            >
              {submitLabel}
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
