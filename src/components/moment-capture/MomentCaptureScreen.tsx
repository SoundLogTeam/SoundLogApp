import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";

import { syncRecommendationEvent } from "@/api/recommendationEventApi";
import { momentLogApi } from "@/api/momentLogApi";
import { momentLogQueryKeys } from "@/api/momentLogQueries";
import { recapApi } from "@/api/recapApi";
import { ApiError } from "@/api/client";
import { recapQueryKeys } from "@/api/recapQueries";
import { AppText } from "@/components/AppText";
import {
  RecommendationFeedbackSheet,
  type RecommendationFeedbackSubmission,
} from "@/components/home/RecommendationFeedbackSheet";
import { PageHeader } from "@/components/PageHeader";
import { CameraCaptureView } from "@/components/moment-capture/CameraCaptureView";
import { CameraPermissionState } from "@/components/moment-capture/CameraPermissionState";
import {
  MomentReviewPanel,
  type MomentReviewPanelHandle,
} from "@/components/moment-capture/MomentReviewPanel";
import { Screen } from "@/components/Screen";
import { SectionTitle } from "@/components/SectionTitle";
import { SettingsRow } from "@/components/SettingsRow";
import { useHomeFilterStore } from "@/store/homeFilterStore";
import { usePlayerStore } from "@/store/playerStore";
import { useRecommendationEventStore } from "@/store/recommendationEventStore";
import { useTravelSessionStore } from "@/store/travelSessionStore";
import {
  GeoPoint,
  MomentLog,
  type PlaceContext,
  RecapTemplateId,
  RecapVisibility,
} from "@/types/domain";
import { getForegroundLocationWithTimeout } from "@/utils/location";
import { getMoodTagsFromFilter } from "@/utils/moodTags";
import { pickMomentPhotoFromLibrary } from "@/utils/momentPhotoPicker";
import { createRecommendationEventContext } from "@/utils/recommendationEventContext";
import { createRecommendationFeedbackValue } from "@/utils/recommendationFeedback";
import { getDistanceMeters } from "@/utils/recapTravelSummary";

type LocationStatus = "denied" | "granted" | "idle" | "loading" | "unavailable";
type MomentCaptureReturnTo = "map" | "music" | "recap";

const CAPTURE_PLACE_RADIUS_METERS = 3000;

function resolveReturnPath(returnTo?: string | string[]) {
  const value = Array.isArray(returnTo) ? returnTo[0] : returnTo;

  if (value === "recap") {
    return "/recap";
  }

  if (value === "music") {
    return "/music";
  }

  return "/";
}

export function MomentCaptureScreen() {
  const { returnTo } = useLocalSearchParams<{
    returnTo?: MomentCaptureReturnTo;
  }>();
  const cameraRef = useRef<CameraView>(null);
  const reviewPanelRef = useRef<MomentReviewPanelHandle>(null);
  const queryClient = useQueryClient();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [capturedAt, setCapturedAt] = useState<string>();
  const [saveIdempotencyKey, setSaveIdempotencyKey] = useState<string>();
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewMoodTags, setReviewMoodTags] = useState<MomentLog["moodTags"]>(
    [],
  );
  const [reviewPlaceName, setReviewPlaceName] = useState("");
  const [reviewTemplate, setReviewTemplate] = useState<RecapTemplateId>("film");
  const [recapVisibility, setRecapVisibility] =
    useState<RecapVisibility>("private");
  const [shouldSaveMusic, setShouldSaveMusic] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [isPhotoFeedbackVisible, setIsPhotoFeedbackVisible] = useState(false);
  const [isPhotoFeedbackSubmitted, setIsPhotoFeedbackSubmitted] =
    useState(false);
  const [recommendedPhotoPlace, setRecommendedPhotoPlace] =
    useState<PlaceContext>();

  const addRecommendationEvent = useRecommendationEventStore(
    (state) => state.addEvent,
  );
  const { selectedMoodFilter } = useHomeFilterStore();
  const { currentTrack, playlistId } = usePlayerStore();
  const { currentLocation, currentPlace, selectedMode, session, setLocation } =
    useTravelSessionStore();
  const capturePlace = useMemo(() => {
    if (!currentPlace) {
      return undefined;
    }

    if (!currentLocation) {
      return currentPlace;
    }

    if (!currentPlace.location) {
      return undefined;
    }

    return getDistanceMeters(currentLocation, currentPlace.location) <=
      CAPTURE_PLACE_RADIUS_METERS
      ? currentPlace
      : undefined;
  }, [currentLocation, currentPlace]);

  const moodTags = useMemo(
    () => getMoodTagsFromFilter(selectedMoodFilter),
    [selectedMoodFilter],
  );

  // Synchronous guard against double-submitting a save: `isSaving` is React
  // state, so a second tap that lands before the first commit still reads
  // the stale `false` and slips past the state-based check. A ref updates
  // immediately, before any await, so the second call is rejected in the
  // same tick as the first one claims the lock.
  const isSavingRef = useRef(false);

  const prepareReview = (
    photoUri?: string,
    recommendationPlace?: PlaceContext,
  ) => {
    const nextCapturedAt = new Date().toISOString();

    setCapturedAt(nextCapturedAt);
    setSaveIdempotencyKey(`recap-capture:${nextCapturedAt}`);
    setCapturedPhotoUri(photoUri);
    setReviewPlaceName("");
    setReviewTemplate("film");
    setReviewMoodTags(moodTags);
    setRecapVisibility("private");
    setShouldSaveMusic(Boolean(currentTrack));
    setRecommendedPhotoPlace(recommendationPlace);
    setIsPhotoFeedbackSubmitted(false);
    setIsPhotoFeedbackVisible(false);
    setIsReviewing(true);
    setErrorMessage(undefined);
  };

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    let isMounted = true;

    async function loadLocation() {
      setLocationStatus("loading");

      try {
        const location = await getForegroundLocationWithTimeout();

        if (!isMounted) {
          return;
        }

        if (location) {
          setLocation(location);
          setLocationStatus("granted");
        } else {
          const fallbackLocation =
            useTravelSessionStore.getState().currentLocation;
          setLocationStatus(fallbackLocation ? "granted" : "unavailable");
        }
      } catch {
        if (isMounted) {
          const fallbackLocation =
            useTravelSessionStore.getState().currentLocation;
          setLocationStatus(fallbackLocation ? "granted" : "unavailable");
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
        throw new Error("capture_failed");
      }

      prepareReview(photo.uri);
    } catch {
      setErrorMessage("사진을 촬영하지 못했어요. 다시 시도해주세요.");
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

      if (result.status === "selected") {
        prepareReview(result.uri);
        return;
      }

      if (result.status === "permission-denied") {
        setErrorMessage(
          "갤러리 사진을 사용하려면 사진 보관함 권한이 필요해요.",
        );
        return;
      }

      if (result.status === "unavailable") {
        setErrorMessage("갤러리를 열지 못했어요. 다시 시도해주세요.");
      }
    } finally {
      setIsPickingPhoto(false);
    }
  };
  const handleUseRecommendedPhoto = () => {
    const recommendedPhotoUri = capturePlace?.imageUrl;

    if (!recommendedPhotoUri) {
      setErrorMessage(
        "현재 위치에서 추천할 관광지 사진이 없어요. 직접 촬영하거나 갤러리 사진을 선택해주세요.",
      );
      return;
    }

    prepareReview(recommendedPhotoUri, capturePlace);
  };

  const handleSubmitPhotoFeedback = ({
    opinion,
    rating,
  }: RecommendationFeedbackSubmission) => {
    if (!recommendedPhotoPlace) {
      return;
    }

    syncRecommendationEvent(
      addRecommendationEvent({
        context: createRecommendationEventContext({
          placeCategory: recommendedPhotoPlace.category,
          placeId: recommendedPhotoPlace.id,
          placeName: recommendedPhotoPlace.title,
          source: `recommended-photo:${recommendedPhotoPlace.source}`,
        }),
        type: "recommendation_feedback",
        value: createRecommendationFeedbackValue({
          opinion,
          rating,
          subject: "photo",
        }),
      }),
    );

    setIsPhotoFeedbackSubmitted(true);
    setIsPhotoFeedbackVisible(false);
  };

  const handleSave = async () => {
    if (!isReviewing || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setErrorMessage(undefined);

    try {
      const locationSnapshot: GeoPoint | undefined = currentLocation;
      const activeSessionId =
        session.status === "active" ? session.id : undefined;
      let photoSourceUri = capturedPhotoUri;

      if (capturedPhotoUri) {
        const capturePromise = reviewPanelRef.current?.capturePhoto();
        const capturedCanvasUri = capturePromise
          ? await capturePromise.catch(() => undefined)
          : undefined;

        photoSourceUri = capturedCanvasUri ?? capturedPhotoUri;
      }

      const createdAt = capturedAt ?? new Date().toISOString();
      const placeName = reviewPlaceName.trim() || undefined;
      const trackSnapshot = shouldSaveMusic ? currentTrack : undefined;
      const activeTravelMode = activeSessionId ? selectedMode : undefined;
      const recommendationContext = createRecommendationEventContext({
        placeCategory: capturePlace?.category,
        placeId: capturePlace?.id,
        placeName,
        travelMode: activeTravelMode,
      });
      const idempotencyKey = saveIdempotencyKey ?? `recap-capture:${createdAt}`;
      const savedLog = await momentLogApi.createMomentLog({
        createdAt,
        idempotencyKey,
        location: locationSnapshot,
        moodTags: reviewMoodTags,
        photoUri: photoSourceUri,
        placeCategory: capturePlace?.category,
        placeId: capturePlace?.id,
        placeName,
        recapVisibility,
        sessionId: activeSessionId,
        templateId: reviewTemplate,
        track: trackSnapshot,
        travelMode: activeTravelMode,
      });

      if (!savedLog) {
        throw new Error("recap_save_failed");
      }

      if (!activeSessionId) {
        const backgroundSuggestion = savedLog.location
          ? await recapApi.getBackgroundSuggestion({
              location: savedLog.location,
              moodTags: reviewMoodTags,
              travelMode: activeTravelMode,
            })
          : undefined;
        const standaloneRecap = await recapApi.createRecap(
          {
            backgroundImageUrl:
              backgroundSuggestion?.backgroundImageUrl ?? undefined,
            momentLogIds: [savedLog.id],
            templateId: reviewTemplate,
            visibility: recapVisibility,
          },
          `standalone-recap:${idempotencyKey}`,
        );

        if (!standaloneRecap) {
          throw new Error("standalone_recap_save_failed");
        }
      }

      syncRecommendationEvent(
        addRecommendationEvent({
          context: recommendationContext,
          playlistId,
          trackId: trackSnapshot?.id,
          type: "moment_log_saved",
          value: "server",
        }),
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: momentLogQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: recapQueryKeys.lists }),
      ]);

      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace(resolveReturnPath(returnTo) as never);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "이 리캡을 저장하지 못했어요. 다시 시도해주세요.",
      );
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  if (isReviewing) {
    return (
      <>
        <MomentReviewPanel
          ref={reviewPanelRef}
          capturedAt={capturedAt}
          errorMessage={errorMessage}
          includeMusic={shouldSaveMusic}
          isRecommendedPhoto={Boolean(recommendedPhotoPlace)}
          isRecommendedPhotoFeedbackSubmitted={isPhotoFeedbackSubmitted}
          isSaving={isSaving}
          location={currentLocation}
          moodTags={reviewMoodTags}
          onChangeMoodTags={setReviewMoodTags}
          onChangePlaceName={setReviewPlaceName}
          onChangeTemplate={setReviewTemplate}
          onChangeVisibility={setRecapVisibility}
          onRateRecommendedPhoto={() => setIsPhotoFeedbackVisible(true)}
          onRetake={() => {
            setCapturedAt(undefined);
            setSaveIdempotencyKey(undefined);
            setCapturedPhotoUri(undefined);
            setRecommendedPhotoPlace(undefined);
            setIsPhotoFeedbackVisible(false);
            setIsReviewing(false);
            setErrorMessage(undefined);
          }}
          onSave={handleSave}
          onToggleMusic={() => setShouldSaveMusic((value) => !value)}
          photoUri={capturedPhotoUri}
          placeName={reviewPlaceName}
          selectedTemplate={reviewTemplate}
          track={currentTrack}
          travelMode={session.status === "active" ? selectedMode : undefined}
          visibility={recapVisibility}
        />
        <RecommendationFeedbackSheet
          contextLabel={recommendedPhotoPlace?.title}
          onClose={() => setIsPhotoFeedbackVisible(false)}
          onSubmit={handleSubmitPhotoFeedback}
          subject="photo"
          visible={isPhotoFeedbackVisible}
        />
      </>
    );
  }

  if (Platform.OS === "web") {
    return (
      <Screen>
        <View className="flex-1 px-6 pb-10 pt-10">
          <PageHeader title="리캡 만들기" />

          <View className="mt-9">
            <SectionTitle title="카메라" />
            <SettingsRow
              description="카메라 촬영은 iOS와 Android 앱에서 사용할 수 있어요."
              icon="camera"
              label="웹에서는 촬영할 수 없어요"
            />
            <SettingsRow
              description="장소, 음악과 무드만으로도 리캡을 저장할 수 있어요."
              icon="edit-3"
              label="사진 없는 리캡"
            />
          </View>

          <Pressable
            accessibilityRole="button"
            className="mt-auto h-14 items-center justify-center rounded-xl border border-soundlog-lime/45 bg-soundlog-action px-5"
            onPress={() => prepareReview()}
          >
            <AppText className="text-center font-semibold text-soundlog-inverse">
              사진 없이 기록하기
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="mt-2 h-12 items-center justify-center"
            onPress={() => router.back()}
          >
            <AppText className="text-center font-semibold text-white/58">
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
