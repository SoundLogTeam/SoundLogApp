import { AppText } from '@/components/AppText';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function LibraryScreen() {
  return (
    <Screen contentClassName="justify-center px-8">
      <EmptyState
        description="좋아요한 음악과 저장한 플레이리스트가 이곳에 쌓입니다."
        title="보관함"
      />
      <AppText className="mt-6 text-center text-xs text-white/40">
        음악 플랫폼 연동 후 실제 목록을 연결합니다.
      </AppText>
    </Screen>
  );
}
