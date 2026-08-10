import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { useParts } from '../../src/hooks/useParts';
import { usePostStore } from '../../src/store/postStore';
import { useAuthStore } from '../../src/store/authStore';

import { PartsCategoriesGrid } from '../../src/components/parts/PartsCategoriesGrid';
import { PartHorizontalList } from '../../src/components/parts/PartHorizontalList';
import { PartsHowItWorks } from '../../src/components/parts/PartsHowItWorks';
import { PartsBottomBar } from '../../src/components/parts/PartsBottomBar';

export default function PartsLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const { set, reset } = usePostStore();
  const { isLoggedIn } = useAuthStore();

  const handleAddPart = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any);
      return;
    }
    reset();
    set({ category: 'parts' });
    router.push('/post/step2' as any);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fetch Parts Data
  const { data: allParts = [], isLoading: loadingParts } = useParts({ limit: 15 });
  const { data: originalPartsData = [], isLoading: loadingOriginal } = useParts({ isOriginal: true, limit: 10 });

  const featuredParts = allParts.slice(0, 5);
  const newParts = allParts.slice(5, 15);
  // Fallback to client-side filtering if backend doesn't filter by param
  const originalParts = originalPartsData.length > 0 
    ? originalPartsData 
    : allParts.filter(p => p.raw?.isOriginal === true || p.raw?.condition === 'NEW');

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as unknown as string[]}
        title="ســوق ون لقطع الغيار"
        titleAccent="قطع أصلية وتجارية وسكراب بأفضل الأسعار"
        navSearchPlaceholder="ابحث عن قطعة غيار..."
        onNavSearchPress={() => router.push('/parts/browse' as any)}
        heroSearchPlaceholder="عن أي قطعة تبحث؟ (محرك، فحمات، كشاف...)"
        onHeroSearchPress={() => router.push('/parts/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'أضف قطعة غيار',
          icon: 'add-circle-outline',
          onPress: handleAddPart,
        }}
        outlineCta={{
          label: 'تصفح القطع',
          icon: 'search-outline',
          onPress: () => router.push('/parts/browse' as any),
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 159 + Spacing.space4, paddingBottom: 110 }}
      >
        <View style={s.content}>
          <PartsCategoriesGrid />

          <PartHorizontalList
            title="قطع غيار مميزة"
            subTitle="أفضل القطع الموثوقة المتاحة حالياً"
            data={featuredParts}
            isLoading={loadingParts}
            emptyText="لا توجد قطع غيار مميزة حالياً"
            onSeeAll={() => router.push('/parts/browse' as any)}
            onPressItem={(item) => router.push(`/parts/${item.id}` as any)}
          />

          <PartHorizontalList
            title="قطع غيار أصلية"
            subTitle="قطع وكالة أصلية 100% معتمدة ومضمونة"
            data={originalParts}
            isLoading={loadingOriginal && loadingParts}
            emptyText="لا توجد قطع غيار أصلية حالياً"
            onSeeAll={() => router.push('/parts/browse?isOriginal=true' as any)}
            onPressItem={(item) => router.push(`/parts/${item.id}` as any)}
          />

          <PartHorizontalList
            title="أُضيف حديثاً"
            subTitle="أحدث قطع الغيار المضافة للسوق"
            data={newParts}
            isLoading={loadingParts}
            emptyText="لا توجد قطع غيار حديثة"
            onSeeAll={() => router.push('/parts/browse' as any)}
            onPressItem={(item) => router.push(`/parts/${item.id}` as any)}
          />

          <PartsHowItWorks />
        </View>
      </Animated.ScrollView>

      {/* ═══════════════ FLOATING BOTTOM BAR ═══════════════ */}
      <PartsBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5, gap: 28, paddingBottom: Spacing.space4 },
});
