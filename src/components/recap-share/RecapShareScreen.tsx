import { useMemo, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRecapShareQuery } from '@/api/recapQueries';
import { AppText } from '@/components/AppText';
import {
  RecapCaptureFrame,
  RecapCaptureFrameHandle,
} from '@/components/recap-share/RecapCaptureFrame';
import { RecapMusicSummary } from '@/components/recap-share/RecapMusicSummary';
import { RecapPreviewCard } from '@/components/recap-share/RecapPreviewCard';
import {
  RecapShareEmptyState,
  RecapShareErrorState,
  RecapShareLoadingState,
} from '@/components/recap-share/RecapShareState';
import { RecapTemplateSelector } from '@/components/recap-share/RecapTemplateSelector';
import { ShareActionList } from '@/components/recap-share/ShareActionList';
import { Screen } from '@/components/Screen';
import { getTabBarHeight } from '@/constants/layout';
import { useRecapShareActions } from '@/hooks/useRecapShareActions';
import { useMomentLogStore } from '@/store/momentLogStore';
import { RecapShare, RecapTemplateId } from '@/types/domain';
import { formatRecapRecordedAt } from '@/utils/dateFormat';
import {
  createMomentLogGroups,
  extractSessionIdFromRecapId,
  momentLogGroupToRecapShare,
  momentLogToRecapShare,
} from '@/utils/recapMappers';

type RecapShareScreenProps = {
  recapId?: string;
};

const recapTemplateLabels: Record<RecapTemplateId, string> = {
  album: '앨범',
  film: '필름',
  lp: 'LP',
  map: '지도',
};

function createRecapTitle(recap?: RecapShare | null) {
  if (!recap) {
    return 'Recap';
  }

  return `${recap.placeName} 사운드`;
}

function RecapArchiveSelector({
  onArchive,
  onSelect,
  selectedTemplate,
}: {
  onArchive: () => void;
  onSelect: (template: RecapTemplateId) => void;
  selectedTemplate: RecapTemplateId;
}) {
  return (
    <View className="mt-5 w-full rounded-[20px] border border-white/10 bg-white/[0.06] p-4">
      <View className="flex-row items-start justify-between gap-4">
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold text-white/45">
            템플릿 선택
          </AppText>
          <AppText className="mt-1 text-lg font-semibold text-white">
            {recapTemplateLabels[selectedTemplate]}로 남길게요
          </AppText>
          <AppText className="mt-2 text-xs leading-5 text-white/55">
            4개 템플릿 중 하나를 고른 뒤 Soundlog 아카이브에 저장해요.
          </AppText>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <Feather color="#FFFFFF" name="layers" size={18} />
        </View>
      </View>

      <View className="mt-4 items-center">
        <RecapTemplateSelector
          selectedTemplate={selectedTemplate}
          onSelect={onSelect}
        />
      </View>

      <Pressable
        accessibilityLabel="선택한 리캡 템플릿을 사운드로그로 아카이빙"
        accessibilityRole="button"
        className="mt-4 h-12 flex-row items-center justify-center gap-2 rounded-full bg-soundlog-lime px-5"
        onPress={onArchive}
      >
        <Feather color="#050916" name="archive" size={17} />
        <AppText className="text-sm font-semibold text-soundlog-inverse">
          사운드로그로 아카이빙
        </AppText>
      </Pressable>
    </View>
  );
}

function RecapArchiveComplete({
  onReselect,
  selectedTemplate,
}: {
  onReselect: () => void;
  selectedTemplate: RecapTemplateId;
}) {
  return (
    <View className="mt-5 w-full rounded-[20px] border border-lime-300/20 bg-lime-300/10 p-4">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-soundlog-lime">
          <Feather color="#050916" name="check" size={18} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-[11px] font-semibold text-lime-100/70">
            아카이빙 완료
          </AppText>
          <AppText className="mt-1 text-base font-semibold leading-6 text-white">
            {recapTemplateLabels[selectedTemplate]} 템플릿이 Soundlog에 저장됐어요
          </AppText>
          <AppText className="mt-1 text-xs leading-5 text-white/58">
            이제 완성된 리캡 이미지를 기기에 저장하거나 공유할 수 있어요.
          </AppText>
        </View>
      </View>

      <Pressable
        accessibilityLabel="리캡 템플릿 다시 선택"
        accessibilityRole="button"
        className="mt-4 h-10 flex-row items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4"
        onPress={onReselect}
      >
        <Feather color="rgba(255,255,255,0.76)" name="rotate-ccw" size={14} />
        <AppText className="text-xs font-semibold text-white/76">
          다시 선택
        </AppText>
      </Pressable>
    </View>
  );
}

export function RecapShareScreen({ recapId }: RecapShareScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedTemplate, setSelectedTemplate] = useState<RecapTemplateId>('album');
  const [isArchived, setIsArchived] = useState(false);
  const captureAspectRatio = selectedTemplate === 'album' ? 1 : 3 / 4;
  const momentLogs = useMomentLogStore((state) => state.logs);
  const sessionId = extractSessionIdFromRecapId(recapId);
  const localMomentGroup = useMemo(
    () =>
      sessionId
        ? createMomentLogGroups(momentLogs).find((group) => group.sessionId === sessionId)
        : undefined,
    [momentLogs, sessionId],
  );
  const localMomentLog = sessionId
    ? undefined
    : momentLogs.find((item) => item.id === recapId);
  const localRecap = localMomentGroup
    ? momentLogGroupToRecapShare(localMomentGroup)
    : localMomentLog
      ? momentLogToRecapShare(localMomentLog)
      : undefined;
  const isLocalRecap = Boolean(localRecap);
  const {
    data: remoteRecap,
    isError,
    isLoading,
    refetch,
  } = useRecapShareQuery(recapId, { enabled: Boolean(recapId) && !localRecap });
  const recap = localRecap ?? remoteRecap;
  const captureRef = useRef<RecapCaptureFrameHandle>(null);
  const { activeAction, message, save, share } = useRecapShareActions({
    capture: () => captureRef.current?.capture() ?? Promise.resolve(undefined),
    recapId: isLocalRecap ? undefined : recapId,
  });
  const handleSelectTemplate = (template: RecapTemplateId) => {
    setSelectedTemplate(template);
    setIsArchived(false);
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingBottom: getTabBarHeight(insets.bottom) + 28,
          paddingHorizontal: 20,
          paddingTop: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppText className="text-center text-[30px] font-semibold leading-9 text-white">
          {createRecapTitle(recap)}
        </AppText>
        <AppText className="mt-3 max-w-[300px] text-center text-sm leading-6 text-white/58">
          {recap
            ? isArchived
              ? '선택한 리캡을 Soundlog에 아카이빙했어요.'
              : '마음에 드는 리캡 템플릿을 고른 뒤 아카이빙해요.'
            : '여행의 사운드트랙 앨범을 불러오고 있어요.'}
        </AppText>

        <View className="mt-7 w-full items-center">
          {isLoading && !localRecap ? (
            <RecapShareLoadingState />
          ) : isError ? (
            <RecapShareErrorState onRetry={() => refetch()} />
          ) : !recap ? (
            <RecapShareEmptyState />
          ) : (
            <>
              <View className="w-full items-center">
                <RecapCaptureFrame ref={captureRef} aspectRatio={captureAspectRatio}>
                  <RecapPreviewCard recap={recap} template={selectedTemplate} />
                </RecapCaptureFrame>
              </View>

              {isLocalRecap ? (
                <View className="mt-5 w-full rounded-[16px] border border-amber-300/20 bg-amber-300/10 px-4 py-3">
                  <AppText className="text-center text-xs leading-5 text-amber-100">
                    서버 동기화 전 로컬 Recap이에요. 이미지 저장과 공유는 가능하고, Moment 동기화 후 서버 Recap으로 저장할 수 있어요.
                  </AppText>
                </View>
              ) : null}

              {isArchived ? (
                <>
                  <RecapArchiveComplete
                    selectedTemplate={selectedTemplate}
                    onReselect={() => setIsArchived(false)}
                  />

                  <AppText className="mt-4 text-sm text-white/70">
                    {formatRecapRecordedAt(recap.recordedAt)}
                  </AppText>

                  <View className="mt-5 w-full">
                    <RecapMusicSummary recap={recap} />
                  </View>

                  <View className="mt-5 w-full">
                    <ShareActionList
                      activeAction={activeAction}
                      isBusy={Boolean(activeAction)}
                      onAction={(action) => {
                        if (action === 'save') {
                          save();
                        } else {
                          share();
                        }
                      }}
                    />
                  </View>
                </>
              ) : (
                <RecapArchiveSelector
                  selectedTemplate={selectedTemplate}
                  onArchive={() => setIsArchived(true)}
                  onSelect={handleSelectTemplate}
                />
              )}

              {isArchived && message ? (
                <View
                  className="mt-6 rounded-[16px] border px-4 py-3"
                  style={{
                    backgroundColor:
                      message.type === 'success'
                        ? 'rgba(34,197,94,0.12)'
                        : message.type === 'error'
                          ? 'rgba(248,113,113,0.12)'
                          : 'rgba(255,255,255,0.1)',
                    borderColor:
                      message.type === 'success'
                        ? 'rgba(34,197,94,0.22)'
                        : message.type === 'error'
                          ? 'rgba(248,113,113,0.22)'
                          : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <AppText className="text-center text-sm leading-5 text-white/75">
                    {message.text}
                  </AppText>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
