import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, InteractionManager,
  Dimensions, FlatList, I18nManager
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler, useSharedValue,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { transportApi } from '../../src/api/transport';

import { TransportCategoriesGrid } from '../../src/components/transport/landing/TransportCategoriesGrid';
import { TransportHorizontalList } from '../../src/components/transport/landing/TransportHorizontalList';
import { TransportHowItWorks } from '../../src/components/transport/landing/TransportHowItWorks';
import { CarrierCTABanner } from '../../src/components/transport/landing/CarrierCTABanner';
import { CarrierCard } from '../../src/components/transport/CarrierCard';
import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';

const { width: SW } = Dimensions.get('window');

function ActionCard({
  icon, label, desc, color, bg, onPress, iconFamily = 'Ionicons'
}: {
  icon: string; label: string; desc: string
  color: string; bg: string; onPress: () => void; iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'
}) {
  return (
    <TouchableOpacity style={[act.card, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[act.iconBox, { backgroundColor: color + '20' }]}>
        {iconFamily === 'MaterialCommunityIcons' ? (
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        ) : (
          <Ionicons name={icon as any} size={24} color={color} />
        )}
      </View>
      <View style={act.textBox}>
        <Text style={[act.label, { color: Colors.text }]} numberOfLines={1}>{label}</Text>
        <Text style={act.desc} numberOfLines={1}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

const act = StyleSheet.create({
  card: {
    width: (SW - Spacing.space5 * 2 - Spacing.space4) / 2,
    padding: Spacing.space3 + 2,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  textBox: { flex: 1 },
  label: { fontFamily: 'Almarai_800ExtraBold', fontSize: 14, textAlign: 'left', marginBottom: 2 },
  desc: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'left', paddingBottom: 4 },
});

function CarriersSwiper({ carriers }: { carriers: any[] }) {
  const router = useRouter();
  if (!carriers || carriers.length === 0) return null;
  return (
    <View style={{ marginTop: Spacing.space3, marginBottom: Spacing.space5 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.space5, marginBottom: Spacing.space4 }}>
        <Text style={{ fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: Colors.text, paddingVertical: 4 }}>الناقلون المتميزون</Text>
        <TouchableOpacity onPress={() => router.push('/transport/carriers' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary }}>عرض الكل</Text>
          <Ionicons name="chevron-back" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={carriers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.space5, gap: 16 }}
        snapToInterval={(SW * 0.85) + 16}
        snapToAlignment="start"
        decelerationRate="fast"
        renderItem={({ item }) => (
          <View style={{ width: SW * 0.85 }}>
            <CarrierCard
              carrier={item}
              onPress={() => router.push(`/transport/carriers/${item.id}` as any)}
              compact={true}
            />
          </View>
        )}
      />
    </View>
  );
}

export default function TransportLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const [loadRest, setLoadRest] = useState(false);
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => setLoadRest(true), 150);
    });
    return () => task.cancel();
  }, []);

  const { data: latestRes, isLoading: loadingLatest } = useQuery({
    queryKey: ['transport-requests-latest'],
    queryFn: () => transportApi.getAll({ status: 'OPEN', limit: 10 }),
    enabled: loadRest,
  });

  const latestRequests = useMemo(() => {
    const d = latestRes?.data as any;
    return d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
  }, [latestRes]);

  const { data: carriersRes, isLoading: loadingCarriers } = useQuery({
    queryKey: ['transport-carriers-featured'],
    queryFn: () => transportApi.getCarriers(),
    enabled: loadRest,
  });

  const featuredCarriers = useMemo(() => {
    const d = carriersRes?.data as any;
    return d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
  }, [carriersRes]);

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

      {/* ── STICKY HEADER ── */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as unknown as string[]}
        title="ســوق ون للنقل"
        titleAccent=" شحن موثوق لأي مكان في سلطنة عمــان"
        navSearchPlaceholder="ابحث عن طلب شحن..."
        onNavSearchPress={() => router.push('/transport/browse' as any)}
        heroSearchPlaceholder="ابحث عن طلبات شحن أو ناقلين..."
        onHeroSearchPress={() => router.push('/transport/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'إنشاء طلب نقل',
          icon: 'add-circle-outline',
          onPress: () => router.push('/transport/new' as any),
          textColor: '#FFFFFF',
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

      {/* ── MAIN SCROLL CONTENT ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 185 + 4 + 16, paddingBottom: insets.bottom + 80 }}
      >
        <View style={s.content}>

          {/* QUICK ACTIONS */}
          <View style={s.actionsGrid}>
            <ActionCard
              icon="cube-outline" label="إنشاء طلب"
              desc="انقل بضاعتك بأمان"
              color={Colors.primary} bg="#EFF6FF"
              onPress={() => router.push('/transport/new' as any)}
            />
            <ActionCard
              icon="compass-outline" label="تصفح الطلبات"
              desc="ابحث عن حمولة لنقلها"
              color="#16a34a" bg="#F0FDF4"
              onPress={() => router.push('/transport/browse' as any)}
            />
            <ActionCard
              icon="truck-fast-outline" label="دليل الناقلين"
              desc="أفضل شركات النقل"
              color="#d97706" bg="#FFFBEB"
              iconFamily="MaterialCommunityIcons"
              onPress={() => router.push('/transport/carriers' as any)}
            />
            <ActionCard
              icon="analytics-outline" label="لوحتي"
              desc="إدارة طلباتي وعروضي"
              color="#7c3aed" bg="#F5F3FF"
              onPress={() => router.push('/transport/carrier-dashboard' as any)}
            />
          </View>

          {loadRest && !loadingCarriers && featuredCarriers.length > 0 && (
            <CarriersSwiper carriers={featuredCarriers} />
          )}

          <TransportCategoriesGrid />

          {loadRest && (
            <TransportHorizontalList
              title="أحدث طلبات النقل"
              subTitle="تصفح الطلبات المفتوحة وقدم عرضك"
              data={latestRequests}
              isLoading={loadingLatest}
              emptyText="لا توجد طلبات نقل حالياً"
              onSeeAll={() => router.push('/transport/browse' as any)}
              onPressItem={(item) => router.push(`/transport/${item.id}` as any)}
            />
          )}

          <TransportHowItWorks />

          {!isCarrier && <CarrierCTABanner />}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  

  // ── CONTENT ──
  content: { paddingHorizontal: 0 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.space5, gap: Spacing.space4, justifyContent: 'space-between', marginBottom: Spacing.space4, marginTop: Spacing.space2,
  },
});
