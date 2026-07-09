import { View } from 'react-native';

import { ShareActionButton, ShareActionId } from '@/components/recap-share/ShareActionButton';

const actions: Array<{
  backgroundColor: string;
  icon: 'download' | 'share-2';
  iconColor: string;
  id: ShareActionId;
  label: string;
  loadingLabel: string;
  textColor: string;
}> = [
  {
    backgroundColor: '#B7E628',
    icon: 'download',
    iconColor: '#050916',
    id: 'save',
    label: '이미지 저장',
    loadingLabel: '저장 중',
    textColor: '#050916',
  },
  {
    backgroundColor: 'rgba(255,255,255,0.1)',
    icon: 'share-2',
    iconColor: '#FFFFFF',
    id: 'share',
    label: '공유하기',
    loadingLabel: '공유 중',
    textColor: '#FFFFFF',
  },
];

type ShareActionListProps = {
  activeAction?: ShareActionId;
  isBusy?: boolean;
  onAction: (action: ShareActionId) => void;
};

export function ShareActionList({ activeAction, isBusy = false, onAction }: ShareActionListProps) {
  return (
    <View className="w-full flex-row gap-3">
      {actions.map((action) => (
        <ShareActionButton
          key={action.id}
          backgroundColor={action.backgroundColor}
          disabled={isBusy}
          icon={action.icon}
          iconColor={action.iconColor}
          isActive={activeAction === action.id}
          label={action.label}
          loadingLabel={action.loadingLabel}
          onPress={() => onAction(action.id)}
          textColor={action.textColor}
        />
      ))}
    </View>
  );
}
