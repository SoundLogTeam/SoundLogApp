import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Marker, Polyline, type Region } from "react-native-maps";

import { AppText } from "@/components/AppText";
import { googleDarkMapStyle } from "@/components/travel/live-sound-map/SoundMapView";
import type {
  GeoPoint,
  RecapShare,
  RecapShareMoment,
} from "@/types/domain";

function formatMomentDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "기록 시간 없음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "long",
  }).format(date);
}

function createMomentGroups(
  moments: Array<RecapShareMoment & { location: GeoPoint }>,
) {
  const groups = new Map<
    string,
    {
      location: GeoPoint;
      moments: Array<RecapShareMoment & { location: GeoPoint }>;
    }
  >();

  moments.forEach((moment) => {
    const key = `${moment.location.lat.toFixed(4)}:${moment.location.lng.toFixed(4)}`;
    const existing = groups.get(key);

    if (existing) {
      existing.moments.push(moment);
      return;
    }

    groups.set(key, {
      location: moment.location,
      moments: [moment],
    });
  });

  return [...groups.values()];
}

function MomentPreview({
  moment,
  onOpen,
}: {
  moment: RecapShareMoment;
  onOpen: () => void;
}) {
  return (
    <View className="w-[238px] flex-row items-center gap-3 rounded-[14px] border border-white/10 bg-[#111629]/95 p-3">
      <View className="h-16 w-16 overflow-hidden rounded-[10px] bg-white/10">
        {moment.imageUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: moment.imageUrl }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Feather color="rgba(255,255,255,0.42)" name="image" size={18} />
          </View>
        )}
      </View>
      <View className="min-w-0 flex-1">
        <AppText className="text-[11px] text-white/48" numberOfLines={1}>
          {formatMomentDate(moment.recordedAt)}
        </AppText>
        <AppText className="mt-1 text-sm font-semibold text-white" numberOfLines={1}>
          {moment.placeName}
        </AppText>
        <Pressable
          accessibilityLabel={`${moment.placeName} 리캡 상세 보기`}
          accessibilityRole="button"
          className="mt-2 flex-row items-center gap-1 self-start"
          hitSlop={8}
          onPress={onOpen}
        >
          <AppText className="text-xs font-semibold text-soundlog-lime">
            상세 보기
          </AppText>
          <Feather color="#B7E628" name="chevron-right" size={13} />
        </Pressable>
      </View>
    </View>
  );
}

function MomentDetailModal({
  moment,
  onClose,
}: {
  moment?: RecapShareMoment;
  onClose: () => void;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={Boolean(moment)}
    >
      <View className="flex-1 justify-end bg-black/70">
        <Pressable
          accessibilityLabel="리캡 상세 닫기"
          className="flex-1"
          onPress={onClose}
        />
        <View className="max-h-[86%] overflow-hidden rounded-t-[24px] border-t border-white/10 bg-[#090D1D]">
          <View className="flex-row items-center justify-between px-5 py-4">
            <View className="min-w-0 flex-1">
              <AppText className="text-[11px] font-semibold text-white/45">
                저장된 리캡
              </AppText>
              <AppText className="mt-1 text-lg font-semibold text-white" numberOfLines={1}>
                {moment?.placeName ?? "리캡 상세"}
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="닫기"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              onPress={onClose}
            >
              <Feather color="white" name="x" size={19} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: 38 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="mx-5 aspect-[4/5] overflow-hidden rounded-[18px] bg-white/[0.06]">
              {moment?.imageUrl ? (
                <Image
                  contentFit="cover"
                  source={{ uri: moment.imageUrl }}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <View className="h-full w-full items-center justify-center gap-3">
                  <Feather color="rgba(255,255,255,0.42)" name="image" size={28} />
                  <AppText className="text-sm text-white/45">저장된 사진이 없어요</AppText>
                </View>
              )}
            </View>

            <View className="gap-5 px-5 pt-6">
              <View className="flex-row gap-3">
                <Feather color="#B7E628" name="music" size={18} />
                <View className="min-w-0 flex-1">
                  <AppText className="text-base font-semibold text-white" numberOfLines={2}>
                    {moment?.trackTitle ?? "저장된 순간"}
                  </AppText>
                  <AppText className="mt-1 text-sm text-white/55" numberOfLines={1}>
                    {moment?.artistName ?? "음악 없음"}
                  </AppText>
                </View>
              </View>
              <View className="flex-row gap-3">
                <Feather color="rgba(255,255,255,0.58)" name="map-pin" size={18} />
                <AppText className="min-w-0 flex-1 text-sm leading-5 text-white/72">
                  {moment?.placeName ?? "장소 없음"}
                </AppText>
              </View>
              <View className="flex-row gap-3">
                <Feather color="rgba(255,255,255,0.58)" name="clock" size={18} />
                <AppText className="min-w-0 flex-1 text-sm leading-5 text-white/72">
                  {moment ? formatMomentDate(moment.recordedAt) : "기록 시간 없음"}
                </AppText>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function toCoordinate(location: GeoPoint) {
  return {
    latitude: location.lat,
    longitude: location.lng,
  };
}

function createInitialRegion(location: GeoPoint): Region {
  return {
    latitude: location.lat,
    latitudeDelta: 0.018,
    longitude: location.lng,
    longitudeDelta: 0.018,
  };
}

export function RecapRouteMap({ recap }: { recap: RecapShare }) {
  const mapRef = useRef<MapView | null>(null);
  const [selectedMoments, setSelectedMoments] = useState<RecapShareMoment[]>([]);
  const [detailMoment, setDetailMoment] = useState<RecapShareMoment>();
  const routeLocations = useMemo(
    () =>
      recap.routePoints?.length
        ? recap.routePoints.map(({ lat, lng }) => ({ lat, lng }))
        : (recap.moments ?? [])
            .map((moment) => moment.location)
            .filter((location): location is GeoPoint => Boolean(location)),
    [recap.moments, recap.routePoints],
  );
  const locatedMoments = useMemo(
    () =>
      (recap.moments ?? []).filter(
        (moment): moment is typeof moment & { location: GeoPoint } =>
          Boolean(moment.location),
      ),
    [recap.moments],
  );
  const mapCoordinates = useMemo(
    () => routeLocations.map(toCoordinate),
    [routeLocations],
  );
  const momentGroups = useMemo(
    () => createMomentGroups(locatedMoments),
    [locatedMoments],
  );
  const hasRecordedRoute = (recap.routePoints?.length ?? 0) > 1;
  const hasRouteLine = mapCoordinates.length > 1;
  const mapTitle = hasRecordedRoute
    ? "내 여행 로드맵"
    : hasRouteLine
      ? "촬영 위치 흐름"
      : "기록 위치";
  const mapDescription = hasRecordedRoute
    ? `여행모드에서 저장한 GPS 경로 ${recap.routePoints?.length ?? 0}개를 연결했어요.`
    : hasRouteLine
      ? "저장된 촬영 위치를 시간순으로 연결했어요."
      : routeLocations.length === 1
        ? "이 로그를 남긴 위치를 지도에서 확인해요."
        : "이 로그에는 저장된 위치가 없어요.";

  useEffect(
    function fitRecordedRoute() {
      if (mapCoordinates.length === 0) {
        return;
      }

      const frame = requestAnimationFrame(() => {
        if (mapCoordinates.length === 1) {
          mapRef.current?.animateToRegion(
            createInitialRegion(routeLocations[0]),
            260,
          );
          return;
        }

        mapRef.current?.fitToCoordinates(mapCoordinates, {
          animated: true,
          edgePadding: { bottom: 44, left: 44, right: 44, top: 44 },
        });
      });

      return () => cancelAnimationFrame(frame);
    },
    [mapCoordinates, routeLocations],
  );

  useEffect(
    function clearSelectionWhenLogChanges() {
      setSelectedMoments([]);
      setDetailMoment(undefined);
    },
    [recap.id],
  );

  return (
    <View className="w-full">
      <View className="mb-4 flex-row items-end justify-between gap-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold text-white/45">
            GPS 여행 경로
          </AppText>
          <AppText className="mt-2 text-[24px] font-semibold leading-8 text-white">
            {mapTitle}
          </AppText>
          <AppText className="mt-1 text-xs leading-5 text-white/55">
            {mapDescription}
          </AppText>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#B7E628" name="map" size={18} />
        </View>
      </View>

      {routeLocations.length > 0 ? (
        <View className="h-[292px] overflow-hidden rounded-[20px] border border-white/10 bg-[#070B1F]">
          <MapView
            customMapStyle={
              Platform.OS === "android" ? googleDarkMapStyle : undefined
            }
            initialRegion={createInitialRegion(routeLocations[0])}
            loadingBackgroundColor="#070B1F"
            loadingEnabled
            loadingIndicatorColor="#B7E628"
            mapType="standard"
            pitchEnabled={false}
            ref={mapRef}
            rotateEnabled={false}
            showsBuildings={false}
            showsCompass={false}
            showsMyLocationButton={false}
            showsPointsOfInterests={false}
            showsTraffic={false}
            style={StyleSheet.absoluteFill}
            toolbarEnabled={false}
            userInterfaceStyle="dark"
          >
            {hasRouteLine ? (
              <Polyline
                coordinates={mapCoordinates}
                lineCap="round"
                lineJoin="round"
                strokeColor="#B7E628"
                strokeWidth={4}
              />
            ) : null}

            {momentGroups.map((group, index) => (
              <Marker
                coordinate={toCoordinate(group.location)}
                key={group.moments.map((moment) => moment.id).join(":")}
                onPress={() => setSelectedMoments(group.moments)}
              >
                <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-soundlog-lime">
                  <AppText className="text-[11px] font-semibold text-soundlog-inverse">
                    {group.moments.length > 1 ? group.moments.length : index + 1}
                  </AppText>
                </View>
              </Marker>
            ))}

            {locatedMoments.length === 0 && routeLocations.length > 0 ? (
              <>
                <Marker
                  coordinate={toCoordinate(routeLocations[0])}
                  title="여행 시작"
                />
                {routeLocations.length > 1 ? (
                  <Marker
                    coordinate={toCoordinate(
                      routeLocations[routeLocations.length - 1],
                    )}
                    title="여행 종료"
                  />
                ) : null}
              </>
            ) : null}
          </MapView>

          {selectedMoments.length > 0 ? (
            <View className="absolute bottom-3 left-3 right-3">
              <View className="mb-2 flex-row items-center justify-between px-1">
                <AppText className="text-xs font-semibold text-white">
                  이 위치의 리캡 {selectedMoments.length}개
                </AppText>
                <Pressable
                  accessibilityLabel="핀 미리보기 닫기"
                  accessibilityRole="button"
                  className="h-8 w-8 items-center justify-center rounded-full bg-black/60"
                  onPress={() => setSelectedMoments([])}
                >
                  <Feather color="white" name="x" size={15} />
                </Pressable>
              </View>
              <ScrollView
                contentContainerStyle={{ gap: 8 }}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {selectedMoments.map((moment) => (
                  <MomentPreview
                    key={moment.id}
                    moment={moment}
                    onOpen={() => setDetailMoment(moment)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>
      ) : (
        <View className="min-h-[132px] items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.06] px-6">
          <Feather color="rgba(255,255,255,0.38)" name="map-pin" size={22} />
          <AppText className="mt-3 text-center text-sm leading-6 text-white/55">
            다음 기록부터 저장된 GPS 위치로 여행 경로를 만들어드릴게요.
          </AppText>
        </View>
      )}

      <MomentDetailModal
        moment={detailMoment}
        onClose={() => setDetailMoment(undefined)}
      />
    </View>
  );
}
