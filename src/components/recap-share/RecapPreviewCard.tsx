import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { RecordDisc } from '@/components/recap-share/RecordDisc';
import { RecapShare, RecapShareMoment, RecapTemplateId } from '@/types/domain';

type RecapPreviewCardProps = {
  recap: RecapShare;
  template?: RecapTemplateId;
};

function RecapBackground({
  imageUrl,
  overlayClassName = 'bg-black/35',
}: {
  imageUrl?: string;
  overlayClassName?: string;
}) {
  return (
    <>
      {imageUrl ? (
        <Image
          contentFit="cover"
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFill}
          transition={300}
        />
      ) : (
        <LinearGradient
          colors={['#10172A', '#251339', '#392136']}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}

      <View className={`absolute inset-0 ${overlayClassName}`} />
    </>
  );
}

function RecapLpTemplate({ recap }: { recap: RecapShare }) {
  return (
    <>
      <RecapBackground imageUrl={recap.backgroundImageUrl} />
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.62)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <AppText
        className="absolute left-5 right-5 top-6 text-base font-semibold text-white"
        numberOfLines={1}
      >
        {recap.placeName}
      </AppText>

      <View className="absolute inset-x-0 top-[88px] items-center">
        <RecordDisc imageUrl={recap.discImageUrl ?? recap.backgroundImageUrl} />
      </View>

      <View className="absolute bottom-6 left-5 right-5">
        <AppText className="text-[24px] font-semibold leading-8 text-white" numberOfLines={1}>
          {recap.trackTitle}
        </AppText>
        <AppText className="mt-1 text-xs font-medium text-white/80" numberOfLines={1}>
          {recap.artistName}
        </AppText>
      </View>
    </>
  );
}

function RecapAlbumTemplate({ recap }: { recap: RecapShare }) {
  return (
    <>
      <RecapBackground imageUrl={recap.backgroundImageUrl} overlayClassName="bg-black/30" />
      <LinearGradient
        colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View className="absolute left-5 right-5 top-6 flex-row items-center justify-between">
        <AppText className="text-[11px] font-semibold tracking-[2px] text-white/75">
          SOUNDLOG
        </AppText>
        <View className="rounded-full border border-white/20 px-3 py-1">
          <AppText className="text-[10px] font-medium text-white/70">ALBUM</AppText>
        </View>
      </View>

      <View className="absolute bottom-8 left-5 right-5">
        <AppText className="text-[13px] font-semibold text-white/70" numberOfLines={1}>
          {recap.placeName}
        </AppText>
        <AppText className="mt-3 text-[30px] font-semibold leading-9 text-white" numberOfLines={2}>
          {recap.trackTitle}
        </AppText>
        <View className="mt-4 h-px w-16 bg-white/60" />
        <AppText className="mt-4 text-sm font-medium text-white/80" numberOfLines={1}>
          {recap.artistName}
        </AppText>
      </View>
    </>
  );
}

function createFallbackMoment(recap: RecapShare): RecapShareMoment {
  return {
    artistName: recap.artistName,
    id: recap.id,
    imageUrl: recap.backgroundImageUrl,
    placeName: recap.placeName,
    recordedAt: recap.recordedAt,
    trackTitle: recap.trackTitle,
  };
}

function RecapFilmTemplate({ recap }: { recap: RecapShare }) {
  const moments = (recap.moments?.length ? recap.moments : [createFallbackMoment(recap)]).slice(
    0,
    3,
  );

  return (
    <>
      <LinearGradient
        colors={['#090C14', '#16111E', '#261A27']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-y-0 left-3 justify-around py-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={`left-${index}`} className="h-3 w-2 rounded-sm bg-white/16" />
        ))}
      </View>
      <View className="absolute inset-y-0 right-3 justify-around py-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={`right-${index}`} className="h-3 w-2 rounded-sm bg-white/16" />
        ))}
      </View>

      <View className="absolute left-8 right-8 top-6">
        <AppText className="text-[11px] font-semibold tracking-[2px] text-white/55">
          SOUNDLOG FILM
        </AppText>
        <AppText className="mt-1 text-[22px] font-semibold text-white" numberOfLines={1}>
          {recap.placeName}
        </AppText>
      </View>

      <View className="absolute bottom-6 left-8 right-8 gap-3">
        {moments.map((moment, index) => (
          <View
            key={moment.id}
            className="h-[82px] overflow-hidden rounded-[14px] border border-white/12 bg-white/[0.06]"
          >
            {moment.imageUrl ? (
              <Image
                contentFit="cover"
                source={{ uri: moment.imageUrl }}
                style={StyleSheet.absoluteFill}
                transition={250}
              />
            ) : (
              <LinearGradient
                colors={['#1F2A44', '#2B176C']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View className="absolute inset-0 bg-black/42" />
            <View className="absolute bottom-3 left-3 right-3">
              <AppText className="text-[10px] font-semibold text-white/55">
                {String(index + 1).padStart(2, '0')}
              </AppText>
              <AppText className="mt-1 text-[13px] font-semibold text-white" numberOfLines={1}>
                {moment.trackTitle}
              </AppText>
              <AppText className="mt-1 text-[10px] text-white/68" numberOfLines={1}>
                {moment.placeName}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

export function RecapPreviewCard({ recap, template = 'lp' }: RecapPreviewCardProps) {
  return (
    <View className="h-full w-full overflow-hidden rounded-[20px] border border-white/15 bg-black/60">
      {template === 'album' ? <RecapAlbumTemplate recap={recap} /> : null}
      {template === 'lp' ? <RecapLpTemplate recap={recap} /> : null}
      {template === 'film' ? <RecapFilmTemplate recap={recap} /> : null}
    </View>
  );
}
