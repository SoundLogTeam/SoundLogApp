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
      <RecapBackground
        imageUrl={recap.backgroundImageUrl}
        overlayClassName="bg-black/28"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.78)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      <View className="absolute left-5 right-5 top-5 flex-row items-center justify-between">
        <View>
          <AppText className="text-[10px] font-semibold tracking-[2px] text-white/58">
            SOUNDLOG LP
          </AppText>
          <AppText
            className="mt-1 text-[18px] font-semibold text-white"
            numberOfLines={1}
          >
            {recap.placeName}
          </AppText>
        </View>
        <View className="h-9 w-9 items-center justify-center rounded-full border border-white/22 bg-white/10">
          <AppText className="text-[10px] font-semibold text-white/72">
            REC
          </AppText>
        </View>
      </View>

      <View className="absolute inset-x-0 top-[82px] items-center">
        <RecordDisc imageUrl={recap.discImageUrl ?? recap.backgroundImageUrl} />
      </View>

      <View className="absolute bottom-5 left-5 right-5 rounded-[18px] border border-white/16 bg-black/34 p-4">
        <View className="mb-3 h-px w-14 bg-white/45" />
        <AppText
          className="text-[24px] font-semibold leading-8 text-white"
          numberOfLines={2}
        >
          {recap.trackTitle}
        </AppText>
        <View className="mt-3 flex-row items-center justify-between gap-3">
          <AppText
            className="min-w-0 flex-1 text-xs font-medium text-white/76"
            numberOfLines={1}
          >
            {recap.artistName}
          </AppText>
          <AppText className="text-[10px] font-semibold tracking-[1.6px] text-white/46">
            TRAVEL CUT
          </AppText>
        </View>
      </View>
    </>
  );
}

function RecapAlbumTemplate({ recap }: { recap: RecapShare }) {
  return (
    <>
      <RecapBackground
        imageUrl={recap.backgroundImageUrl}
        overlayClassName="bg-black/22"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.82)']}
        end={{ x: 0.5, y: 1 }}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-4 rounded-[18px] border border-white/22" />

      <View className="absolute left-7 right-7 top-7 flex-row items-center justify-between">
        <AppText className="text-[11px] font-semibold tracking-[2.5px] text-white/75">
          SOUNDLOG
        </AppText>
        <View className="rounded-full border border-white/22 bg-white/10 px-3 py-1">
          <AppText className="text-[10px] font-medium text-white/70">
            ALBUM
          </AppText>
        </View>
      </View>

      <View className="absolute bottom-8 left-7 right-7">
        <AppText
          className="text-[12px] font-semibold tracking-[1.8px] text-white/62"
          numberOfLines={1}
        >
          {recap.placeName}
        </AppText>
        <AppText
          className="mt-3 text-[32px] font-semibold leading-9 text-white"
          numberOfLines={2}
        >
          {recap.trackTitle}
        </AppText>
        <View className="mt-5 flex-row items-center gap-3">
          <View className="h-px flex-1 bg-white/42" />
          <AppText className="text-[11px] font-semibold text-white/58">
            SIDE A
          </AppText>
        </View>
        <View className="mt-4 rounded-[16px] bg-white/12 px-4 py-3">
          <AppText
            className="text-sm font-medium text-white/82"
            numberOfLines={1}
          >
            {recap.artistName}
          </AppText>
        </View>
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
  const moments = (
    recap.moments?.length ? recap.moments : [createFallbackMoment(recap)]
  ).slice(0, 3);

  return (
    <>
      <LinearGradient
        colors={['#060812', '#15111E', '#2A1726']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-5 rounded-[18px] border border-white/10" />
      <View className="absolute inset-y-0 left-3 justify-around py-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`left-${index}`}
            className="h-3 w-2 rounded-sm bg-white/20"
          />
        ))}
      </View>
      <View className="absolute inset-y-0 right-3 justify-around py-5">
        {Array.from({ length: 8 }).map((_, index) => (
          <View
            key={`right-${index}`}
            className="h-3 w-2 rounded-sm bg-white/20"
          />
        ))}
      </View>

      <View className="absolute left-8 right-8 top-6">
        <AppText className="text-[11px] font-semibold tracking-[2px] text-white/55">
          SOUNDLOG FILM
        </AppText>
        <AppText
          className="mt-2 text-[24px] font-semibold text-white"
          numberOfLines={1}
        >
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
            <View className="absolute inset-0 bg-black/34" />
            <View className="absolute bottom-3 left-3 right-3">
              <AppText className="text-[10px] font-semibold text-white/55">
                {String(index + 1).padStart(2, '0')}
              </AppText>
              <AppText
                className="mt-1 text-[13px] font-semibold text-white"
                numberOfLines={1}
              >
                {moment.trackTitle}
              </AppText>
              <AppText
                className="mt-1 text-[10px] text-white/68"
                numberOfLines={1}
              >
                {moment.placeName}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

function RecapMapTemplate({ recap }: { recap: RecapShare }) {
  const moments = (
    recap.moments?.length ? recap.moments : [createFallbackMoment(recap)]
  ).slice(0, 4);
  const pinPositions = [
    { left: 54, top: 126 },
    { left: 190, top: 92 },
    { left: 226, top: 220 },
    { left: 104, top: 270 },
  ];

  return (
    <>
      <LinearGradient
        colors={['#07131F', '#0E2532', '#1D1D36']}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View className="absolute inset-5 overflow-hidden rounded-[18px] border border-white/10 bg-white/5">
        {Array.from({ length: 5 }).map((_, index) => (
          <View
            className="absolute left-0 right-0 h-px"
            key={`h-${index}`}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              top: `${18 + index * 16}%`,
            }}
          />
        ))}
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            className="absolute bottom-0 top-0 w-px"
            key={`v-${index}`}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              left: `${20 + index * 20}%`,
            }}
          />
        ))}
        <View
          className="absolute h-20 w-[150%] rounded-full border"
          style={{
            borderColor: 'rgba(183,230,40,0.3)',
            left: '-20%',
            top: '42%',
            transform: [{ rotate: '-24deg' }],
          }}
        />
        <View
          className="absolute h-16 w-[130%] rounded-full border"
          style={{
            borderColor: 'rgba(158,168,255,0.24)',
            left: '-12%',
            top: '18%',
            transform: [{ rotate: '28deg' }],
          }}
        />
      </View>

      <View className="absolute left-7 right-7 top-7">
        <AppText className="text-[11px] font-semibold tracking-[2px] text-[#B7E628]">
          SOUNDLOG MAP
        </AppText>
        <AppText className="mt-2 text-[25px] font-semibold leading-8 text-white" numberOfLines={2}>
          {recap.placeName}
        </AppText>
      </View>

      {moments.map((moment, index) => (
        <View
          className="absolute items-center"
          key={moment.id}
          style={pinPositions[index]}
        >
          <View className="h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-[#B7E628]">
            <AppText className="text-[11px] font-semibold text-[#050916]">
              {index + 1}
            </AppText>
          </View>
          <View className="mt-1 rounded-full bg-black/60 px-2 py-1">
            <AppText className="text-[9px] font-semibold text-white" numberOfLines={1}>
              {moment.placeName}
            </AppText>
          </View>
        </View>
      ))}

      <View className="absolute bottom-6 left-6 right-6 rounded-[18px] border border-white/10 bg-black/60 p-4">
        <AppText className="text-[10px] font-semibold text-white/55">
          대표 사운드
        </AppText>
        <AppText className="mt-2 text-[22px] font-semibold text-white" numberOfLines={1}>
          {recap.trackTitle}
        </AppText>
        <AppText className="mt-2 text-xs font-medium text-white/70" numberOfLines={1}>
          {moments.length}개 장소 · {recap.artistName}
        </AppText>
      </View>
    </>
  );
}

export function RecapPreviewCard({
  recap,
  template = 'lp',
}: RecapPreviewCardProps) {
  return (
    <View className="h-full w-full overflow-hidden rounded-[20px] border border-white/15 bg-black/60">
      {template === 'album' ? <RecapAlbumTemplate recap={recap} /> : null}
      {template === 'lp' ? <RecapLpTemplate recap={recap} /> : null}
      {template === 'film' ? <RecapFilmTemplate recap={recap} /> : null}
      {template === 'map' ? <RecapMapTemplate recap={recap} /> : null}
    </View>
  );
}
