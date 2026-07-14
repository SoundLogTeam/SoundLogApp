import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/AppText";
import { SectionTitle } from "@/components/SectionTitle";
import type { RecapShare, RecapShareMoment } from "@/types/domain";
import { getRecapSoundLogs } from "@/utils/recapTravelSummary";

function formatLogTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "시간 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).format(date);
}

function formatLogDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "날짜 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    month: "long",
  }).format(date);
}

function SoundLogBackground({ imageUrl }: { imageUrl?: string }) {
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const visibleImageUrl =
    imageUrl && failedImageUrl !== imageUrl ? imageUrl : undefined;

  return (
    <>
      {visibleImageUrl ? (
        <Image
          contentFit="cover"
          onError={() => setFailedImageUrl(visibleImageUrl)}
          source={{ uri: visibleImageUrl }}
          style={StyleSheet.absoluteFill}
          transition={260}
        />
      ) : (
        <LinearGradient
          colors={["#1D2A48", "#301C5C", "#15101F"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={["rgba(5,9,22,0.08)", "rgba(5,9,22,0.18)", "rgba(5,9,22,0.92)"]}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
        <Feather color="rgba(255,255,255,0.68)" name={icon} size={15} />
      </View>
      <View className="min-w-0 flex-1">
        <AppText className="text-[11px] font-semibold text-white/42">
          {label}
        </AppText>
        <AppText
          className="mt-0.5 text-sm font-semibold text-white"
          numberOfLines={1}
        >
          {value}
        </AppText>
      </View>
    </View>
  );
}

export function RecapSoundLogCard({
  fill = false,
  index,
  moment,
  total,
  width,
}: {
  fill?: boolean;
  index: number;
  moment: RecapShareMoment;
  total: number;
  width?: number;
}) {
  const orderLabel = String(index + 1).padStart(2, "0");
  const totalLabel = String(total).padStart(2, "0");

  return (
    <View style={fill ? styles.fill : { width }}>
      <View
        className={`overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.06] ${
          fill ? "h-full" : ""
        }`}
      >
        <View
          className="overflow-hidden"
          style={fill ? styles.fill : styles.soundLogImage}
        >
          <SoundLogBackground imageUrl={moment.imageUrl} />

          <View className="absolute left-4 right-4 top-4 flex-row items-center justify-between gap-3">
            <View className="rounded-full border border-white/15 bg-black/28 px-3 py-1.5">
              <AppText className="text-[10px] font-semibold text-white/72">
                {orderLabel} / {totalLabel}
              </AppText>
            </View>
            <View className="rounded-full border border-white/15 bg-black/28 px-3 py-1.5">
              <AppText className="text-[10px] font-semibold text-white/72">
                {formatLogTime(moment.recordedAt)}
              </AppText>
            </View>
          </View>

          <View className="absolute bottom-0 left-0 right-0 px-5 pb-6">
            <AppText className="text-[11px] font-semibold tracking-[1.8px] text-white/58">
              SOUNDLOG
            </AppText>
            <AppText
              className="mt-3 text-[30px] font-semibold leading-9 text-white"
              numberOfLines={2}
            >
              {moment.trackTitle}
            </AppText>
            <AppText
              className="mt-3 text-base font-medium text-white/76"
              numberOfLines={1}
            >
              {moment.artistName}
            </AppText>
          </View>
        </View>

        <View className="gap-3 p-4">
          <DetailRow icon="map-pin" label="장소" value={moment.placeName} />
          <DetailRow
            icon="calendar"
            label="기록일"
            value={formatLogDate(moment.recordedAt)}
          />
        </View>
      </View>
    </View>
  );
}

export function RecapSoundLogList({
  canSelectThumbnail = false,
  isTravelLog,
  isUpdatingThumbnail = false,
  onSelectThumbnail,
  recap,
}: {
  canSelectThumbnail?: boolean;
  isTravelLog: boolean;
  isUpdatingThumbnail?: boolean;
  onSelectThumbnail?: (moment: RecapShareMoment) => void;
  recap: RecapShare;
}) {
  const soundLogs = getRecapSoundLogs(recap);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const progress =
    soundLogs.length > 0 ? (activeIndex + 1) / soundLogs.length : 0;
  const activeMoment = soundLogs[activeIndex];
  const selectedThumbnailId = recap.thumbnailMomentId ?? soundLogs[0]?.id;
  const isActiveMomentSelected = activeMoment?.id === selectedThumbnailId;

  useEffect(() => {
    setActiveIndex(0);
  }, [recap.id, soundLogs.length]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;

    setViewportWidth((current) =>
      current === nextWidth ? current : nextWidth,
    );
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pageWidth = event.nativeEvent.layoutMeasurement.width;

    if (!pageWidth) {
      return;
    }

    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    setActiveIndex(Math.min(Math.max(nextIndex, 0), soundLogs.length - 1));
  };

  return (
    <View className="w-full" onLayout={handleLayout}>
      <View className="mb-4">
        <SectionTitle
          rightContent={
            <AppText className="text-xs font-semibold text-white/42">
              {activeIndex + 1} / {soundLogs.length}
            </AppText>
          }
          title={isTravelLog ? "여행 사운드로그" : "독립 리캡"}
        />
        <AppText className="mt-2 text-sm text-white/48">
          {soundLogs.length}개 리캡
        </AppText>
      </View>

      {viewportWidth > 0 ? (
        <ScrollView
          decelerationRate="fast"
          horizontal
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          pagingEnabled
          scrollEventThrottle={16}
          showsHorizontalScrollIndicator={false}
        >
          {soundLogs.map((moment, index) => (
            <RecapSoundLogCard
              index={index}
              key={moment.id}
              moment={moment}
              total={soundLogs.length}
              width={viewportWidth}
            />
          ))}
        </ScrollView>
      ) : (
        <View className="h-[520px] rounded-[26px] border border-white/10 bg-white/[0.06]" />
      )}

      <View className="mt-4 h-1.5 w-full rounded-full bg-white/10">
        <View
          className="h-1.5 rounded-full bg-soundlog-lime"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      {canSelectThumbnail && isTravelLog && activeMoment ? (
        <Pressable
          accessibilityLabel={
            isActiveMomentSelected
              ? "현재 리캡이 로그 썸네일로 지정됨"
              : "현재 리캡을 로그 썸네일로 지정"
          }
          accessibilityRole="button"
          accessibilityState={{
            disabled: isUpdatingThumbnail || isActiveMomentSelected,
            selected: isActiveMomentSelected,
          }}
          className={`mt-4 min-h-[48px] flex-row items-center justify-center gap-2 rounded-[8px] border px-4 ${
            isActiveMomentSelected
              ? "border-soundlog-lime/35 bg-soundlog-lime/10"
              : "border-white/15 bg-white/[0.06]"
          }`}
          disabled={isUpdatingThumbnail || isActiveMomentSelected}
          onPress={() => onSelectThumbnail?.(activeMoment)}
        >
          <Feather
            color={isActiveMomentSelected ? "#B9F20D" : "rgba(255,255,255,0.72)"}
            name={isActiveMomentSelected ? "check" : "image"}
            size={16}
          />
          <AppText
            className={`text-sm font-semibold ${
              isActiveMomentSelected ? "text-soundlog-lime" : "text-white/72"
            }`}
          >
            {isUpdatingThumbnail
              ? "변경 중"
              : isActiveMomentSelected
                ? "대표 썸네일"
                : "로그 썸네일로 지정"}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  soundLogImage: {
    aspectRatio: 4 / 5,
  },
});
