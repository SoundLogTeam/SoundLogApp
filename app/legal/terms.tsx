import { LegalDocumentScreen } from "@/components/legal/LegalDocumentScreen";
import { SOUNDLOG_SUPPORT_EMAIL } from "@/constants/legal";

const termsSections = [
  {
    title: "서비스 이용",
    body: "Soundlog는 위치와 여행 맥락을 바탕으로 음악 추천, 단일 리캡 저장, 여행 로그 생성을 제공하는 서비스입니다. 사용자는 본인의 기기와 계정에서 발생하는 활동에 대한 책임이 있습니다.",
  },
  {
    title: "계정 기반 이용",
    body: "Soundlog의 추천, 좋아요, 여행 기록, Recap 기능은 로그인된 Soundlog 계정에서 사용할 수 있습니다. 온보딩과 약관 확인은 로그인 전에도 볼 수 있지만, 앱의 주요 기능 이용에는 계정 로그인이 필요합니다.",
  },
  {
    title: "사용자 콘텐츠",
    body: "사용자가 촬영하거나 저장한 사진, 장소, 음악 메모, Recap 자료의 권리는 사용자에게 있습니다. Soundlog는 서비스 제공과 동기화, 공유 기능 제공을 위해 필요한 범위에서만 이를 처리합니다.",
  },
  {
    title: "외부 서비스",
    body: "장소 정보 등 공공 관광 데이터 제공자의 서비스가 사용될 수 있으며, 해당 데이터 제공자의 정책이 함께 적용될 수 있습니다. Soundlog는 앱 안에서 음악 추천과 기록 UI를 제공하며 외부 음원 재생을 보장하지 않습니다.",
  },
  {
    title: "제한 사항",
    body: "타인의 권리를 침해하는 콘텐츠, 불법적인 목적의 이용, 서비스 안정성을 해치는 행위는 허용되지 않습니다. 필요한 경우 서비스 이용이 제한될 수 있습니다.",
  },
  {
    title: "문의와 변경",
    body: `약관 또는 서비스 이용 문의는 ${SOUNDLOG_SUPPORT_EMAIL} 으로 보낼 수 있습니다. 약관이 변경되는 경우 앱 또는 스토어 고지를 통해 안내합니다.`,
  },
];

export default function TermsScreen() {
  return (
    <LegalDocumentScreen
      sections={termsSections}
      subtitle="Soundlog를 사용할 때 적용되는 기본 조건을 정리했습니다."
      title="서비스 이용약관"
      updatedAt="시행일 2026.06.24"
    />
  );
}
