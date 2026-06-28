import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { MusicPlatformId } from '@/types/domain';
import { getMusicPlatformOption, musicPlatformOptions } from '@/utils/musicPlatformLinks';

type MusicPlatformSettingsCardProps = {
  isSpotifyConfigured?: boolean;
  isSpotifyConnected?: boolean;
  isSpotifyConnecting?: boolean;
  onConnectSpotify?: () => void;
  onDisconnectSpotify?: () => void;
  onSelectPlatform: (id: MusicPlatformId) => void;
  selectedPlatformId: MusicPlatformId;
  spotifyDisplayName?: string;
  spotifyErrorMessage?: string;
};

export function MusicPlatformSettingsCard({
  isSpotifyConfigured = false,
  isSpotifyConnected = false,
  isSpotifyConnecting = false,
  onConnectSpotify,
  onDisconnectSpotify,
  onSelectPlatform,
  selectedPlatformId,
  spotifyDisplayName,
  spotifyErrorMessage,
}: MusicPlatformSettingsCardProps) {
  const selectedPlatform = getMusicPlatformOption(selectedPlatformId);
  const showSpotifyConnection = selectedPlatformId === 'spotify';

  return (
    <View className="mt-6 rounded-[22px] border border-white/10 bg-white/10 p-5">
      <View className="flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
          <Feather color="#fff" name="music" size={18} />
        </View>
        <View className="min-w-0 flex-1">
          <AppText className="text-sm font-semibold text-white/45">음악 플랫폼</AppText>
          <AppText className="mt-2 text-[20px] font-semibold text-white">
            {selectedPlatform.label}
          </AppText>
          <AppText className="mt-2 text-xs leading-5 text-white/50">
            Spotify 연결 시 재생 제어를 먼저 시도하고, 실패하면 외부 앱으로 열어요.
          </AppText>
        </View>
      </View>

      <View
        accessibilityLabel="음악 플랫폼 선택"
        accessibilityRole="radiogroup"
        className="mt-5 flex-row flex-wrap gap-2"
      >
        {musicPlatformOptions.map((option) => {
          const selected = option.id === selectedPlatformId;

          return (
            <Pressable
              key={option.id}
              accessibilityLabel={option.label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={`rounded-full border px-4 py-2 ${
                selected
                  ? 'border-[#7A8CFF] bg-[#243A75]'
                  : 'border-white/10 bg-white/5'
              }`}
              onPress={() => onSelectPlatform(option.id)}
            >
              <AppText className="text-xs font-semibold text-white">{option.shortLabel}</AppText>
            </Pressable>
          );
        })}
      </View>

      <AppText className="mt-4 text-xs leading-5 text-white/40">
        {selectedPlatform.description}
      </AppText>

      {showSpotifyConnection ? (
        <View className="mt-5 rounded-[16px] border border-white/10 bg-black/20 px-4 py-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <AppText className="text-sm font-semibold text-white">
                {isSpotifyConnected ? 'Spotify 연결됨' : 'Spotify 계정 연결'}
              </AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/48" numberOfLines={2}>
                {isSpotifyConnected
                  ? `${spotifyDisplayName ?? '내 Spotify'} 계정으로 재생 제어를 시도해요.`
                  : isSpotifyConfigured
                    ? '연결하면 재생, 일시정지, 이전/다음을 Spotify에 요청할 수 있어요.'
                    : 'EXPO_PUBLIC_SPOTIFY_CLIENT_ID 설정이 필요해요.'}
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              className={`min-w-[92px] items-center justify-center rounded-full px-4 py-2 ${
                isSpotifyConnected ? 'bg-white/10' : 'bg-[#1DB954]'
              }`}
              disabled={
                isSpotifyConnecting ||
                (!isSpotifyConnected && (!isSpotifyConfigured || !onConnectSpotify))
              }
              onPress={isSpotifyConnected ? onDisconnectSpotify : onConnectSpotify}
              style={{
                opacity:
                  isSpotifyConnecting ||
                  (!isSpotifyConnected && (!isSpotifyConfigured || !onConnectSpotify))
                    ? 0.5
                    : 1,
              }}
            >
              {isSpotifyConnecting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <AppText className="text-xs font-semibold text-white">
                  {isSpotifyConnected ? '해제' : '연결'}
                </AppText>
              )}
            </Pressable>
          </View>

          {spotifyErrorMessage ? (
            <View className="mt-3 rounded-[12px] border border-amber-300/20 bg-amber-300/10 px-3 py-2">
              <AppText className="text-xs leading-5 text-amber-100">
                {spotifyErrorMessage}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
