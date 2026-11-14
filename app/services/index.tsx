import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { useGlassSupport } from '../../src/components/navigation/glassSupport';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';

import { useServices } from '../../src/hooks/useServices';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { navigateToServiceForm } from '../../src/components/ui/DraftResumePrompt';

import { ServicesCategoriesGrid } from '../../src/components/services/ServicesCategoriesGrid';
import { ServiceHorizontalList } from '../../src/components/services/ServiceHorizontalList';
import { ServicesHowItWorks } from '../../src/components/services/ServicesHowItWorks';
import { ServicesBottomBar } from '../../src/components/services/ServicesBottomBar';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';
import { scheduleIdleTask } from '../../src/utils/scheduleIdleTask';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';
import { StaleDataBanner } from '../../src/components/listing-detail/StaleDataBanner';

export default function ServicesLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollHandler, scrollY } = useScrollAwareNav();
  const glassSupport = useGlassSupport();

  const handleAddService = useCallback(() => {
    navigateToServiceForm();
  }, []);
  const handlePressService = useCallback(
    (item: { id: string }) => router.push(`/services/${item.id}` as any),
    [router]
  );
  const handleBrowseAll = useCallback(() => router.push('/services/browse' as any), [router]);
  const handleSeeAllHome = useCallback(() => router.push('/services/browse?isHomeService=true' as any), [router]);
  const handleSeeAllMaintenance = useCallback(() => router.push('/services/browse?serviceType=MAINTENANCE' as any), [router]);
  const handleSeeAllCleaning = useCallback(() => router.push('/services/browse?serviceType=CLEANING' as any), [router]);
  const handleSeeAllOther = useCallback(() => router.push('/services/browse?serviceType=OTHER_SERVICE' as any), [router]);
  const handleNotifications = useCallback(() => router.push('/profile/notifications' as any), [router]);
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.push('/');
  }, [router]);


  // Data fetching logic
  const {
    data: baseData = [],
    isLoading: loadingData,
    isError: isBaseError,
    error: baseError,
    refetch: refetchBase,
    isRefetchError: isBaseRefetchError,
    isRefetching: isBaseRefetching,
  } = useServices({ limit: 20 });
  const homeServices = useMemo(() => baseData.filter(item => item.raw?.isHomeService).slice(0, 10), [baseData]);
  
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

  const {
    data: maintenanceServices = [],
    isLoading: loadingMaintenance,
    isError: isMaintenanceError,
    error: maintenanceError,
    refetch: refetchMaintenance,
    isRefetchError: isMaintenanceRefetchError,
    isRefetching: isMaintenanceRefetching,
  } = useServices({ serviceType: 'MAINTENANCE', limit: 10 }, { enabled: loadRest });
  const {
    data: cleaningServices = [],
    isLoading: loadingCleaning,
    isError: isCleaningError,
    error: cleaningError,
    refetch: refetchCleaning,
    isRefetchError: isCleaningRefetchError,
    isRefetching: isCleaningRefetching,
  } = useServices({ serviceType: 'CLEANING', limit: 10 }, { enabled: loadRest });
  const {
    data: otherServices = [],
    isLoading: loadingOther,
    isError: isOtherError,
    error: otherError,
    refetch: refetchOther,
    isRefetchError: isOtherRefetchError,
    isRefetching: isOtherRefetching,
  } = useServices({ serviceType: 'OTHER_SERVICE', limit: 10 }, { enabled: loadRest });

  const hasStaleRefetchError =
    (isBaseRefetchError && baseData.length > 0) ||
    (isMaintenanceRefetchError && maintenanceServices.length > 0) ||
    (isCleaningRefetchError && cleaningServices.length > 0) ||
    (isOtherRefetchError && otherServices.length > 0);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        glassSupport={glassSupport}
        title="ســوق ون لخدمات السيارات"
        titleAccent="صيانة، فحص، وغسيل"
        navSearchPlaceholder="ابحث عن خدمة..."
        onNavSearchPress={handleBrowseAll}
        heroSearchPlaceholder="عن أي خدمة تبحث؟"
        onHeroSearchPress={handleBrowseAll}
        onBackPress={handleBack}
        headerIcon="notifications-outline"
        onHeaderIconPress={handleNotifications}
        primaryCta={{
          label: 'أضف خدمة',
          icon: 'add',
          onPress: handleAddService,
          bgColor: Colors.accent,
          textColor: Colors.white
        }}
        outlineCta={{
          label: 'تصفح المراكز',
          icon: 'business-outline',
          onPress: handleBrowseAll
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
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
          {hasStaleRefetchError && (
            <View style={{ marginBottom: Spacing.space3 }}>
              <StaleDataBanner
                onRetry={() => {
                  if (isBaseRefetchError) refetchBase();
                  if (isMaintenanceRefetchError) refetchMaintenance();
                  if (isCleaningRefetchError) refetchCleaning();
                  if (isOtherRefetchError) refetchOther();
                }}
                isRefetching={
                  isBaseRefetching ||
                  isMaintenanceRefetching ||
                  isCleaningRefetching ||
                  isOtherRefetching
                }
              />
            </View>
          )}

          <ServicesCategoriesGrid support={glassSupport} />

          <ServiceHorizontalList
            title="خدمات متنقلة"
            subTitle="خدمات تصلك أينما كنت"
            data={homeServices}
            isLoading={loadingData}
            isError={isBaseError && homeServices.length === 0}
            error={baseError}
            onRetry={refetchBase}
            isRefetchError={isBaseRefetchError}
            isRefetching={isBaseRefetching}
            emptyText="لا توجد خدمات متنقلة حالياً"
            onSeeAll={handleSeeAllHome}
            onPressItem={handlePressService}
            glassSupport={glassSupport}
          />

          {loadRest && (
            <>
              <ServiceHorizontalList
                title="خدمات الصيانة"
                subTitle="أفضل ورش الصيانة لسيارتك"
                data={maintenanceServices}
                isLoading={loadingMaintenance}
                isError={isMaintenanceError && maintenanceServices.length === 0}
                error={maintenanceError}
                onRetry={refetchMaintenance}
                isRefetchError={isMaintenanceRefetchError}
                isRefetching={isMaintenanceRefetching}
                emptyText="لا توجد خدمات صيانة حالياً"
                onSeeAll={handleSeeAllMaintenance}
                onPressItem={handlePressService}
                glassSupport={glassSupport}
              />

              <ServiceHorizontalList
                title="غسيل وتلميع"
                subTitle="عناية متكاملة لسيارتك"
                data={cleaningServices}
                isLoading={loadingCleaning}
                isError={isCleaningError && cleaningServices.length === 0}
                error={cleaningError}
                onRetry={refetchCleaning}
                isRefetchError={isCleaningRefetchError}
                isRefetching={isCleaningRefetching}
                emptyText="لا توجد خدمات غسيل حالياً"
                onSeeAll={handleSeeAllCleaning}
                onPressItem={handlePressService}
                glassSupport={glassSupport}
              />

              <ServiceHorizontalList
                title="خدمات أخرى"
                subTitle="تصفح المزيد من الخدمات"
                data={otherServices}
                isLoading={loadingOther}
                isError={isOtherError && otherServices.length === 0}
                error={otherError}
                onRetry={refetchOther}
                isRefetchError={isOtherRefetchError}
                isRefetching={isOtherRefetching}
                emptyText="لا توجد خدمات حالياً"
                onSeeAll={handleSeeAllOther}
                onPressItem={handlePressService}
                glassSupport={glassSupport}
              />
            </>
          )}

          <ServicesHowItWorks />

          {/* Unified Action Banner & Support Help */}
          <SectionFooterAction
            isLanding
            title="لديك مركز صيانة أو تقدم خدمات؟"
            subtitle="انشر خدماتك الآن ووصل لآلاف العملاء في منطقتك"
            buttonText="أضف خدمتك"
            iconName="construct-outline"
            iconImage={CATEGORY_ICONS.services}
            onPress={handleAddService}
          />
        </View>
      </Animated.ScrollView>

      <ServicesBottomBar glassSupport={glassSupport} />

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5, gap: 20, paddingBottom: Spacing.space4 },
});
