import React, { useState, useMemo } from 'react';
import { View, StyleSheet, StatusBar, InteractionManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { Colors } from '../../src/constants/colors';
import { Spacing } from '../../src/constants/spacing';

import { useServices } from '../../src/hooks/useServices';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';
import { usePostStore } from '../../src/store/postStore';

import { ServicesCategoriesGrid } from '../../src/components/services/ServicesCategoriesGrid';
import { ServiceHorizontalList } from '../../src/components/services/ServiceHorizontalList';
import { ServicesHowItWorks } from '../../src/components/services/ServicesHowItWorks';
import { ServicesBottomBar } from '../../src/components/services/ServicesBottomBar';
import { Gradients } from '../../src/constants/gradients';
import { ActionBanner } from '../../src/components/ui/ActionBanner';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';

export default function ServicesLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scrollHandler, scrollY } = useScrollAwareNav();
  const { set, reset } = usePostStore();

  const handleAddService = () => {
    reset();
    set({ category: 'services' });
    router.push('/post/step2' as any);
  };


  // Data fetching logic
  const { data: baseData = [], isLoading: loadingData, isError, refetch } = useServices({ limit: 20 });
  const homeServices = useMemo(() => baseData.filter(item => item.raw?.isHomeService).slice(0, 10), [baseData]);
  
  const [loadRest, setLoadRest] = useState(false);
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150);
    });
    return () => task.cancel();
  }, []);

  const { data: maintenanceServices = [], isLoading: loadingMaintenance } = useServices({ serviceType: 'MAINTENANCE', limit: 10 }, { enabled: loadRest });
  const { data: cleaningServices = [], isLoading: loadingCleaning } = useServices({ serviceType: 'CLEANING', limit: 10 }, { enabled: loadRest });
  const { data: otherServices = [], isLoading: loadingOther } = useServices({ serviceType: 'OTHER_SERVICE', limit: 10 }, { enabled: loadRest });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as unknown as string[]}
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
          icon: 'add',
          onPress: handleAddService,
          bgColor: Colors.accent,
          textColor: Colors.white
        }}
        outlineCta={{
          label: 'تصفح المراكز',
          icon: 'business-outline',
          onPress: () => router.push('/services/browse' as any)
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
          <ServicesCategoriesGrid />

          {isError && !loadingData ? (
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
              <ServiceHorizontalList
                title="خدمات منزلية"
                subTitle="خدمات تصلك إلى باب بيتك"
                data={homeServices}
                isLoading={loadingData}
                emptyText="لا توجد خدمات منزلية حالياً"
                onSeeAll={() => router.push('/services/browse?isHomeService=true' as any)}
                onPressItem={(item) => router.push(`/services/${item.id}` as any)}
              />

              {loadRest && (
                <>
                  <ServiceHorizontalList
                    title="خدمات الصيانة"
                    subTitle="أفضل ورش الصيانة لسيارتك"
                    data={maintenanceServices}
                    isLoading={loadingMaintenance}
                    emptyText="لا توجد خدمات صيانة حالياً"
                    onSeeAll={() => router.push('/services/browse?serviceType=MAINTENANCE' as any)}
                    onPressItem={(item) => router.push(`/services/${item.id}` as any)}
                  />

                  <ServiceHorizontalList
                    title="غسيل وتلميع"
                    subTitle="عناية متكاملة لسيارتك"
                    data={cleaningServices}
                    isLoading={loadingCleaning}
                    emptyText="لا توجد خدمات غسيل حالياً"
                    onSeeAll={() => router.push('/services/browse?serviceType=CLEANING' as any)}
                    onPressItem={(item) => router.push(`/services/${item.id}` as any)}
                  />

                  <ServiceHorizontalList
                    title="خدمات أخرى"
                    subTitle="تصفح المزيد من الخدمات"
                    data={otherServices}
                    isLoading={loadingOther}
                    emptyText="لا توجد خدمات حالياً"
                    onSeeAll={() => router.push('/services/browse?serviceType=OTHER_SERVICE' as any)}
                    onPressItem={(item) => router.push(`/services/${item.id}` as any)}
                  />
                </>
              )}
            </>
          )}

          <ServicesHowItWorks />

          {/* Need Help / Support Button */}
          <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 12 }} />
        </View>
      </Animated.ScrollView>

      <ServicesBottomBar />

    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: Spacing.space5, gap: 20, paddingBottom: Spacing.space4 },
});
