import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { communityApi } from '@/api/communityApi';
import { AppText } from '@/components/AppText';
import { ResilientImage } from '@/components/media/ResilientImage';
import { ReportContentSheet } from '@/components/moderation/ReportContentSheet';
import { useAuthenticatedImageSource } from '@/hooks/useAuthenticatedImageSource';
import type { RecapMapMarker } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

import type { SoundMapPin } from '../live-sound-map/types';

type SelectedRecapPinPanelProps = {
  markers: RecapMapMarker[];
  onClose: () => void;
  onBlocked: () => void;
  onOpenRecap: (recapId: string) => void;
  pin: SoundMapPin;
};

// Extracted so `useAuthenticatedImageSource` can be called safely: it must run in a
// component's own render body, not directly inside the `markers.map()` below (a hook call
// site would otherwise vary per render as the marker list's length changes).
function MarkerThumbnail({ imageUrl }: { imageUrl?: string }) {
  const photoSource = useAuthenticatedImageSource(imageUrl);

  return (
    <View className="h-14 w-14 shrink-0 overflow-hidden rounded-[8px] bg-white/10">
      {imageUrl ? (
        <ResilientImage
          className="h-full w-full"
          contentFit="cover"
          fallbackVariant="recap"
          source={photoSource}
          transition={180}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Feather color="rgba(255,255,255,0.48)" name="music" size={19} />
        </View>
      )}
    </View>
  );
}

export function SelectedRecapPinPanel({
  markers,
  onClose,
  onBlocked,
  onOpenRecap,
  pin,
}: SelectedRecapPinPanelProps) {
  const [reportRecapId, setReportRecapId] = useState<string>();

  const handleBlock = (recapId: string) => {
    Alert.alert(
      '이 사용자를 차단할까요?',
      '이 사용자의 공개 리캡이 지도와 피드에서 즉시 숨겨집니다.',
      [
        { style: 'cancel', text: '취소' },
        {
          style: 'destructive',
          text: '차단',
          onPress: () => {
            void communityApi
              .blockUser({ targetContentId: recapId, targetType: 'recap' })
              .then(() => {
                onClose();
                onBlocked();
                Alert.alert('차단 완료', '해당 사용자의 공개 콘텐츠를 숨겼어요.');
              })
              .catch(() => Alert.alert('차단 실패', '잠시 후 다시 시도해주세요.'));
          },
        },
      ],
    );
  };

  return (
    <View className="overflow-hidden rounded-[22px] border border-white/14 bg-[#090D19]/95 px-4 pb-3 pt-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Feather color="#B7E628" name="map-pin" size={14} />
            <AppText className="text-xs font-semibold text-soundlog-lime">
              선택한 핀의 로그 · {markers.length}개
            </AppText>
          </View>
          <AppText
            className="mt-1.5 text-base font-semibold text-white"
            numberOfLines={1}
          >
            {pin.subtitle}
          </AppText>
        </View>
        <Pressable
          accessibilityLabel="선택한 핀 로그 닫기"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center"
          hitSlop={4}
          onPress={onClose}
        >
          <Feather color="rgba(255,255,255,0.7)" name="x" size={19} />
        </Pressable>
      </View>

      <ScrollView
        className="mt-2 max-h-[238px]"
        nestedScrollEnabled
        showsVerticalScrollIndicator={markers.length > 3}
      >
        {markers.map((marker, index) => (
          <Pressable
            accessibilityHint="로그의 사진, 음악과 여행 기록을 자세히 봅니다."
            accessibilityLabel={`${marker.title} 상세 보기`}
            accessibilityRole="button"
            className={`min-h-[76px] flex-row items-center gap-3 py-2.5 ${
              index > 0 ? 'border-t border-white/10' : ''
            }`}
            key={marker.id}
            onPress={() => onOpenRecap(marker.recapId)}
          >
            <MarkerThumbnail imageUrl={marker.imageUrl} />

            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <AppText
                  className="min-w-0 flex-1 text-sm font-semibold text-white"
                  numberOfLines={1}
                >
                  {marker.title}
                </AppText>
                <AppText className="text-[10px] font-semibold text-white/42">
                  {marker.visibility === 'public' ? '전체공개' : '나만보기'}
                </AppText>
              </View>
              <AppText className="mt-1 text-xs text-white/62" numberOfLines={1}>
                {marker.trackTitle} · {marker.artistName}
              </AppText>
              <AppText
                className="mt-1 text-[10px] text-white/38"
                numberOfLines={1}
              >
                {marker.ownerAlias} · {formatRecapRecordedAt(marker.createdAt)}
              </AppText>
            </View>

            <View className="h-11 shrink-0 flex-row items-center gap-1 pl-1">
              {!marker.isMine ? (
                <>
                  <Pressable
                    accessibilityLabel={`${marker.title} 신고`}
                    accessibilityRole="button"
                    className="h-11 w-9 items-center justify-center"
                    onPress={(event) => {
                      event.stopPropagation();
                      setReportRecapId(marker.recapId);
                    }}
                  >
                    <Feather color="#FDE68A" name="flag" size={15} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`${marker.title} 작성자 차단`}
                    accessibilityRole="button"
                    className="h-11 w-9 items-center justify-center"
                    onPress={(event) => {
                      event.stopPropagation();
                      handleBlock(marker.recapId);
                    }}
                  >
                    <Feather color="#FCA5A5" name="slash" size={15} />
                  </Pressable>
                </>
              ) : null}
              <AppText className="text-xs font-semibold text-soundlog-lime">
                상세
              </AppText>
              <Feather color="#B7E628" name="chevron-right" size={16} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <ReportContentSheet
        onClose={() => setReportRecapId(undefined)}
        onReported={() => Alert.alert('신고 접수', '운영자가 24시간 안에 확인합니다.')}
        target={reportRecapId ? { targetContentId: reportRecapId, targetType: 'recap' } : undefined}
        title="공개 리캡 신고"
        visible={Boolean(reportRecapId)}
      />
    </View>
  );
}
