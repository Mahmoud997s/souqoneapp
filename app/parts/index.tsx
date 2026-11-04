import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { useGlassSupport } from '../../src/components/navigation/glassSupport';
import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { useParts } from '../../src/hooks/useParts';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { navigateToPartForm } from '../../src/components/ui/DraftResumePrompt';

import { PartsCategoriesGrid } from '../../src/components/parts/PartsCategoriesGrid';
import { PartHorizontalList } from '../../src/components/parts/PartHorizontalList';
import { PartsHowItWorks } from '../../src/components/parts/PartsHowItWorks';
import { PartsBottomBar } from '../../src/components/parts/PartsBottomBar';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';

export default function PartsLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollHandler, scrollY } = useScrollAwareNav();
  const glassSupport = useGlassSupport();

  const handleAddPart = useCallback(() => navigateToPartForm(), []);
  const handlePressPart = useCallback((item: any) => router.push(`/parts/${item.id}` as any), [router]);
  const handleBrowseAll = useCallback(() => router.push('/parts/browse' as any), [router]);
  const handleSeeAllOriginal = useCallback(() => router.push('/parts/browse?isOriginal=true' as any), [router]);
  const handleNotifications = useCallback(() => router.push('/profile/notifications' as any), [router]);
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.push('/');
  }, [router]);


  // Fetch Parts Data
  const { data: allParts = [], isLoading: loadingParts } = useParts({ limit: 15 });
  const { data: originalPartsData = [], isLoading: loadingOriginal } = useParts({ isOriginal: true, limit: 10 });

  const featuredParts = useMemo(() => allParts.slice(0, 5), [allParts]);
  const newParts = useMemo(() => allParts.slice(5, 15), [allParts]);
  // Fallback to client-side filtering if backend doesn't filter by param
  const originalParts = useMemo(
    () =>
      originalPartsData.length > 0
        ? originalPartsData
        : allParts.filter(p => p.raw?.isOriginal === true || p.raw?.condition === 'NEW'),
    [allParts, originalPartsData]
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        glassSupport={glassSupport}
        title="ســوق ون لقطع الغيار"
        titleAccent="قطع أصلية وتجارية وسكراب بأفضل الأسعار"
        navSearchPlaceholder="ابحث عن قطعة غيار..."
        onNavSearchPress={handleBrowseAll}
        heroSearchPlaceholder="عن أي قطعة تبحث؟ (محرك، فحمات، كشاف...)"
        onHeroSearchPress={handleBrowseAll}
        onBackPress={handleBack}
        headerIcon="notifications-outline"
        onHeaderIconPress={handleNotifications}
        primaryCta={{
          label: 'أضف قطعة غيار',
          icon: 'add-circle-outline',
          onPress: handleAddPart,
          bgColor: Colors.accent,
          textColor: Colors.white
        }}
        outlineCta={{
          label: 'تصفح القطع',
          icon: 'search-outline',
          onPress: handleBrowseAll,
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 106 + Spacing.space5, paddingBottom: 100 }}
      >
        <View style={s.content}>
          <PartsCategoriesGrid support={glassSupport} />

          <PartHorizontalList
            title="قطع غيار مميزة"
            subTitle="أفضل القطع الموثوقة المتاحة حالياً"
            data={featuredParts}
            isLoading={loadingParts}
            emptyText="لا توجد قطع غيار مميزة حالياً"
            onSeeAll={handleBrowseAll}
            onPressItem={handlePressPart}
            glassSupport={glassSupport}
          />

          <PartHorizontalList
            title="قطع غيار أصلية"
            subTitle="قطع وكالة أصلية 100% معتمدة ومضمونة"
            data={originalParts}
            isLoading={loadingOriginal && loadingParts}
            emptyText="لا توجد قطع غيار أصلية حالياً"
            onSeeAll={handleSeeAllOriginal}
            onPressItem={handlePressPart}
            glassSupport={glassSupport}
          />

          <PartHorizontalList
            title="أُضيف حديثاً"
            subTitle="أحدث قطع الغيار المضافة للسوق"
            data={newParts}
            isLoading={loadingParts}
            emptyText="لا توجد قطع غيار حديثة"
            onSeeAll={handleBrowseAll}
            onPressItem={handlePressPart}
            glassSupport={glassSupport}
          />

          <PartsHowItWorks />

          {/* Unified Action Banner & Support Help */}
          <SectionFooterAction
            isLanding
            title="لديك قطع غيار للبيع؟"
            subtitle="انشر إعلانك الآن ووصل لآلاف المشترين في منطقتك"
            buttonText="أضف إعلانك"
            iconName="construct-outline"
            iconImage={CATEGORY_ICONS.parts}
            onPress={handleAddPart}
          />
        </View>
      </Animated.ScrollView>

      {/* ═══════════════ FLOATING BOTTOM BAR ═══════════════ */}
      <PartsBottomBar glassSupport={glassSupport} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5, gap: 20, paddingBottom: Spacing.space4 },
});
