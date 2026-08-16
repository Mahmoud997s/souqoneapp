import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar, InteractionManager,
  Dimensions, TextInput
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';

import { Colors } from '../../src/constants/colors';
import { Gradients } from '../../src/constants/gradients';
import { Spacing } from '../../src/constants/spacing';
import { Radius } from '../../src/constants/radius';
import { useBuses } from '../../src/hooks/useBuses';
import { useScrollAwareNav } from '../../src/hooks/useScrollAwareNav';

// Feature Components
import { BusActionCards } from '../../src/components/buses/landing/BusActionCards';
import { BusCategoriesGrid } from '../../src/components/buses/landing/BusCategoriesGrid';
import { BusLandingSection } from '../../src/components/buses/landing/BusLandingSection';
import { BusPromoBanner } from '../../src/components/buses/landing/BusPromoBanner';
import { BusesHowItWorks } from '../../src/components/buses/landing/BusesHowItWorks';
import { BusesBottomBar } from '../../src/components/buses/BusesBottomBar';
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton';

import { AnimatedHeroHeader } from '../../src/components/ui/AnimatedHeroHeader';

const { width: SW } = Dimensions.get('window');

// Reusable Action Card (Matched from Transport)
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
          <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        ) : (
          <Ionicons name={icon as any} size={20} color={color} />
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
    padding: Spacing.space2 + 4,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  textBox: { flex: 1 },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 13, textAlign: 'left', marginBottom: 2 },
  desc: { fontFamily: 'Almarai_400Regular', fontSize: 11, color: Colors.textMuted, textAlign: 'left', paddingBottom: 2 },
});

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

  // Data is fetched inside BusLandingSection components

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── STICKY HEADER ── */}
      <AnimatedHeroHeader
        scrollY={scrollY}
        gradientColors={Gradients.hero as unknown as string[]}
        title="ســوق ون للحافلات"
        titleAccent="بيع وتأجير الحافلات بسهولة وموثوقية"
        navSearchPlaceholder="ابحث عن حافلة..."
        onNavSearchPress={() => router.push('/buses/browse' as any)}
        heroSearchPlaceholder="ابحث عن ماركة، موديل، أو فئة..."
        onHeroSearchPress={() => router.push('/buses/browse' as any)}
        onBackPress={() => {
          if (router.canGoBack()) router.back();
          else router.push('/');
        }}
        headerIcon="notifications-outline"
        onHeaderIconPress={() => router.push('/profile/notifications' as any)}
        primaryCta={{
          label: 'أضف حافلة',
          icon: 'add-circle-outline',
          onPress: () => router.push('/buses/new' as any),
          textColor: '#FFFFFF',
          bgColor: Colors.accent
        }}
        outlineCta={{
          label: 'تصفح الحافلات',
          icon: 'bus-outline',
          onPress: () => router.push('/buses/browse' as any)
        }}
      />

      {/* ── SCROLLABLE CONTENT ── */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 185 + 4 + 24, paddingBottom: insets.bottom + 80 }}
      >
        <View style={s.content}>
          <BusPromoBanner />
          <BusCategoriesGrid />

          {/* LISTS */}
          {loadRest && (
            <>
              <BusLandingSection 
                title="حافلات مميزة" 
                subTitle="إعلانات موثوقة ومميزة" 
                queryParams={{ isPremium: true, limit: 6 }}
                emptyText="لا توجد حافلات مميزة حالياً"
                onSeeAll={() => router.push('/buses/browse?isPremium=true')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection 
                title="الأكثر طلباً" 
                subTitle="الحافلات الأكثر شعبية وبحثاً" 
                queryParams={{ sort: 'popular', limit: 6 }}
                emptyText="لا توجد بيانات حالياً"
                onSeeAll={() => router.push('/buses/browse?sort=popular')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection 
                title="حافلات للبيع" 
                queryParams={{ busListingType: 'BUS_SALE', limit: 6 }}
                emptyText="لا توجد حافلات للبيع حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_SALE')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection 
                title="حافلات للإيجار" 
                queryParams={{ busListingType: 'BUS_RENT', limit: 6 }}
                emptyText="لا توجد حافلات للإيجار حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_RENT')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />
            </>
          )}

          <BusesHowItWorks />

          {/* Need Help / Support Button */}
          <SupportHelpButton style={{ marginHorizontal: Spacing.space5, marginTop: Spacing.space3, marginBottom: Spacing.space4 }} />
        </View>
      </Animated.ScrollView>

      <BusesBottomBar />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  

  content: { paddingHorizontal: 0 },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: Spacing.space5, gap: Spacing.space4, justifyContent: 'space-between', marginBottom: Spacing.space1, marginTop: Spacing.space4,
  },
});
