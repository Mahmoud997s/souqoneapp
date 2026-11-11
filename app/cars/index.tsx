import React, { useState, useCallback } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { useGlassSupport } from '../../src/components/navigation/glassSupport';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Gradients } from '../../src/constants/gradients';

import { useCarListings } from '../../src/hooks/useCarListings';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { CategoriesGrid } from '../../src/components/cars/CategoriesGrid';
import { CarHorizontalList } from '../../src/components/cars/CarHorizontalList';
import { HowItWorks } from '../../src/components/cars/HowItWorks';
import { CarsBottomBar } from '../../src/components/cars/CarsBottomBar';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { CATEGORY_ICONS } from '../../src/constants/categoryIcons';
import { usePostStore } from '../../src/store/postStore';
import { navigateToCarForm, showDraftResumePrompt, hasMeaningfulPostData } from '../../src/components/ui/DraftResumePrompt';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';
import { scheduleIdleTask } from '../../src/utils/scheduleIdleTask';
import { Listing } from '../../src/types/listing.types';

export default function CarsLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollHandler, scrollY } = useScrollAwareNav();
  const { set, reset } = usePostStore();
  const glassSupport = useGlassSupport();

  const handleAddCar = useCallback(() => navigateToCarForm(), []);
  const handlePressCar = useCallback((item: Listing) => router.push(`/cars/${item.id}` as any), [router]);
  const handleSeeAllSale = useCallback(() => router.push('/cars/browse?type=sale' as any), [router]);
  const handleSeeAllRent = useCallback(() => router.push('/cars/browse?type=rent' as any), [router]);
  const handleSeeAllWanted = useCallback(() => router.push('/cars/browse?type=wanted' as any), [router]);
  const handleBrowseAll = useCallback(() => router.push('/cars/browse' as any), [router]);
  const handleNotifications = useCallback(() => router.push('/profile/notifications' as any), [router]);
  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.push('/');
  }, [router]);


  // Data fetching logic
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
    data: saleCars = [],
    isLoading: loadingSale,
    isError: isSaleError,
    error: saleError,
    refetch: refetchSale,
    isRefetchError: isSaleRefetchError,
    isRefetching: isSaleRefetching,
  } = useCarListings({ listingType: 'SALE', limit: 10 }, { enabled: loadRest });
  const {
    data: rentCars = [],
    isLoading: loadingRent,
    isError: isRentError,
    error: rentError,
    refetch: refetchRent,
    isRefetchError: isRentRefetchError,
    isRefetching: isRentRefetching,
  } = useCarListings({ listingType: 'RENTAL', limit: 10 }, { enabled: loadRest });
  const {
    data: wantedCars = [],
    isLoading: loadingWanted,
    isError: isWantedError,
    error: wantedError,
    refetch: refetchWanted,
    isRefetchError: isWantedRefetchError,
    isRefetching: isWantedRefetching,
  } = useCarListings({ listingType: 'WANTED', limit: 10 }, { enabled: loadRest });

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        glassSupport={glassSupport}
        title="ســوق ون للسيارات"
        titleAccent="أفضل عروض وإعلانات السيارات"
        navSearchPlaceholder="ابحث عن سيارة..."
        onNavSearchPress={handleBrowseAll}
        heroSearchPlaceholder="عن أي سيارة تبحث؟"
        onHeroSearchPress={handleBrowseAll}
        onBackPress={handleBack}
        headerIcon="notifications-outline"
        onHeaderIconPress={handleNotifications}
        primaryCta={{
          label: 'اعرض سيارتك',
          icon: 'add',
          onPress: handleAddCar,
          bgColor: 'rgba(255,255,255,0.2)',
          textColor: Colors.white
        }}
        outlineCta={{
          label: 'تصفح المعارض',
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
          <CategoriesGrid support={glassSupport} />

          {loadRest && (
            <>
              <CarHorizontalList
                title="سيارات للبيع"
                subTitle="تصفح أحدث عروض البيع"
                data={saleCars}
                isLoading={loadingSale}
                isError={isSaleError}
                error={saleError}
                onRetry={() => refetchSale()}
                isRefetchError={isSaleRefetchError}
                isRefetching={isSaleRefetching}
                emptyText="لا توجد سيارات للبيع حالياً"
                onSeeAll={handleSeeAllSale}
                onPressItem={handlePressCar}
                glassSupport={glassSupport}
              />

              <CarHorizontalList
                title="سيارات للإيجار"
                subTitle="خيارات تأجير مرنة ومتنوعة"
                data={rentCars}
                isLoading={loadingRent}
                isError={isRentError}
                error={rentError}
                onRetry={() => refetchRent()}
                isRefetchError={isRentRefetchError}
                isRefetching={isRentRefetching}
                emptyText="لا توجد سيارات للإيجار حالياً"
                onSeeAll={handleSeeAllRent}
                onPressItem={handlePressCar}
                glassSupport={glassSupport}
              />

              <CarHorizontalList
                title="سيارات مطلوبة"
                subTitle="طلبات شراء سيارات من المستخدمين"
                data={wantedCars}
                isLoading={loadingWanted}
                isError={isWantedError}
                error={wantedError}
                onRetry={() => refetchWanted()}
                isRefetchError={isWantedRefetchError}
                isRefetching={isWantedRefetching}
                emptyText="لا توجد سيارات مطلوبة حالياً"
                onSeeAll={handleSeeAllWanted}
                onPressItem={handlePressCar}
                glassSupport={glassSupport}
              />
            </>
          )}

          <HowItWorks />

          {/* Unified Action Banner & Support Help */}
          <SectionFooterAction
            isLanding
            title="لديك سيارة للبيع أو للإيجار؟"
            subtitle="انشر إعلانك الآن ووصل لآلاف المشترين في منطقتك"
            buttonText="أضف إعلانك"
            iconName="car-sport-outline"
            iconImage={CATEGORY_ICONS.cars}
            onPress={handleAddCar}
          />
        </View>
      </Animated.ScrollView>

      <CarsBottomBar glassSupport={glassSupport} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5, gap: 20, paddingBottom: 0 },
});
