import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { momentLogApi } from '@/api/momentLogApi';
import { syncRecommendationEvent } from '@/api/recommendationEventApi';
import { AppText } from '@/components/AppText';
import { CameraCaptureView } from '@/components/moment-capture/CameraCaptureView';
import { CameraPermissionState } from '@/components/moment-capture/CameraPermissionState';
import {
  MomentReviewPanel,
  type MomentReviewPanelHandle,
} from '@/components/moment-capture/MomentReviewPanel';
import { Screen } from '@/components/Screen';
import { useHomeFilterStore } from '@/store/homeFilterStore';
import {
  useMomentLogStore,
  type MomentLogCreateQueuePayload,
} from '@/store/momentLogStore';
import { usePlayerStore } from '@/store/playerStore';
import { useRecommendationEventStore } from '@/store/recommendationEventStore';
import { useTravelSessionStore } from '@/store/travelSessionStore';
import { GeoPoint, MomentLog } from '@/types/domain';
import { getForegroundLocationWithTimeout } from '@/utils/location';
import { getMoodTagsFromFilter } from '@/utils/moodTags';
import { persistMomentPhoto } from '@/utils/momentFiles';
import { pickMomentPhotoFromLibrary } from '@/utils/momentPhotoPicker';
import { formatPlaceLabel } from '@/utils/placeLabel';
import { createRecommendationEventContext } from '@/utils/recommendationEventContext';

type LocationStatus = 'denied' | 'granted' | 'idle' | 'loading' | 'unavailable';
type MomentCaptureReturnTo = 'map' | 'music' | 'recap';

const fallbackRecommendedPhotoUrls = [
  'https://tong.visitkorea.or.kr/cms/resource_photo/96/4033396_image2_1.jpg',
  'https://tong.visitkorea.or.kr/cms2/website/76/2012176.jpg',
  'https://tong.visitkorea.or.kr/cms/resource_photo/85/2613985_image2_1.jpg',
];

function resolveReturnPath(returnTo?: string | string[]) {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;

  if (value === 'recap') {
    return '/recap';
  }

  if (value === 'music') {
    return '/music';
  }

  return '/';
}

export function MomentCaptureScreen() {
  const { returnTo } = useLocalSearchParams<{ returnTo?: MomentCaptureReturnTo }>();
  const cameraRef = useRef<CameraView>(null);
  const reviewPanelRef = useRef<MomentReviewPanelHandle>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturedAt, setCapturedAt] = useState<string>();
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewMoodTags, setReviewMoodTags] = useState<MomentLog['moodTags']>(
    [],
  );
  const [reviewNote, setReviewNote] = useState('');
  const [reviewPlaceName, setReviewPlaceName] = useState('');
  const [shouldSaveMusic, setShouldSaveMusic] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  const addLog = useMomentLogStore((state) => state.addLog);
  const queueCreate = useMomentLogStore((state) => state.queueCreate);
  const resolveLocalLog = useMomentLogStore((state) => state.resolveLocalLog);
  const updateLog = useMomentLogStore((state) => state.updateLog);
  const addRecommendationEvent = useRecommendationEventStore(
    (state) => state.addEvent,
  );
  const { selectedMoodFilter } = useHomeFilterStore();
  const { currentTrack, playlistId } = usePlayerStore();
  const {
    currentLocation,
    currentPlace,
    selectedMode,
    session,
    setLocation,
  } = useTravelSessionStore();

  const moodTags = useMemo(
    () => getMoodTagsFromFilter(selectedMoodFilter),
    [selectedMoodFilter],
  );

  const prepareReview = (photoUri?: string) => {
    setCapturedAt(new Date().toISOString());
    setCapturedPhotoUri(photoUri);
    setReviewPlaceName(
      currentPlace?.title ?? formatPlaceLabel(currentLocation),
    );
    setReviewMoodTags(moodTags);
    setReviewNote('');
    setShouldSaveMusic(Boolean(currentTrack));
    setIsReviewing(true);
    setErrorMessage(undefined);
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
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
          const fallbackLocation =
            useTravelSessionStore.getState().currentLocation;
          setLocationStatus(fallbackLocation ? 'granted' : 'unavailable');
        }
      } catch {
        if (isMounted) {
          const fallbackLocation =
            useTravelSessionStore.getState().currentLocation;
          setLocationStatus(fallbackLocation ? 'granted' : 'unavailable');
        }
      }
    }

    void loadLocation();

    return () => {
      isMounted = false;
    };
  }, [setLocation]);

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

      prepareReview(photo.uri);
    } catch {
      setErrorMessage('사진을 촬영하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsCapturing(false);
    }
  };
  const handlePickGallery = async () => {
    if (isPickingPhoto || isCapturing) {
      return;
    }

    setIsPickingPhoto(true);
    setErrorMessage(undefined);

    try {
      const result = await pickMomentPhotoFromLibrary();

      if (result.status === 'selected') {
        prepareReview(result.uri);
        return;
      }

      if (result.status === 'permission-denied') {
        setErrorMessage('갤러리 사진을 사용하려면 사진 보관함 권한이 필요해요.');
        return;
      }

      if (result.status === 'unavailable') {
        setErrorMessage('갤러리를 열지 못했어요. 다시 시도해주세요.');
      }
    } finally {
      setIsPickingPhoto(false);
    }
  };
  const handleUseRecommendedPhoto = () => {
    const recommendedPhotoUri =
      currentPlace?.imageUrl ??
      fallbackRecommendedPhotoUrls[
        Math.abs((currentPlace?.id ?? currentPlace?.title ?? 'soundlog').length) %
          fallbackRecommendedPhotoUrls.length
      ];

    prepareReview(recommendedPhotoUri);
  };

  const handleSave = async () => {
    if (!isReviewing || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(undefined);

    try {
      const id = `moment-${Date.now()}`;
      const locationSnapshot: GeoPoint | undefined = currentLocation;
      const activeSessionId = session.status === 'active' ? session.id : undefined;
      let photoSourceUri = capturedPhotoUri;

      if (capturedPhotoUri) {
        const capturePromise = reviewPanelRef.current?.capturePhoto();
        const capturedCanvasUri = capturePromise
          ? await capturePromise.catch(() => undefined)
          : undefined;

        photoSourceUri = capturedCanvasUri ?? capturedPhotoUri;
      }

      const photoUri = photoSourceUri
        ? await persistMomentPhoto(photoSourceUri, id)
        : undefined;
      const createdAt = capturedAt ?? new Date().toISOString();
      const placeName =
        reviewPlaceName.trim() || formatPlaceLabel(locationSnapshot);
      const note = reviewNote.trim() || undefined;
      const trackSnapshot = shouldSaveMusic ? currentTrack : undefined;
      const recommendationContext = createRecommendationEventContext({
        placeCategory: currentPlace?.category,
        placeId: currentPlace?.id,
        placeName,
        travelMode: selectedMode,
      });
      const localLog: MomentLog = {
        createdAt,
        id,
        location: locationSnapshot,
        moodTags: reviewMoodTags,
        note,
        placeCategory: currentPlace?.category,
        placeId: currentPlace?.id,
        photoUri,
        placeName,
        sessionId: activeSessionId,
        source: 'camera',
        syncStatus: 'pending',
        track: trackSnapshot,
        travelMode: selectedMode,
      };
      const createPayload: MomentLogCreateQueuePayload = {
        createdAt,
        location: locationSnapshot,
        moodTags: reviewMoodTags,
        note,
        photoUri,
        placeCategory: currentPlace?.category,
        placeId: currentPlace?.id,
        placeName,
        sessionId: activeSessionId,
        track: trackSnapshot,
        travelMode: selectedMode,
      };

      addLog(localLog);
      queueCreate(id, createPayload);
      syncRecommendationEvent(
        addRecommendationEvent({
          context: recommendationContext,
          playlistId,
          trackId: trackSnapshot?.id,
          type: 'moment_log_saved',
          value: localLog.syncStatus,
        }),
      );

      void momentLogApi
        .createMomentLog({
          ...createPayload,
          idempotencyKey: id,
        })
        .then((serverLog) => {
          if (!serverLog) {
            updateLog(id, { syncStatus: 'local' });
            return;
          }

          resolveLocalLog(id, serverLog);
        })
        .catch(() => {
          updateLog(id, { syncStatus: 'failed' });
          syncRecommendationEvent(
            addRecommendationEvent({
              context: recommendationContext,
              playlistId,
              trackId: trackSnapshot?.id,
              type: 'moment_log_sync_failed',
              value: 'network_error',
            }),
          );
        });

      router.replace(resolveReturnPath(returnTo) as never);
    } catch {
      setErrorMessage('이 리캡을 저장하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isReviewing) {
    return (
      <MomentReviewPanel
        ref={reviewPanelRef}
        capturedAt={capturedAt}
        errorMessage={errorMessage}
        includeMusic={shouldSaveMusic}
        isSaving={isSaving}
        location={currentLocation}
        moodTags={reviewMoodTags}
        note={reviewNote}
        onChangeMoodTags={setReviewMoodTags}
        onChangeNote={setReviewNote}
        onChangePlaceName={setReviewPlaceName}
        onRetake={() => {
          setCapturedAt(undefined);
          setCapturedPhotoUri(undefined);
          setIsReviewing(false);
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

  if (Platform.OS === 'web') {
    return (
      <Screen contentClassName="items-center justify-center px-8">
        <View className="rounded-[24px] border border-white/10 bg-white/10 p-6">
          <AppText className="text-center text-[24px] font-semibold text-white">
            앱에서 사용할 수 있어요
          </AppText>
          <AppText className="mt-3 text-center text-sm leading-6 text-white/60">
            카메라 촬영은 모바일 앱에서 사용할 수 있어요. 대신 사진 없이 음악과
            장소만 먼저 리캡으로 남길 수 있습니다.
          </AppText>
          <Pressable
            accessibilityRole="button"
            className="mt-7 rounded-full bg-white px-5 py-3"
            onPress={() => prepareReview()}
          >
            <AppText className="text-center font-semibold text-[#050916]">
              사진 없이 기록하기
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="mt-3 rounded-full border border-white/15 px-5 py-3"
            onPress={() => router.back()}
          >
            <AppText className="text-center font-semibold text-white/80">
              돌아가기
            </AppText>
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
          onSkipPhoto={() => prepareReview()}
          status={cameraPermission?.status}
        />
      </Screen>
    );
  }

  return (
    <CameraCaptureView
      cameraRef={cameraRef}
      errorMessage={errorMessage}
      isCapturing={isCapturing}
      isPickingPhoto={isPickingPhoto}
      locationStatus={locationStatus}
      onCapture={handleCapture}
      onClose={() => router.back()}
      onPickGallery={() => void handlePickGallery()}
      onSkipPhoto={() => prepareReview()}
      onUseRecommendedPhoto={handleUseRecommendedPhoto}
    />
  );
}
