import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { SOUNDLOG_SUPPORT_EMAIL } from '@/constants/legal';

type LegalSection = {
  body: string;
  title: string;
};

type LegalDocumentScreenProps = {
  sections: LegalSection[];
  subtitle: string;
  title: string;
  updatedAt: string;
};

function openSupportEmail() {
  const subject = encodeURIComponent('Soundlog 문의');
  void Linking.openURL(`mailto:${SOUNDLOG_SUPPORT_EMAIL}?subject=${subject}`);
}

export function LegalDocumentScreen({
  sections,
  subtitle,
  title,
  updatedAt,
}: LegalDocumentScreenProps) {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48, paddingHorizontal: 20, paddingTop: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityLabel="뒤로가기"
          accessibilityRole="button"
          className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
          onPress={() => router.back()}
        >
          <Feather color="#fff" name="chevron-left" size={22} />
        </Pressable>

        <View className="mt-8">
          <AppText className="text-sm font-semibold text-[#7CFF8A]">
            {updatedAt}
          </AppText>
          <AppText className="mt-3 text-[30px] font-semibold leading-[38px] text-white">
            {title}
          </AppText>
          <AppText className="mt-4 text-sm leading-6 text-white/58">
            {subtitle}
          </AppText>
        </View>

        <View className="mt-8 gap-4">
          {sections.map((section) => (
            <View
              key={section.title}
              className="rounded-[20px] border border-white/10 bg-white/10 p-5"
            >
              <AppText className="text-base font-semibold text-white">
                {section.title}
              </AppText>
              <AppText className="mt-3 text-sm leading-6 text-white/58">
                {section.body}
              </AppText>
            </View>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          className="mt-6 min-h-12 flex-row items-center justify-center rounded-full bg-white px-5"
          onPress={openSupportEmail}
        >
          <Feather color="#05070C" name="mail" size={17} />
          <AppText className="ml-2 text-sm font-semibold text-[#05070C]">
            문의 메일 보내기
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

