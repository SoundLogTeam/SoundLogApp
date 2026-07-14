import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlaceSearchQuery } from '@/api/tourQueries';
import { AppText } from '@/components/AppText';
import type { PlaceContext } from '@/types/domain';

const suggestedQueries = ['광안리', '서울', '카페', '야경'];
const SEARCH_DEBOUNCE_MS = 300;

type ManualPlacePickerModalProps = {
  onClose: () => void;
  onSelect: (place: PlaceContext) => void;
  visible: boolean;
};

export function ManualPlacePickerModal({
  onClose,
  onSelect,
  visible,
}: ManualPlacePickerModalProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const placeSearchQuery = usePlaceSearchQuery({
    enabled: visible,
    query: debouncedQuery,
  });

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setDebouncedQuery('');
    }
  }, [visible]);

  const results = placeSearchQuery.data ?? [];
  const isWaitingForDebounce = query.trim() !== debouncedQuery;
  const isLoading = isWaitingForDebounce || placeSearchQuery.isFetching;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-soundlog-bg"
      >
        <View
          className="flex-1 px-5"
          style={{ paddingBottom: Math.max(insets.bottom, 18), paddingTop: insets.top + 12 }}
        >
          <View className="flex-row items-center justify-between gap-4">
            <View className="min-w-0 flex-1">
              <AppText className="text-[26px] font-semibold text-white">장소 직접 선택</AppText>
              <AppText className="mt-1 text-xs leading-5 text-white/50">
                위치 권한 없이도 선택한 장소를 기준으로 음악을 추천해요.
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="장소 선택 닫기"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-full bg-white/10"
              onPress={onClose}
            >
              <Feather color="#fff" name="x" size={20} />
            </Pressable>
          </View>

          <View className="mt-6 min-h-[54px] flex-row items-center rounded-[16px] border border-white/10 bg-white/10 px-4">
            <Feather color="rgba(255,255,255,0.55)" name="search" size={18} />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className="ml-3 min-w-0 flex-1 text-base text-white"
              onChangeText={setQuery}
              placeholder="관광지, 동네, 카페를 검색하세요"
              placeholderTextColor="rgba(255,255,255,0.35)"
              returnKeyType="search"
              value={query}
            />
            {query ? (
              <Pressable
                accessibilityLabel="장소 검색어 지우기"
                accessibilityRole="button"
                className="h-9 w-9 items-center justify-center"
                onPress={() => setQuery('')}
              >
                <Feather color="rgba(255,255,255,0.55)" name="x-circle" size={18} />
              </Pressable>
            ) : null}
          </View>

          {!query ? (
            <View className="mt-5">
              <AppText className="text-xs font-semibold text-white/45">빠른 검색</AppText>
              <View className="mt-3 flex-row flex-wrap gap-2">
                {suggestedQueries.map((suggestion) => (
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-10 justify-center rounded-full border border-white/10 bg-white/[0.06] px-4"
                    key={suggestion}
                    onPress={() => setQuery(suggestion)}
                  >
                    <AppText className="text-sm font-semibold text-white/70">{suggestion}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          <ScrollView
            className="mt-5 flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View className="items-center py-12">
                <ActivityIndicator color="#B7E628" />
                <AppText className="mt-3 text-sm text-white/55">장소를 찾고 있어요</AppText>
              </View>
            ) : placeSearchQuery.isError ? (
              <Pressable
                accessibilityRole="button"
                className="rounded-[16px] border border-amber-300/20 bg-amber-300/10 p-4"
                onPress={() => void placeSearchQuery.refetch()}
              >
                <AppText className="text-sm font-semibold text-amber-100">
                  장소를 불러오지 못했어요
                </AppText>
                <AppText className="mt-1 text-xs text-amber-100/70">눌러서 다시 시도하세요.</AppText>
              </Pressable>
            ) : debouncedQuery && results.length === 0 ? (
              <View className="items-center py-12">
                <Feather color="rgba(255,255,255,0.35)" name="map-pin" size={28} />
                <AppText className="mt-4 text-base font-semibold text-white">
                  검색된 장소가 없어요
                </AppText>
                <AppText className="mt-2 text-center text-xs leading-5 text-white/45">
                  더 넓은 지역명이나 다른 키워드로 검색해보세요.
                </AppText>
              </View>
            ) : (
              <View className="gap-2">
                {results.map((place) => {
                  const canSelect = Boolean(place.location);

                  return (
                    <Pressable
                      accessibilityLabel={`${place.title} 추천 장소로 선택`}
                      accessibilityRole="button"
                      className="min-h-[72px] flex-row items-center rounded-[16px] border border-white/10 bg-white/[0.06] px-4 py-3"
                      disabled={!canSelect}
                      key={place.id}
                      onPress={() => onSelect(place)}
                      style={{ opacity: canSelect ? 1 : 0.45 }}
                    >
                      <View className="h-11 w-11 items-center justify-center rounded-full bg-white/10">
                        <Feather color="#B7E628" name="map-pin" size={18} />
                      </View>
                      <View className="ml-3 min-w-0 flex-1">
                        <AppText className="text-base font-semibold text-white" numberOfLines={1}>
                          {place.title}
                        </AppText>
                        <AppText className="mt-1 text-xs text-white/45" numberOfLines={1}>
                          {[place.category, place.address].filter(Boolean).join(' · ') ||
                            (canSelect ? '장소 정보' : '추천 좌표 없음')}
                        </AppText>
                      </View>
                      <Feather color="rgba(255,255,255,0.45)" name="chevron-right" size={18} />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
