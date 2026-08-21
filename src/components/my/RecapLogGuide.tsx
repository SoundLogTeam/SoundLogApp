import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SectionTitle } from '@/components/SectionTitle';

type FeatherIconName = ComponentProps<typeof Feather>['name'];

type GuideRowProps = {
  description: string;
  icon: FeatherIconName;
  label: string;
  title: string;
};

function GuideRow({ description, icon, label, title }: GuideRowProps) {
  return (
    <View
      accessibilityLabel={`${label}. ${title}. ${description}`}
      accessible
      className="flex-row gap-3 px-4 py-4"
    >
      <View className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soundlog-lime/12">
        <Feather color="#B7E628" name={icon} size={19} />
      </View>
      <View className="min-w-0 flex-1">
        <AppText className="text-xs font-semibold text-soundlog-lime">
          {label}
        </AppText>
        <AppText className="mt-1 text-[15px] font-semibold leading-5 text-white">
          {title}
        </AppText>
        <AppText className="mt-1.5 text-sm leading-6 text-white/50">
          {description}
        </AppText>
      </View>
    </View>
  );
}

export function RecapLogGuide() {
  return (
    <View className="mt-7">
      <SectionTitle title="리캡과 로그는 뭐가 달라요?" />

      <View className="mt-3 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.05]">
        <GuideRow
          description="사진과 장소 그리고 음악을 담아 여행의 한 장면을 남겨요. 여행모드 없이도 만들 수 있어요."
          icon="camera"
          label="리캡"
          title="마음에 든 순간을 찰칵 남겨요"
        />
        <View className="mx-4 h-px bg-white/10" />
        <GuideRow
          description="여행모드에서 만든 리캡을 시간순으로 차곡차곡 모아요. 이렇게 모인 리캡 묶음이 하나의 로그가 돼요."
          icon="layers"
          label="로그"
          title="리캡이 모이면 여행 이야기가 돼요"
        />
        <View className="border-t border-white/10 bg-black/15 px-4 py-3">
          <AppText className="text-center text-xs font-semibold leading-5 text-white/68">
            리캡은 한 장면이고 로그는 한 편의 여행이에요!
          </AppText>
        </View>
      </View>
    </View>
  );
}
