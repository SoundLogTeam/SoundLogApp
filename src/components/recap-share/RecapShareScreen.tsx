import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRecapShareQuery } from '@/api/recapQueries';
import { AppText } from '@/components/AppText';
import { RecapPreviewCard } from '@/components/recap-share/RecapPreviewCard';
import {
  RecapShareEmptyState,
  RecapShareErrorState,
  RecapShareLoadingState,
} from '@/components/recap-share/RecapShareState';
import { ShareActionId } from '@/components/recap-share/ShareActionButton';
import { ShareActionList } from '@/components/recap-share/ShareActionList';
import { Screen } from '@/components/Screen';
import { getTabBarHeight } from '@/constants/layout';
import { formatRecapRecordedAt } from '@/utils/dateFormat';

type RecapShareScreenProps = {
  recapId?: string;
};

const actionMessages: Record<ShareActionId, string> = {
  save: '저장 기능은 다음 단계에서 기기 갤러리와 연결할 예정이에요.',
  share: '공유 기능은 다음 단계에서 OS 공유 시트와 연결할 예정이에요.',
};

export function RecapShareScreen({ recapId }: RecapShareScreenProps) {
  const insets = useSafeAreaInsets();
  const { data: recap, isError, isLoading, refetch } = useRecapShareQuery(recapId);
  const [activeAction, setActiveAction] = useState<ShareActionId>();
  const [message, setMessage] = useState<string>();

  const handleAction = async (action: ShareActionId) => {
    if (activeAction) {
      return;
    }

    setActiveAction(action);
    setMessage(undefined);

    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      setMessage(actionMessages[action]);
    } finally {
      setActiveAction(undefined);
    }
  };

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
              <RecapPreviewCard recap={recap} />
              <AppText className="mt-5 text-sm text-white/70">
                {formatRecapRecordedAt(recap.recordedAt)}
              </AppText>

              <View className="mt-12 w-full items-center">
                <ShareActionList
                  activeAction={activeAction}
                  isBusy={Boolean(activeAction)}
                  onAction={handleAction}
                />
              </View>

              {message ? (
                <View className="mt-6 rounded-[16px] border border-white/10 bg-white/10 px-4 py-3">
                  <AppText className="text-center text-sm leading-5 text-white/75">
                    {message}
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
