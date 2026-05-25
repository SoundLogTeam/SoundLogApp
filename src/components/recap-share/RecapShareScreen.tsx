import { useRef } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRecapShareQuery } from '@/api/recapQueries';
import { AppText } from '@/components/AppText';
import {
  RecapCaptureFrame,
  RecapCaptureFrameHandle,
} from '@/components/recap-share/RecapCaptureFrame';
import { RecapPreviewCard } from '@/components/recap-share/RecapPreviewCard';
import {
  RecapShareEmptyState,
  RecapShareErrorState,
  RecapShareLoadingState,
} from '@/components/recap-share/RecapShareState';
import { ShareActionList } from '@/components/recap-share/ShareActionList';
import { Screen } from '@/components/Screen';
import { getTabBarHeight } from '@/constants/layout';
import { useRecapShareActions } from '@/hooks/useRecapShareActions';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type RecapShareScreenProps = {
  recapId?: string;
};

export function RecapShareScreen({ recapId }: RecapShareScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: recap, isError, isLoading, refetch } = useRecapShareQuery(recapId);
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

        <View className="mt-8 w-full items-center">
          {isLoading ? (
            <RecapShareLoadingState />
          ) : isError ? (
            <RecapShareErrorState onRetry={() => refetch()} />
          ) : !recap ? (
            <RecapShareEmptyState />
          ) : (
            <>
              <RecapCaptureFrame ref={captureRef}>
                <RecapPreviewCard recap={recap} />
              </RecapCaptureFrame>
              <AppText className="mt-5 text-sm text-white/70">
                {formatRecapRecordedAt(recap.recordedAt)}
              </AppText>

              <View className="mt-12 w-full items-center">
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
