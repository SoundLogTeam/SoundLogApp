import { Feather } from "@expo/vector-icons";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  View,
} from "react-native";

import { AppText } from "@/components/AppText";
import { IconButton } from "@/components/IconButton";
import {
  MOMENT_PHOTO_CANVAS_ASPECT_RATIO,
  MomentPhotoCanvas,
  type MomentPhotoCanvasHandle,
} from "@/components/moment-capture/MomentPhotoCanvas";
import { MomentSaveState } from "@/components/moment-capture/MomentSaveState";
import { PageHeader } from "@/components/PageHeader";
import { RecapTemplateSelector } from "@/components/recap-share/RecapTemplateSelector";
import { Screen } from "@/components/Screen";
import { SectionTitle } from "@/components/SectionTitle";
import { SettingsRow } from "@/components/SettingsRow";
import {
  GeoPoint,
  MoodTag,
  RecapTemplateId,
  RecapVisibility,
  Track,
  TravelMode,
} from "@/types/domain";

const travelModeLabels: Partial<Record<TravelMode, string>> = {
  cafe: "카페 투어",
  drive: "드라이브",
  festival: "축제",
  night: "야경 감상",
  ocean: "바다 보기",
  walk: "산책",
};

const moodLabels: Record<MoodTag, string> = {
  active: "신나는",
  calm: "잔잔한",
  emotional: "감성적인",
  fresh: "시원한",
  local: "설레는",
};

type MomentReviewPanelProps = {
  capturedAt?: string;
  errorMessage?: string;
  includeMusic: boolean;
  isSaving: boolean;
  location?: GeoPoint;
  moodTags: MoodTag[];
  onChangeMoodTags: (moodTags: MoodTag[]) => void;
  onChangePlaceName: (placeName: string) => void;
  onChangeTemplate: (template: RecapTemplateId) => void;
  onChangeVisibility: (visibility: RecapVisibility) => void;
  onRetake: () => void;
  onSave: () => void;
  onToggleMusic: () => void;
  photoUri?: string;
  placeName: string;
  selectedTemplate: RecapTemplateId;
  track?: Track;
  travelMode?: TravelMode;
  visibility: RecapVisibility;
};

export type MomentReviewPanelHandle = {
  capturePhoto: () => Promise<string | undefined>;
};

const editableMoodTags = Object.entries(moodLabels) as Array<[MoodTag, string]>;

export const MomentReviewPanel = forwardRef<
  MomentReviewPanelHandle,
  MomentReviewPanelProps
>(function MomentReviewPanel(
  {
    capturedAt,
    errorMessage,
    includeMusic,
    isSaving,
    location,
    moodTags,
    onChangeMoodTags,
    onChangePlaceName,
    onChangeTemplate,
    onChangeVisibility,
    onRetake,
    onSave,
    onToggleMusic,
    photoUri,
    placeName,
    selectedTemplate,
    track,
    travelMode,
    visibility,
  },
  ref,
) {
  const photoCanvasRef = useRef<MomentPhotoCanvasHandle>(null);
  const [isCanvasStickerDragging, setIsCanvasStickerDragging] = useState(false);
  const moodLabel = moodTags.map((tag) => moodLabels[tag]).join(", ") || "선택 안 함";
  const canToggleMusic = Boolean(track);
  const travelModeLabel = travelMode
    ? (travelModeLabels[travelMode] ?? "미설정")
    : "여행모드 아님";

  const toggleMoodTag = (tag: MoodTag) => {
    if (moodTags.includes(tag)) {
      onChangeMoodTags(moodTags.filter((item) => item !== tag));
      return;
    }

    onChangeMoodTags([...moodTags, tag]);
  };

  useImperativeHandle(
    ref,
    () => ({
      capturePhoto: () =>
        photoCanvasRef.current?.capturePhoto() ?? Promise.resolve(undefined),
    }),
    [],
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 36,
          paddingHorizontal: 20,
          paddingTop: 24,
        }}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={!isCanvasStickerDragging}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          leftContent={
            <IconButton
              disabled={isSaving}
              label="다시 촬영"
              name="arrow-left"
              onPress={onRetake}
            />
          }
          title="리캡 만들기"
        />
        <AppText className="ml-12 mt-2 text-sm leading-6 text-white/48">
          사진과 장소, 음악을 확인하고 저장하세요.
        </AppText>

        {photoUri ? (
          <MomentPhotoCanvas
            ref={photoCanvasRef}
            capturedAt={capturedAt}
            isSaving={isSaving}
            location={location}
            onStickerDragChange={setIsCanvasStickerDragging}
            photoUri={photoUri}
            placeName={placeName}
            selectedTemplate={selectedTemplate}
            track={includeMusic ? track : undefined}
          />
        ) : (
          <View
            className="mt-7 w-full items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] px-6"
            style={{ aspectRatio: MOMENT_PHOTO_CANVAS_ASPECT_RATIO }}
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white/10">
              <Feather color="rgba(255,255,255,0.75)" name="music" size={25} />
            </View>
            <AppText className="mt-5 text-center text-[22px] font-semibold text-white">
              사진 없이 리캡을 만들어요
            </AppText>
            <AppText className="mt-3 text-center text-sm leading-6 text-white/52">
              장소, 음악과 무드만으로도 저장할 수 있어요.
            </AppText>
          </View>
        )}

        <View className="mt-7">
          <SectionTitle title="표현 템플릿" />
          <View className="mt-3">
            <RecapTemplateSelector
              onSelect={onChangeTemplate}
              selectedTemplate={selectedTemplate}
            />
          </View>
        </View>

        <View className="mt-7">
          <SectionTitle title="기록 정보" />

          <View className="mt-3 flex-row items-center border-b border-white/10 py-2">
            <View className="w-9 items-center justify-center">
              <Feather color="rgba(255,255,255,0.5)" name="map-pin" size={20} />
            </View>
            <TextInput
              accessibilityLabel="장소명 입력"
              className="ml-3 h-12 min-w-0 flex-1 text-[15px] font-medium text-white"
              editable={!isSaving}
              maxLength={60}
              onChangeText={onChangePlaceName}
              placeholder="장소 이름을 입력해주세요"
              placeholderTextColor="rgba(255,255,255,0.32)"
              returnKeyType="done"
              value={placeName}
            />
          </View>

          <View className="mt-4">
            <AppText className="text-sm font-medium text-white/80">공개 범위</AppText>
            <View className="mt-3 flex-row rounded-full border border-white/10 bg-white/[0.06] p-1">
              {(
                [
                  { label: "나만 보기", value: "private" },
                  { label: "전체 공개", value: "public" },
                ] as const
              ).map((option) => {
                const selected = visibility === option.value;
                const disabled = option.value === "public" && !location;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled, selected }}
                    className={`min-h-11 flex-1 items-center justify-center rounded-full ${
                      selected ? "bg-soundlog-lime" : "bg-transparent"
                    }`}
                    disabled={disabled || isSaving}
                    key={option.value}
                    onPress={() => onChangeVisibility(option.value)}
                    style={{ opacity: disabled ? 0.38 : 1 }}
                  >
                    <AppText
                      className={`text-xs font-semibold ${
                        selected ? "text-soundlog-inverse" : "text-white/68"
                      }`}
                    >
                      {option.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>
            <AppText className="mt-2 text-xs leading-5 text-white/40">
              {location
                ? "전체 공개하면 현재 위치 300m 안의 사용자 지도에 표시돼요."
                : "위치가 없는 리캡은 나만 볼 수 있어요."}
            </AppText>
          </View>

          <View className="mt-2">
            <SettingsRow
              description={
                track
                  ? `${track.title} · ${track.artist}`
                  : "음악추천에서 곡을 고른 뒤 리캡에 담을 수 있어요."
              }
              disabled={!canToggleMusic || isSaving}
              icon="music"
              label="현재 음악 포함"
              rightContent={
                <Switch
                  disabled={!canToggleMusic || isSaving}
                  onValueChange={onToggleMusic}
                  thumbColor="#ffffff"
                  trackColor={{
                    false: "rgba(255,255,255,0.18)",
                    true: "#B7E628",
                  }}
                  value={includeMusic && canToggleMusic}
                />
              }
            />
            <SettingsRow
              description={
                travelMode
                  ? "현재 여행 로그에 이 리캡이 함께 저장돼요."
                  : "독립 리캡으로 저장되며 여행 로그에는 포함되지 않아요."
              }
              icon="navigation"
              label="여행 상태"
              rightText={travelModeLabel}
            />
          </View>
        </View>

        <View className="mt-7">
          <SectionTitle
            rightContent={
              <AppText className="text-xs font-semibold text-white/42">{moodLabel}</AppText>
            }
            title="무드"
          />
          <View className="mt-3 flex-row flex-wrap gap-2">
            {editableMoodTags.map(([tag, label]) => {
              const selected = moodTags.includes(tag);

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className={`min-h-11 justify-center rounded-full border px-4 ${
                    selected
                      ? "border-soundlog-lime bg-soundlog-lime"
                      : "border-white/10 bg-white/[0.06]"
                  }`}
                  disabled={isSaving}
                  key={tag}
                  onPress={() => toggleMoodTag(tag)}
                >
                  <AppText
                    className={`text-xs font-semibold ${
                      selected ? "text-soundlog-inverse" : "text-white/68"
                    }`}
                  >
                    {label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <MomentSaveState message={errorMessage} type="error" />

        <View className="mt-7 gap-2">
          <Pressable
            accessibilityLabel="이 리캡 저장하기"
            accessibilityRole="button"
            accessibilityState={{ busy: isSaving, disabled: isSaving }}
            className="h-14 items-center justify-center rounded-xl bg-soundlog-lime"
            disabled={isSaving}
            onPress={onSave}
            style={{ opacity: isSaving ? 0.72 : 1 }}
          >
            {isSaving ? (
              <ActivityIndicator color="#050916" />
            ) : (
              <AppText className="font-semibold text-soundlog-inverse">
                이 리캡 저장하기
              </AppText>
            )}
          </Pressable>
          <Pressable
            accessibilityLabel={photoUri ? "다시 촬영하기" : "사진 촬영하기"}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSaving }}
            className="h-12 items-center justify-center"
            disabled={isSaving}
            onPress={onRetake}
          >
            <AppText className="font-semibold text-white/58">
              {photoUri ? "다시 촬영하기" : "사진 촬영하기"}
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
});
