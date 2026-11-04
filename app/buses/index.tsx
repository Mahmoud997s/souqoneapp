import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { useGlassSupport } from '../../src/components/navigation/glassSupport';

// Feature Components
import { BusCategoriesGrid } from '../../src/components/buses/landing/BusCategoriesGrid';
import { BusHorizontalList } from '../../src/components/buses/landing/BusHorizontalList';
import { useBuses } from '../../src/hooks/useBuses';
import { BusesHowItWorks } from '../../src/components/buses/landing/BusesHowItWorks';
import { BusesBottomBar } from '../../src/components/buses/BusesBottomBar';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';
import { navigateToBusForm } from '../../src/components/ui/DraftResumePrompt';
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';
import { scheduleIdleTask } from '../../src/utils/scheduleIdleTask';

export default function BusesLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollHandler, scrollY } = useScrollAwareNav();
  const glassSupport = useGlassSupport();

  const handleAddBus = useCallback(() => navigateToBusForm(), []);
  const handlePressBus = useCallback((item: any) => router.push(`/buses/${item.id}` as any), [router]);
  const handleBrowseAll = useCallback(() => router.push('/buses/browse' as any), [router]);
  const handleSeeAllNewest = useCallback(() => router.push('/buses/browse?sort=newest'), [router]);
  const handleSeeAllPremium = useCallback(() => router.push('/buses/browse?isPremium=true'), [router]);
  const handleSeeAllSale = useCallback(() => router.push('/buses/browse?busListingType=BUS_SALE'), [router]);
  const handleSeeAllContract = useCallback(() => router.push('/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT'), [router]);
  const handleSeeAllRent = useCallback(() => router.push('/buses/browse?busListingType=BUS_RENT'), [router]);
  const handleNotifications = useCallback(() => router.push('/profile/notifications' as any), [router]);
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.push('/');
  }, [router]);

  const [loadRest, setLoadRest] = useState(false);
  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const task = scheduleIdleTask(() => {
      timeout = setTimeout(() => setLoadRest(true), 150);
    });
    return () => {
      task.cancel();
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  // Stable, cached queries at the screen root (Matching Cars architecture)
  const { data: newestBuses = [], isLoading: loadingNewest } = useBuses(
    { sort: 'newest', limit: 8 },
    { enabled: loadRest }
  );
  const { data: saleBuses = [], isLoading: loadingSale } = useBuses(
    { busListingType: 'BUS_SALE', limit: 8 },
    { enabled: loadRest }
  );
  const { data: contractBuses = [], isLoading: loadingContract } = useBuses(
    { busListingType: 'BUS_SALE_WITH_CONTRACT', limit: 8 },
    { enabled: loadRest }
  );
  const { data: rentBuses = [], isLoading: loadingRent } = useBuses(
    { busListingType: 'BUS_RENT', limit: 8 },
    { enabled: loadRest }
  );

  // Safe client-side derivation of premium buses (eliminates 400 Bad Request error)
  const premiumBuses = React.useMemo(() => {
    return newestBuses.filter((b: any) => b.isPremium || b.raw?.isPremium);
  }, [newestBuses]);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── STICKY HEADER ── */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        glassSupport={glassSupport}
        title="ســوق ون للحافلات"
        titleAccent="حافلات للبيع وللإيجار ونقل الركاب"
        navSearchPlaceholder="ابحث عن حافلة..."
        onNavSearchPress={handleBrowseAll}
        heroSearchPlaceholder="عن أي حافلة تبحث؟"
        onHeroSearchPress={handleBrowseAll}
        onBackPress={handleBack}
        headerIcon="notifications-outline"
        onHeaderIconPress={handleNotifications}
        primaryCta={{
          label: 'اعرض حافلتك',
          icon: 'add',
          onPress: handleAddBus,
          bgColor: 'rgba(255,255,255,0.2)',
          textColor: Colors.white,
        }}
        outlineCta={{
          label: 'تصفح الحافلات',
          icon: 'bus-outline',
          onPress: handleBrowseAll,
        }}
      />

      {/* ── SCROLLABLE CONTENT ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 106 + Spacing.space5,
          paddingBottom: UNIFIED_BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12) + 8,
        }}
      >
        <View style={s.content}>
          <BusCategoriesGrid support={glassSupport} />

          {/* LISTS */}
          {loadRest && (
            <>
              <BusHorizontalList
                title="أحدث اعلانات الحافلات"
                subTitle="تصفح أحدث عروض وإعلانات الحافلات المضافة"
                data={newestBuses}
                isLoading={loadingNewest}
                emptyText="لا توجد حافلات مضافة حالياً"
                onSeeAll={handleSeeAllNewest}
                onPressItem={handlePressBus}
                glassSupport={glassSupport}
              />

              {premiumBuses.length > 0 && (
                <BusHorizontalList
                  title="حافلات مميزة"
                  subTitle="إعلانات موثوقة ومختارة بعناية"
                  data={premiumBuses}
                  isLoading={loadingNewest}
                  emptyText="لا توجد حافلات مميزة حالياً"
                  onSeeAll={handleSeeAllPremium}
                  onPressItem={handlePressBus}
                  glassSupport={glassSupport}
                />
              )}

              <BusHorizontalList
                title="حافلات للبيع"
                subTitle="تصفح أفضل عروض بيع الحافلات"
                data={saleBuses}
                isLoading={loadingSale}
                emptyText="لا توجد حافلات للبيع حالياً"
                onSeeAll={handleSeeAllSale}
                onPressItem={handlePressBus}
                glassSupport={glassSupport}
              />

              <BusHorizontalList
                title="حافلات للبيع بعقد"
                subTitle="حافلات مع عقود تشغيل قائمة ومضمونة"
                data={contractBuses}
                isLoading={loadingContract}
                emptyText="لا توجد حافلات للبيع بعقد حالياً"
                onSeeAll={handleSeeAllContract}
                onPressItem={handlePressBus}
                glassSupport={glassSupport}
              />

              <BusHorizontalList
                title="حافلات للإيجار"
                subTitle="خيارات تأجير مرنة ومتنوعة"
                data={rentBuses}
                isLoading={loadingRent}
                emptyText="لا توجد حافلات للإيجار حالياً"
                onSeeAll={handleSeeAllRent}
                onPressItem={handlePressBus}
                glassSupport={glassSupport}
              />
            </>
          )}

          <BusesHowItWorks />

          {/* Unified Action Banner & Support Help */}
          <SectionFooterAction
            isLanding
            title="لديك حافلة للبيع أو للإيجار؟"
            subtitle="انشر إعلانك الآن ووصل لآلاف المشترين في منطقتك"
            buttonText="أضف إعلانك"
            iconName="bus-outline"
            iconImage={CATEGORY_ICONS.buses}
            onPress={handleAddBus}
          />
        </View>
      </Animated.ScrollView>

      <BusesBottomBar glassSupport={glassSupport} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: {
    paddingHorizontal: Spacing.space5,
    gap: 20,
    paddingBottom: 0,
  },
});
