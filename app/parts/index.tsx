import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { useParts } from '../../src/hooks/useParts';

import { PartsCategoriesGrid } from '../../src/components/parts/PartsCategoriesGrid';
import { PartHorizontalList } from '../../src/components/parts/PartHorizontalList';

export default function PartsLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Fetch Parts Data
  const { data: allParts = [], isLoading: loadingParts } = useParts({ limit: 15 });
  const featuredParts = allParts.slice(0, 5);
  const newParts = allParts.slice(5, 15);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={['#1f2937', '#374151', '#111827']} // Dark Gray Theme
        title="ســوق ون لقطع الغيار"
        titleAccent="اطلب القطعة التي تحتاجها بسهولة"
        navSearchPlaceholder="ابحث عن قطعة غيار..."
        onNavSearchPress={() => router.push('/parts/browse' as any)}
        heroSearchPlaceholder="عن أي قطعة تبحث؟"
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
          onPress: () => router.push('/post' as any), // Or '/parts/new' if exists
          bgColor: Colors.white,
          textColor: '#1f2937'
        }}
        outlineCta={{
          label: 'تصفح المتاجر',
          icon: 'business-outline',
          onPress: () => router.push('/parts/browse' as any)
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 185 + Spacing.space4, paddingBottom: 100 }}
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
            title="أُضيف حديثاً"
            subTitle="أحدث قطع الغيار المضافة للسوق"
            data={newParts}
            isLoading={loadingParts}
            emptyText="لا توجد قطع غيار حديثة"
            onSeeAll={() => router.push('/parts/browse' as any)}
            onPressItem={(item) => router.push(`/parts/${item.id}` as any)}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5 },
});
