import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { UnifiedCard } from '../../src/components/cards/UnifiedCard';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { Ionicons } from '@expo/vector-icons';
import { useServices } from '../../src/hooks/useServices';
import { usePostStore } from '../../src/store/postStore';

const FILTERS = ['نوع الخدمة', 'الموقع', 'السعر', 'التوافر'];

export default function ServicesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const { set, reset } = usePostStore();

  const handleAddService = () => {
    reset();
    set({ category: 'services' });
    router.push('/post/step2' as any);
  };

  const { data, isLoading, isError, refetch } = useServices();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={['#1f2937', '#374151', '#111827']} // Dark Theme to distinguish from Cars
        title="ســوق ون لخدمات السيارات"
        titleAccent="صيانة، فحص، وغسيل"
        navSearchPlaceholder="ابحث عن خدمة..."
        onNavSearchPress={() => router.push('/services/browse' as any)}
        heroSearchPlaceholder="عن أي خدمة تبحث؟"
        onHeroSearchPress={() => router.push('/services/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'أضف خدمة',
          icon: 'add-circle-outline',
          onPress: handleAddService,
          bgColor: Colors.white,
          textColor: '#1f2937'
        }}
        outlineCta={{
          label: 'تصفح المراكز',
          icon: 'business-outline',
          onPress: () => router.push('/services/browse' as any)
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      {isLoading ? (
        <View style={[s.grid, { paddingTop: insets.top + 185 + Spacing.space4 }]}>
          {[1, 2, 3, 4].map(i => <View key={i} style={s.fullCard}><SkeletonCard /></View>)}
        </View>
      ) : isError ? (
        <View style={[s.center, { paddingTop: insets.top + 185 + Spacing.space4 }]}>
          <Text style={s.errorTxt}>حدث خطأ أثناء تحميل البيانات</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          data={data ?? []}
          keyExtractor={i => i.id}
          contentContainerStyle={[s.list, { paddingTop: insets.top + 185 + Spacing.space4 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} progressViewOffset={insets.top + 185} />}
          ListHeaderComponent={
            <View style={s.headerWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
                {FILTERS.map((f, i) => (
                  <TouchableOpacity key={i} style={s.filterChip} activeOpacity={0.7}>
                    <Text style={s.filterTxt}>{f}</Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.text2} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.resultsCount}>{(data ?? []).length} نتيجة</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="build-outline" size={56} color={Colors.border} />
              <Text style={s.emptyTitle}>لا توجد خدمات</Text>
              <Text style={s.emptySubtitle}>تحقق لاحقاً للعثور على خدمات جديدة</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.fullCard}>
              <UnifiedCard item={item} onPress={() => router.push(`/services/${item.id}` as any)} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold', color: Colors.error, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.lg },
  retryTxt: { fontFamily: 'Almarai_700Bold', color: Colors.white },
  grid: { padding: Spacing.space4, gap: Spacing.space4 },
  list: { paddingBottom: Spacing.space6 },
  fullCard: { paddingHorizontal: Spacing.space5, paddingBottom: Spacing.space3 },
  headerWrap: { paddingBottom: Spacing.space3 },
  filtersScroll: { paddingHorizontal: Spacing.space5, paddingVertical: Spacing.space3, gap: Spacing.space2, alignItems: 'center', flexDirection: 'row-reverse' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    height: 34, borderRadius: Radius.sm, paddingHorizontal: Spacing.space3,
    backgroundColor: '#eceef1', borderWidth: 1, borderColor: '#c3c6d6',
  },
  filterTxt: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text2, writingDirection: 'rtl' },
  resultsCount: { fontFamily: 'Almarai_700Bold', fontSize: 18, color: Colors.text, writingDirection: 'rtl', paddingHorizontal: Spacing.space5 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.space3 },
  emptyTitle: { fontFamily: 'Almarai_700Bold', fontSize: 18, color: Colors.text, textAlign: 'center' },
  emptySubtitle: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text2, textAlign: 'center' },
});
