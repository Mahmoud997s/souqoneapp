import React, { useState } from 'react';
import { View, StyleSheet, StatusBar, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';

// Feature Components
import { BusCategoriesGrid } from '../../src/components/buses/landing/BusCategoriesGrid';
import { BusHorizontalList } from '../../src/components/buses/landing/BusHorizontalList';
import { useBuses } from '../../src/hooks/useBuses';
import { BusesHowItWorks } from '../../src/components/buses/landing/BusesHowItWorks';
import { BusesBottomBar } from '../../src/components/buses/BusesBottomBar';
import { SectionFooterAction } from '../../src/components/ui/SectionFooterAction';
import { navigateToBusForm } from '../../src/components/ui/DraftResumePrompt';
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { UNIFIED_BOTTOM_BAR_HEIGHT } from '../../src/components/navigation/UnifiedBottomBar';

export default function BusesLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollHandler, scrollY } = useScrollAwareNav();

  const [loadRest, setLoadRest] = useState(false);
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150);
    });
    return () => task.cancel();
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
      <StatusBar barStyle="light-content" />

      {/* ── STICKY HEADER ── */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as unknown as string[]}
        title="ســوق ون للحافلات"
        navSearchPlaceholder="ابحث عن حافلة..."
        onNavSearchPress={() => router.push('/buses/browse' as any)}
        heroSearchPlaceholder="عن أي حافلة تبحث؟"
        onHeroSearchPress={() => router.push('/buses/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'اعرض حافلتك',
          icon: 'add',
          onPress: () => navigateToBusForm(),
          bgColor: 'rgba(255,255,255,0.2)',
          textColor: Colors.white,
        }}
        outlineCta={{
          label: 'تصفح الحافلات',
          icon: 'bus-outline',
          onPress: () => router.push('/buses/browse' as any),
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
          <BusCategoriesGrid />

          {/* LISTS */}
          {loadRest && (
            <>
              <BusHorizontalList
                title="أحدث اعلانات الحافلات"
                subTitle="تصفح أحدث عروض وإعلانات الحافلات المضافة"
                data={newestBuses}
                isLoading={loadingNewest}
                emptyText="لا توجد حافلات مضافة حالياً"
                onSeeAll={() => router.push('/buses/browse?sort=newest')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              {premiumBuses.length > 0 && (
                <BusHorizontalList
                  title="حافلات مميزة"
                  subTitle="إعلانات موثوقة ومختارة بعناية"
                  data={premiumBuses}
                  isLoading={loadingNewest}
                  emptyText="لا توجد حافلات مميزة حالياً"
                  onSeeAll={() => router.push('/buses/browse?isPremium=true')}
                  onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
                />
              )}

              <BusHorizontalList
                title="حافلات للبيع"
                subTitle="تصفح أفضل عروض بيع الحافلات"
                data={saleBuses}
                isLoading={loadingSale}
                emptyText="لا توجد حافلات للبيع حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_SALE')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusHorizontalList
                title="حافلات للبيع بعقد"
                subTitle="حافلات مع عقود تشغيل قائمة ومضمونة"
                data={contractBuses}
                isLoading={loadingContract}
                emptyText="لا توجد حافلات للبيع بعقد حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusHorizontalList
                title="حافلات للإيجار"
                subTitle="خيارات تأجير مرنة ومتنوعة"
                data={rentBuses}
                isLoading={loadingRent}
                emptyText="لا توجد حافلات للإيجار حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_RENT')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
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
            onPress={() => navigateToBusForm()}
          />
        </View>
      </Animated.ScrollView>

      <BusesBottomBar />
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
