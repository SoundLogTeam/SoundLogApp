import { Feather } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import { RefObject } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/AppText";
import { LocationPermissionBanner } from "@/components/moment-capture/LocationPermissionBanner";
import { MomentSaveState } from "@/components/moment-capture/MomentSaveState";

type LocationStatus = "denied" | "granted" | "idle" | "loading" | "unavailable";

type CameraCaptureViewProps = {
  cameraRef: RefObject<CameraView | null>;
  errorMessage?: string;
  isCapturing: boolean;
  isPickingPhoto?: boolean;
  locationStatus: LocationStatus;
  onCapture: () => void;
  onClose: () => void;
  onPickGallery: () => void;
  onSkipPhoto: () => void;
  onUseRecommendedPhoto: () => void;
};

export function CameraCaptureView({
  cameraRef,
  errorMessage,
  isCapturing,
  isPickingPhoto = false,
  locationStatus,
  onCapture,
  onClose,
  onPickGallery,
  onSkipPhoto,
  onUseRecommendedPhoto,
}: CameraCaptureViewProps) {
  const controlsDisabled = isCapturing || isPickingPhoto;

  return (
    <View className="flex-1 overflow-hidden bg-black">
      <CameraView
        ref={cameraRef}
        facing="back"
        mode="picture"
        style={StyleSheet.absoluteFill}
      />

      <View className="absolute left-0 right-0 top-0 px-5 pt-16">
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="카메라 닫기"
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-full bg-black/35"
            onPress={onClose}
          >
            <Feather color="#fff" name="x" size={22} />
          </Pressable>
          <LocationPermissionBanner status={locationStatus} />
        </View>
      </View>

      <View className="absolute bottom-12 left-0 right-0 items-center px-8">
        <AppText className="mb-6 text-center text-sm leading-6 text-white/75">
          지금 듣는 음악과 장소를 리캡으로 남겨요.
        </AppText>
        <MomentSaveState message={errorMessage} type="error" />
        <View className="mt-5 w-full flex-row items-end justify-between">
          <CameraToolButton
            disabled={controlsDisabled}
            icon="image"
            label="갤러리"
            onPress={onPickGallery}
          />
          <Pressable
            accessibilityLabel="리캡 사진 촬영"
            accessibilityRole="button"
            className="h-[82px] w-[82px] items-center justify-center rounded-full border-4 border-white/45 bg-white"
            disabled={controlsDisabled}
            onPress={onCapture}
            style={{ opacity: controlsDisabled ? 0.7 : 1 }}
          >
            {isCapturing || isPickingPhoto ? (
              <ActivityIndicator color="#050916" />
            ) : (
              <View className="h-[60px] w-[60px] rounded-full bg-white" />
            )}
          </Pressable>
          <CameraToolButton
            disabled={controlsDisabled}
            icon="star"
            label="추천사진"
            onPress={onUseRecommendedPhoto}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          className="mt-5 min-h-11 rounded-full border border-white/20 bg-black/35 px-5 py-3"
          disabled={controlsDisabled}
          onPress={onSkipPhoto}
        >
          <AppText className="text-sm font-semibold text-white/80">
            사진 없이 리캡 만들기
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

function CameraToolButton({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="min-w-[86px] items-center gap-2"
      disabled={disabled}
      onPress={onPress}
      style={{ opacity: disabled ? 0.58 : 1 }}
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-full border border-white/18 bg-black/45">
        <Feather color="#fff" name={icon} size={20} />
      </View>
      <AppText className="text-xs font-semibold text-white/82">{label}</AppText>
    </Pressable>
  );
}
