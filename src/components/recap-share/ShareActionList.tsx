import { ScrollView, View } from 'react-native';

import { ShareActionButton, ShareActionId } from '@/components/recap-share/ShareActionButton';

const actions: Array<{
  color: string;
  icon: 'download' | 'share-2';
  id: ShareActionId;
  label: string;
}> = [
  { color: '#2B2B2F', icon: 'download', id: 'save', label: 'Save' },
  { color: '#20146F', icon: 'share-2', id: 'share', label: 'Share' },
];

type ShareActionListProps = {
  activeAction?: ShareActionId;
  isBusy?: boolean;
  onAction: (action: ShareActionId) => void;
};

export function ShareActionList({ activeAction, isBusy = false, onAction }: ShareActionListProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row justify-center gap-5 px-5">
        {actions.map((action) => (
          <ShareActionButton
            key={action.id}
            color={action.color}
            disabled={isBusy}
            icon={action.icon}
            isActive={activeAction === action.id}
            label={action.label}
            onPress={() => onAction(action.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}
