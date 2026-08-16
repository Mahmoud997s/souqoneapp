import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, InteractionManager,
  Dimensions, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { transportApi } from '../../src/api/transport';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';

import { TransportCategoriesGrid } from '../../src/components/transport/landing/TransportCategoriesGrid';
import { TransportHorizontalList } from '../../src/components/transport/landing/TransportHorizontalList';
import { TransportHowItWorks } from '../../src/components/transport/landing/TransportHowItWorks';
import { TransportBottomBar } from '../../src/components/transport/TransportBottomBar';
import { CarrierCTABanner } from '../../src/components/transport/landing/CarrierCTABanner';
import { CarrierCard } from '../../src/components/transport/CarrierCard';
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';
import { ActionBanner } from '../../src/components/ui/ActionBanner';
import { SkeletonCard } from '../../src/components/ui/SkeletonCard';

import { TransportRequest, CarrierProfile } from '../../src/types/transport.types';
import { PaginatedResponse } from '../../src/types/api.types';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';

const { width: SW } = Dimensions.get('window');

function CarriersSwiper({ carriers, isLoading }: { carriers: CarrierProfile[]; isLoading?: boolean }) {
  const router = useRouter();
  if (!isLoading && (!carriers || carriers.length === 0)) return null;

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleHeader}>الناقلون المتميزون</Text>
          <Text style={s.sectionSubHeader}>نخبة من شركات وسائقي النقل المعتمدين</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/transport/carriers' as any)}
          style={s.seeAllBtn}
          activeOpacity={0.8}
        >
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -Spacing.space5 }}
        contentContainerStyle={s.scrollContent}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} style={{ width: SW * 0.62, height: 160 }} />
          ))
        ) : (
          carriers.map((item) => (
            <View key={item.id} style={{ width: SW * 0.62 }}>
              <CarrierCard
                carrier={item}
                onPress={() => router.push(`/transport/carriers/${item.id}` as any)}
                compact={true}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const extractArray = <T,>(res: unknown): T[] => {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  const obj = res as Record<string, unknown>;
  if (Array.isArray(obj.data)) return obj.data as T[];
  if (Array.isArray(obj.items)) return obj.items as T[];
  return [];
};

export default function TransportLandingScreen() {
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

  // 1. Latest Requests (Open)
  const { data: latestRes, isLoading: loadingLatest, isError, refetch } = useQuery({
    queryKey: ['transport-requests-latest'],
    queryFn: () => transportApi.getAll({ status: 'OPEN', limit: 10 }),
  });

  const latestRequests = useMemo(
    () => extractArray<TransportRequest>(latestRes?.data),
    [latestRes]
  );

  // 2. Furniture Moving Requests
  const { data: furnitureRes, isLoading: loadingFurniture } = useQuery({
    queryKey: ['transport-requests-furniture'],
    queryFn: () => transportApi.getAll({ status: 'OPEN', serviceType: 'FURNITURE', limit: 10 }),
    enabled: loadRest,
  });

  const furnitureRequests = useMemo(
    () => extractArray<TransportRequest>(furnitureRes?.data),
    [furnitureRes]
  );

  // 3. Backload (Shared/Return Cargo) Requests
  const { data: backloadRes, isLoading: loadingBackload } = useQuery({
    queryKey: ['transport-requests-backload'],
    queryFn: () => transportApi.getAll({ status: 'OPEN', serviceType: 'BACKLOAD', limit: 10 }),
    enabled: loadRest,
  });

  const backloadRequests = useMemo(
    () => extractArray<TransportRequest>(backloadRes?.data),
    [backloadRes]
  );

  // 4. Featured Carriers
  const { data: carriersRes, isLoading: loadingCarriers } = useQuery({
    queryKey: ['transport-carriers-featured'],
    queryFn: () => transportApi.getCarriers({ limit: 10 }),
    enabled: loadRest,
  });

  const featuredCarriers = useMemo(
    () => extractArray<CarrierProfile>(carriersRes?.data),
    [carriersRes]
  );

  // 5. My Carrier Profile Check
  const { data: myProfileRes } = useQuery({
    queryKey: ['my-carrier-profile'],
    queryFn: () => transportApi.getMyCarrierProfile(),
    retry: false,
    enabled: loadRest,
  });

  const isCarrier = !!myProfileRes?.data;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ═══════════════ ANIMATED STICKY HEADER ═══════════════ */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as unknown as string[]}
        title="ســوق ون للنقل"
        titleAccent="شحن موثوق لأي مكان في سلطنة عمــان"
        navSearchPlaceholder="ابحث عن طلب شحن..."
        onNavSearchPress={() => router.push('/transport/browse' as any)}
        heroSearchPlaceholder="عن أي شحنة أو ناقل تبحث؟"
        onHeroSearchPress={() => router.push('/transport/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'إنشاء طلب نقل',
          icon: 'add',
          onPress: () => router.push('/transport/new' as any),
          textColor: Colors.white,
          bgColor: Colors.accent
        }}
        outlineCta={{
          label: isCarrier ? 'تصفح الطلبات' : 'سجل كناقل',
          icon: isCarrier ? 'compass-outline' : 'car-outline',
          onPress: () => {
            if (isCarrier) router.push('/transport/browse' as any);
            else router.push('/transport/carrier-register' as any);
          }
        }}
      />

      {/* ═══════════════ MAIN CONTENT ═══════════════ */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 106 + Spacing.space5,
          paddingBottom: 100,
        }}
      >
        <View style={s.content}>
          {/* Categories Grid (Glassmorphism 4x2) */}
          <TransportCategoriesGrid />

          {/* Network Error Handler */}
          {isError && !loadingLatest ? (
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
              {/* Featured Carriers Swiper */}
              {loadRest && !loadingCarriers && featuredCarriers.length > 0 && (
                <CarriersSwiper carriers={featuredCarriers} isLoading={loadingCarriers} />
              )}

              {/* Latest Open Requests */}
              <TransportHorizontalList
                title="أحدث طلبات النقل"
                subTitle="تصفح أحدث طلبات الشحن المفتوحة وقدم عرضك"
                data={latestRequests}
                isLoading={loadingLatest}
                emptyText="لا توجد طلبات نقل مفتوحة حالياً"
                onSeeAll={() => router.push('/transport/browse' as any)}
                onPressItem={(item) => router.push(`/transport/${item.id}` as any)}
              />

              {/* Furniture Moving Requests */}
              {loadRest && (furnitureRequests.length > 0 || loadingFurniture) && (
                <TransportHorizontalList
                  title="أثاث وعفش"
                  subTitle="طلبات نقل المنازل والمكاتب"
                  data={furnitureRequests}
                  isLoading={loadingFurniture}
                  emptyText="لا توجد طلبات نقل أثاث حالياً"
                  onSeeAll={() => router.push('/transport/browse?type=FURNITURE' as any)}
                  onPressItem={(item) => router.push(`/transport/${item.id}` as any)}
                />
              )}

              {/* Backload (Return/Shared Cargo) Requests */}
              {loadRest && (backloadRequests.length > 0 || loadingBackload) && (
                <TransportHorizontalList
                  title="شحنات مجمعة (Backload)"
                  subTitle="وفر في تكاليف الشحن عبر المركبات العائدة"
                  data={backloadRequests}
                  isLoading={loadingBackload}
                  emptyText="لا توجد شحنات مجمعة حالياً"
                  onSeeAll={() => router.push('/transport/browse?type=BACKLOAD' as any)}
                  onPressItem={(item) => router.push(`/transport/${item.id}` as any)}
                />
              )}
            </>
          )}

          {/* How It Works */}
          <TransportHowItWorks />

          {/* Carrier Registration Banner */}
          {!isCarrier && <CarrierCTABanner />}

          {/* Need Help / Support Button */}
          <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 12 }} />
        </View>
      </Animated.ScrollView>

      <TransportBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  content: {
    paddingHorizontal: Spacing.space5,
    gap: 20,
    paddingBottom: Spacing.space4,
  },
  section: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 23,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  sectionSubHeader: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  seeAllTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 16,
    paddingTop: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3,
    paddingVertical: 4,
  },
});

