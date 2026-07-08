import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { momentLogApi } from '@/api/momentLogApi';
import { AppText } from '@/components/AppText';
import { CameraCaptureView } from '@/components/moment-capture/CameraCaptureView';
import { CameraPermissionState } from '@/components/moment-capture/CameraPermissionState';
import { MomentReviewPanel } from '@/components/moment-capture/MomentReviewPanel';
import { Screen } from '@/components/Screen';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import { useMomentLogStore } from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { GeoPoint, MomentLog } from '@/types/domain';
import { getForegroundLocationWithTimeout } from '@/utils/location';
import { getMoodTagsFromFilter } from '@/utils/moodTags';
import { persistMomentPhoto } from '@/utils/momentFiles';
import { formatPlaceLabel } from '@/utils/placeLabel';

type LocationStatus = 'denied' | 'granted' | 'idle' | 'loading' | 'unavailable';

export function MomentCaptureScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [reviewMoodTags, setReviewMoodTags] = useState<MomentLog['moodTags']>([]);
  const [reviewPlaceName, setReviewPlaceName] = useState('');
  const [shouldSaveMusic, setShouldSaveMusic] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  const addLog = useMomentLogStore((state) => state.addLog);
  const removeLog = useMomentLogStore((state) => state.removeLog);
  const { selectedMoodFilter } = useHomeFilterStore();
  const { currentTrack } = usePlayerStore();
  const { currentLocation, currentPlace, selectedMode, session, setLocation, startSession } =
    useTravelSessionStore();

  const moodTags = useMemo(() => getMoodTagsFromFilter(selectedMoodFilter), [selectedMoodFilter]);

  useEffect(() => {
    if (Platform.OS === 'web' || session.status !== 'active') {
      return;
    }

    let isMounted = true;

    async function loadLocation() {
      setLocationStatus('loading');

      try {
        const location = await getForegroundLocationWithTimeout();

        if (!isMounted) {
          return;
        }

        if (location) {
          setLocation(location);
          setLocationStatus('granted');
        } else {
          const fallbackLocation = useTravelSessionStore.getState().currentLocation;
          setLocationStatus(fallbackLocation ? 'granted' : 'unavailable');
        }
      } catch {
        if (isMounted) {
          const fallbackLocation = useTravelSessionStore.getState().currentLocation;
          setLocationStatus(fallbackLocation ? 'granted' : 'unavailable');
        }
      }
    }

    void loadLocation();

    return () => {
      isMounted = false;
    };
  }, [session.status, setLocation]);

  const handleCapture = async () => {
    if (isCapturing) {
      return;
    }

    setIsCapturing(true);
    setErrorMessage(undefined);

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        exif: false,
        quality: 0.92,
      });

      if (!photo?.uri) {
        throw new Error('capture_failed');
      }

      setCapturedPhotoUri(photo.uri);
      setReviewPlaceName(currentPlace?.title ?? formatPlaceLabel(currentLocation));
      setReviewMoodTags(moodTags);
      setShouldSaveMusic(Boolean(currentTrack));
    } catch {
      setErrorMessage('사진을 촬영하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSave = async () => {
    if (!capturedPhotoUri || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(undefined);

    try {
      const id = `moment-${Date.now()}`;
      const locationSnapshot: GeoPoint | undefined = currentLocation;
      const photoUri = await persistMomentPhoto(capturedPhotoUri, id);
      const createdAt = new Date().toISOString();
      const placeName = reviewPlaceName.trim() || formatPlaceLabel(locationSnapshot);
      const trackSnapshot = shouldSaveMusic ? currentTrack : undefined;
      const localLog: MomentLog = {
        createdAt,
        id,
        location: locationSnapshot,
        moodTags: reviewMoodTags,
        placeCategory: currentPlace?.category,
        placeId: currentPlace?.id,
        photoUri,
        placeName,
        sessionId: session.id,
        source: 'camera',
        syncStatus: 'pending',
        track: trackSnapshot,
        travelMode: selectedMode,
      };

      addLog(localLog);
      void momentLogApi
        .createMomentLog({
          createdAt,
          idempotencyKey: id,
          location: locationSnapshot,
          moodTags: reviewMoodTags,
          photoUri,
          placeCategory: currentPlace?.category,
          placeId: currentPlace?.id,
          placeName,
          sessionId: session.id,
          track: trackSnapshot,
          travelMode: selectedMode,
        })
        .then((serverLog) => {
          if (!serverLog) {
            addLog({ ...localLog, syncStatus: 'local' });
            return;
          }

          removeLog(id);
          addLog(serverLog);
        })
        .catch(() => {
          addLog({ ...localLog, syncStatus: 'failed' });
        });

      router.replace('/');
    } catch {
      setErrorMessage('이 순간을 저장하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  if (session.status !== 'active') {
    return (
      <Screen contentClassName="items-center justify-center px-8">
        <View className="rounded-[24px] border border-white/10 bg-white/10 p-6">
          <AppText className="text-center text-[24px] font-semibold text-white">
            여행을 먼저 시작해요
          </AppText>
          <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
            순간 저장은 현재 여행에 연결돼요. 여행을 시작하면 사진, 음악, 장소가 하나의 기록으로 묶입니다.
          </AppText>
          <Pressable
            accessibilityRole="button"
            className="mt-7 rounded-full bg-white px-5 py-3"
            onPress={() => startSession()}
          >
            <AppText className="text-center font-semibold text-[#050916]">
              여행 시작하고 촬영하기
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="mt-3 rounded-full border border-white/15 px-5 py-3"
            onPress={() => router.back()}
          >
            <AppText className="text-center font-semibold text-white/80">돌아가기</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <Screen contentClassName="items-center justify-center px-8">
        <View className="rounded-[24px] border border-white/10 bg-white/10 p-6">
          <AppText className="text-center text-[24px] font-semibold text-white">
            앱에서 사용할 수 있어요
          </AppText>
          <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
            순간 저장 카메라는 모바일 앱에서 카메라 권한과 함께 사용할 수 있어요.
          </AppText>
          <Pressable
            className="mt-7 rounded-full bg-white px-5 py-3"
            onPress={() => router.back()}
          >
            <AppText className="text-center font-semibold text-[#050916]">돌아가기</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  if (!cameraPermission?.granted) {
    return (
      <Screen contentClassName="items-center justify-center">
        <CameraPermissionState
          canAskAgain={cameraPermission?.canAskAgain}
          onRequest={() => void requestCameraPermission()}
          status={cameraPermission?.status}
        />
      </Screen>
    );
  }

  if (capturedPhotoUri) {
    return (
      <MomentReviewPanel
        errorMessage={errorMessage}
        includeMusic={shouldSaveMusic}
        isSaving={isSaving}
        location={currentLocation}
        moodTags={reviewMoodTags}
        onChangeMoodTags={setReviewMoodTags}
        onChangePlaceName={setReviewPlaceName}
        onRetake={() => {
          setCapturedPhotoUri(undefined);
          setErrorMessage(undefined);
        }}
        onSave={handleSave}
        onToggleMusic={() => setShouldSaveMusic((value) => !value)}
        photoUri={capturedPhotoUri}
        placeName={reviewPlaceName}
        track={currentTrack}
        travelMode={selectedMode}
      />
    );
  }

  return (
    <CameraCaptureView
      cameraRef={cameraRef}
      errorMessage={errorMessage}
      isCapturing={isCapturing}
      locationStatus={locationStatus}
      onCapture={handleCapture}
      onClose={() => router.back()}
    />
  );
}
