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
import { RecapTemplateId } from '@/types/domain';
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

export function RecapShareScreen({ recapId }: RecapShareScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedTemplate, setSelectedTemplate] = useState<RecapTemplateId>('lp');
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
          paddingTop: 72,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppText className="text-center text-[24px] font-semibold text-white">
          Share Your Music
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
              <RecapTemplateSelector
                selectedTemplate={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
              <View className="mt-5 w-full items-center">
                <RecapCaptureFrame ref={captureRef}>
                  <RecapPreviewCard recap={recap} template={selectedTemplate} />
                </RecapCaptureFrame>
              </View>
              <AppText className="mt-5 text-sm text-white/70">
                {formatRecapRecordedAt(recap.recordedAt)}
              </AppText>
              <RecapMusicSummary recap={recap} />

              <View className="mt-10 w-full items-center">
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
