import { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
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

function createRecapTitle(recap?: RecapShare | null) {
  if (!recap) {
    return 'Recap';
  }

  return `${recap.placeName} 사운드`;
}

export function RecapShareScreen({ recapId }: RecapShareScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedTemplate, setSelectedTemplate] = useState<RecapTemplateId>('album');
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
    recapId,
  });

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
            ? '사운드트랙 앨범 결과물을 저장하거나 공유해요.'
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

              <View className="mt-5 w-full items-center">
                <RecapTemplateSelector
                  selectedTemplate={selectedTemplate}
                  onSelect={setSelectedTemplate}
                />
              </View>

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

              {message ? (
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
