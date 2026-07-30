import React, { useState, useMemo } from 'react';
import { View, StyleSheet, StatusBar, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';

import { useCarListings } from '../../src/hooks/useCarListings';
import { CategoriesGrid } from '../../src/components/cars/CategoriesGrid';
import { PromoBanners } from '../../src/components/cars/PromoBanners';
import { CarHorizontalList } from '../../src/components/cars/CarHorizontalList';
import { HowItWorks } from '../../src/components/cars/HowItWorks';
import { CarsBottomBar } from '../../src/components/cars/CarsBottomBar';

export default function CarsLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Data fetching logic
  const { data: baseFeaturedData = [], isLoading: loadingFeatured } = useCarListings({ limit: 20 });
  const featuredCars = useMemo(() => baseFeaturedData.filter(car => car.isPremium).slice(0, 10), [baseFeaturedData]);
  
  const [loadRest, setLoadRest] = useState(false);
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150);
    });
    return () => task.cancel();
  }, []);

  const { data: saleCars = [], isLoading: loadingSale } = useCarListings({ listingType: 'SALE', limit: 10 }, { enabled: loadRest });
  const { data: rentCars = [], isLoading: loadingRent } = useCarListings({ listingType: 'RENTAL', limit: 10 }, { enabled: loadRest });
  const { data: wantedCars = [], isLoading: loadingWanted } = useCarListings({ listingType: 'WANTED', limit: 10 }, { enabled: loadRest });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={['#0B2447', '#1a3a6b', '#0d3060']}
        title="ســوق ون للسيارات"
        titleAccent="بيع واشترِ بكل ثقة وأمان"
        navSearchPlaceholder="ابحث عن سيارة..."
        onNavSearchPress={() => router.push('/cars/browse' as any)}
        heroSearchPlaceholder="عن أي سيارة تبحث؟"
        onHeroSearchPress={() => router.push('/cars/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'اعرض سيارتك',
          icon: 'add-circle-outline',
          onPress: () => router.push('/post' as any),
          bgColor: Colors.white,
          textColor: '#0B2447'
        }}
        outlineCta={{
          label: 'تصفح المعارض',
          icon: 'business-outline',
          onPress: () => router.push('/cars/browse' as any)
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
          <PromoBanners />
          <CategoriesGrid />

          <CarHorizontalList
            title="إعلانات مميزة"
            subTitle="أفضل السيارات المتاحة حالياً"
            data={featuredCars}
            isLoading={loadingFeatured}
            emptyText="لا توجد إعلانات مميزة حالياً"
            onSeeAll={() => router.push('/cars/browse?featured=true' as any)}
            onPressItem={(item) => router.push(`/listings/${item.id}` as any)}
          />

          {loadRest && (
            <>
              <CarHorizontalList
                title="سيارات للبيع"
                subTitle="تصفح أحدث عروض البيع"
                data={saleCars}
                isLoading={loadingSale}
                emptyText="لا توجد سيارات للبيع حالياً"
                onSeeAll={() => router.push('/cars/browse?type=sale' as any)}
                onPressItem={(item) => router.push(`/listings/${item.id}` as any)}
              />

              <CarHorizontalList
                title="سيارات للإيجار"
                subTitle="خيارات تأجير مرنة ومتنوعة"
                data={rentCars}
                isLoading={loadingRent}
                emptyText="لا توجد سيارات للإيجار حالياً"
                onSeeAll={() => router.push('/cars/browse?type=rent' as any)}
                onPressItem={(item) => router.push(`/listings/${item.id}` as any)}
              />

              <CarHorizontalList
                title="سيارات مطلوبة"
                subTitle="طلبات شراء سيارات من المستخدمين"
                data={wantedCars}
                isLoading={loadingWanted}
                emptyText="لا توجد سيارات مطلوبة حالياً"
                onSeeAll={() => router.push('/cars/browse?type=wanted' as any)}
                onPressItem={(item) => router.push(`/listings/${item.id}` as any)}
              />
            </>
          )}

          <HowItWorks />
        </View>
      </Animated.ScrollView>

      <CarsBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5, paddingTop: Spacing.space2 },
});
