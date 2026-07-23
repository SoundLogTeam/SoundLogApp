import { Feather } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";

import { AppText } from "@/components/AppText";

type EndTravelConfirmModalProps = {
  isConfirming?: boolean;
  momentCount: number;
  onCancel: () => void;
  onConfirm: () => void;
  visible: boolean;
};

export function EndTravelConfirmModal({
  isConfirming = false,
  momentCount,
  onCancel,
  onConfirm,
  visible,
}: EndTravelConfirmModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View className="flex-1 items-center justify-center bg-black/62 px-6">
        <View className="w-full max-w-[360px] rounded-[28px] border border-white/12 bg-[#101626] p-5">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-soundlog-lime">
            <Feather color="#090515" name="check-circle" size={22} />
          </View>

          <AppText className="mt-5 text-[22px] font-semibold text-white">
            여행을 종료할까요?
          </AppText>
          <AppText className="mt-2 text-sm leading-6 text-white/60">
            지금까지 저장한 리캡 {momentCount}개가 하나의 여행 로그로 묶여요.
          </AppText>

          <View className="mt-6 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-full border border-white/15"
              disabled={isConfirming}
              onPress={onCancel}
              style={{ opacity: isConfirming ? 0.55 : 1 }}
            >
              <AppText className="text-sm font-semibold text-[#E5E7EB]">
                취소
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="h-12 flex-1 items-center justify-center rounded-full bg-soundlog-lime"
              disabled={isConfirming}
              onPress={onConfirm}
              style={{ opacity: isConfirming ? 0.7 : 1 }}
            >
              <AppText className="text-sm font-semibold text-soundlog-inverse">
                {isConfirming ? "정리 중" : "종료"}
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
