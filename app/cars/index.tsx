import React, { useState, useMemo } from 'react';
import { View, StyleSheet, StatusBar, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';
import { Gradients } from '../../src/constants/gradients';

import { useCarListings } from '../../src/hooks/useCarListings';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { CategoriesGrid } from '../../src/components/cars/CategoriesGrid';
import { CarHorizontalList } from '../../src/components/cars/CarHorizontalList';
import { HowItWorks } from '../../src/components/cars/HowItWorks';
import { CarsBottomBar } from '../../src/components/cars/CarsBottomBar';
import { ActionBanner } from '../../src/components/ui/ActionBanner';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';
import { usePostStore } from '../../src/store/postStore';
import { showDraftResumePrompt, hasMeaningfulPostData, hasMeaningfulCarData } from '../../src/components/ui/DraftResumePrompt';
import { useCarWizardStore } from '../../src/store/carWizardStore';

export default function CarsLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollHandler, scrollY } = useScrollAwareNav();
  const { set, reset } = usePostStore();

  const handleAddCar = () => {
    const state = useCarWizardStore.getState();
    const navigateToForm = () => router.push('/cars/new' as any);
    
    if (state.isDraft && hasMeaningfulCarData(state)) {
      router.push('/cars/drafts' as any);
    } else {
      state.resetForm();
      navigateToForm();
    }
  };


  // Data fetching logic
  const { data: baseFeaturedData = [], isLoading: loadingFeatured, isError, refetch } = useCarListings({ limit: 20 });
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
        gradientColors={Gradients.hero as unknown as string[]}
        title="ســوق ون للسيارات"
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
          icon: 'add',
          onPress: () => router.push('/cars/new' as any),
          bgColor: 'rgba(255,255,255,0.2)',
          textColor: Colors.white
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
        contentContainerStyle={{ paddingTop: insets.top + 106 + Spacing.space5, paddingBottom: 100 }}
      >
        <View style={s.content}>
          <CategoriesGrid />

          {isError && !loadingFeatured ? (
            <ActionBanner 
              title="تعذر الاتصال بالشبكة"
              subtitle="حدث خطأ أثناء جلب البيانات، يرجى المحاولة مرة أخرى."
              buttonText="إعادة المحاولة"
              iconName="cloud-offline"
              onPress={() => refetch()}
              gradientColors={['#ef4444', '#b91c1c', '#7f1d1d']}
            />
          ) : (
            <>
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
            </>
          )}

          <HowItWorks />

          {/* Need Help / Support Button */}
          <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 12 }} />
        </View>
      </Animated.ScrollView>

      <CarsBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5, gap: 20, paddingBottom: Spacing.space4 },
});
