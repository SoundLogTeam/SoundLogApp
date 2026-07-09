import { Feather } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { RefObject } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { LocationPermissionBanner } from '@/components/moment-capture/LocationPermissionBanner';
import { MomentSaveState } from '@/components/moment-capture/MomentSaveState';

type LocationStatus = 'denied' | 'granted' | 'idle' | 'loading' | 'unavailable';

type CameraCaptureViewProps = {
  cameraRef: RefObject<CameraView | null>;
  errorMessage?: string;
  isCapturing: boolean;
  locationStatus: LocationStatus;
  onCapture: () => void;
  onClose: () => void;
  onSkipPhoto: () => void;
};

export function CameraCaptureView({
  cameraRef,
  errorMessage,
  isCapturing,
  locationStatus,
  onCapture,
  onClose,
  onSkipPhoto,
}: CameraCaptureViewProps) {
  return (
    <View className="flex-1 overflow-hidden bg-black">
      <CameraView ref={cameraRef} facing="back" mode="picture" style={StyleSheet.absoluteFill} />

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
          지금 듣는 음악과 장소를 함께 저장해요.
        </AppText>
        <MomentSaveState message={errorMessage} type="error" />
        <Pressable
          accessibilityLabel="순간 촬영"
          accessibilityRole="button"
          className="mt-5 h-[78px] w-[78px] items-center justify-center rounded-full border-4 border-white/45 bg-white"
          disabled={isCapturing}
          onPress={onCapture}
          style={{ opacity: isCapturing ? 0.7 : 1 }}
        >
          {isCapturing ? (
            <ActivityIndicator color="#050916" />
          ) : (
            <View className="h-[58px] w-[58px] rounded-full bg-white" />
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="mt-5 min-h-11 rounded-full border border-white/20 bg-black/35 px-5 py-3"
          disabled={isCapturing}
          onPress={onSkipPhoto}
        >
          <AppText className="text-sm font-semibold text-white/80">
            사진 없이 기록하기
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}
