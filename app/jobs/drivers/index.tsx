import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { Colors } from '../../../src/constants/colors';
import { Gradients } from '../../../src/constants/gradients';
import { Radius } from '../../../src/constants/radius';
import { useDrivers } from '../../../src/hooks/useDrivers';
import { DriverProfile } from '../../../src/types/jobs.types';
import { DriverCard } from '../../../src/components/cards/DriverCard';
import { DriversFilterBottomSheet, DriverFilterState } from '../../../src/components/filters/DriversFilterBottomSheet';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const FAQ_DATA = [
  {
    q: 'كيف يمكنني العثور على أفضل سائق؟',
    a: 'يمكنك استخدام الفلاتر المتقدمة للبحث حسب الموقع، أو نوع الرخصة (خفيفة، ثقيلة، معدات) لتجد السائق الأنسب لمهمتك.'
  },
  {
    q: 'هل يمكنني توظيف سائق بشكل فوري؟',
    a: 'نعم، يمكنك التواصل مع السائق مباشرة عبر الواتساب أو الهاتف إذا كانت حالته "متاح الآن".'
  },
  {
    q: 'هل السائقون معتمدون؟',
    a: 'السائقون الذين يحملون شارة التحقق الخضراء هم سائقون تم التأكد من هويتهم وحساباتهم من قبل فريقنا لضمان الموثوقية.'
  }
];

function DirectoryFAQ() {
  return (
    <View style={s.faqContainer}>
      <View style={s.faqHeader}>
        <View style={s.faqIconWrap}>
          <Ionicons name="information-circle" size={24} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.faqTitle}>معلومات هامة لأصحاب العمل</Text>
          <Text style={s.faqSubtitle}>كل ما تحتاج معرفته عن البحث وتوظيف السائقين</Text>
        </View>
      </View>

      <View style={s.faqCardsWrap}>
        {FAQ_DATA.map((item, index) => (
          <View key={index} style={s.faqCard}>
            <View style={s.faqQRow}>
              <View style={s.faqQDot} />
              <Text style={s.faqQText}>{item.q}</Text>
            </View>
            <Text style={s.faqAText}>{item.a}</Text>
          </View>
        ))}
      </View>

      <View style={s.supportBanner}>
        <Ionicons name="headset-outline" size={20} color="#fff" />
        <Text style={s.supportText}>تحتاج للمساعدة؟ تواصل مع الدعم الفني</Text>
      </View>
    </View>
  );
}

export default function DriversDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useDrivers();

  // Filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DriverFilterState>({});
  const [showFilters, setShowFilters] = useState(false);

  const drivers: DriverProfile[] = useMemo(() => {
    const items = (data as any)?.items ?? (Array.isArray(data) ? data : []);
    return items.filter((d: DriverProfile) => {
      if (search) {
        const name = d.user?.displayName ?? d.user?.username ?? '';
        if (!name.toLowerCase().includes(search.toLowerCase()) &&
            !d.governorate?.includes(search) &&
            !d.city?.includes(search)) return false;
      }
      if (filters.location && d.governorate !== filters.location) return false;
      if (filters.city && d.city !== filters.city) return false;
      if (filters.licenseType && !d.licenseTypes?.includes(filters.licenseType as any)) return false;
      if (filters.verifiedOnly && !d.isVerified) return false;
      return true;
    });
  }, [data, search, filters]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerPaddingTop = insets.top + 8;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Premium Compact Header Background with Grid */}
      <AnimatedLinearGradient
        colors={Gradients.hero as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.headerBg, { paddingTop: headerPaddingTop }]}
      >
        {/* Grid Overlay */}
        <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <Path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>
        </View>

        {/* Single Row: Back Btn + Search Bar */}
        <View style={s.headerTopRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={s.searchWrap}>
            <View style={s.searchBox}>
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.8)" />
              <TextInput
                style={s.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="ابحث بالاسم، المحافظة..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                textAlign="right"
                selectionColor="#ffffff"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} style={s.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity onPress={() => setShowFilters(true)} style={s.filterBtn}>
            <Ionicons name="options" size={22} color="#ffffff" />
            {activeFiltersCount > 0 && <View style={s.filterBadge} />}
          </TouchableOpacity>
        </View>
      </AnimatedLinearGradient>

      <Animated.FlatList
        data={drivers}
        keyExtractor={item => item.id}
        contentContainerStyle={[s.list, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <>
            {/* Creative Page Title Banner with CTA */}
            <View style={s.bannerContainer}>
              <View style={s.bannerTopRow}>
                <View style={s.bannerIconWrap}>
                   <MaterialCommunityIcons name="account-hard-hat" size={26} color={Colors.primary} />
                </View>
                <View style={s.bannerTextWrap}>
                  <Text style={s.bannerTitle}>دليل السائقين</Text>
                  <Text style={s.bannerSubtitle}>استكشف أفضل السائقين المعتمدين لمختلف المركبات</Text>
                </View>
              </View>

              <TouchableOpacity style={s.bannerCtaWrap} activeOpacity={0.8} onPress={() => router.push('/jobs/new' as any)}>
                <LinearGradient
                  colors={Gradients.primary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.bannerCtaGradient}
                >
                  <Text style={s.bannerCtaText}>انضم إلينا كسائق محترف</Text>
                  <Ionicons name="arrow-back" size={16} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={s.resultsMeta}>
              <Text style={s.resultsCount}>{isLoading ? 'جاري البحث...' : `${drivers.length} سائق متاح`}</Text>
            </View>

            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : isError ? (
              <View style={s.centerState}>
                <Ionicons name="wifi-outline" size={60} color="#cbd5e1" />
                <Text style={s.stateText}>تعذر تحميل البيانات.</Text>
                <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
                  <Text style={s.retryText}>إعادة المحاولة</Text>
                </TouchableOpacity>
              </View>
            ) : drivers.length === 0 ? (
              <View style={s.centerState}>
                <View style={s.emptyIconWrap}>
                  <Ionicons name="people-outline" size={48} color="#94a3b8" />
                </View>
                <Text style={s.stateTitle}>لا يوجد سائقون</Text>
                <Text style={s.stateDesc}>لم نتمكن من العثور على سائقين مطابقين لبحثك الحالي.</Text>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <DriverCard
            driver={item}
            onPress={() => router.push(`/jobs/drivers/${item.id}`)}
          />
        )}
        ListFooterComponent={
          !isLoading && !isError ? <DirectoryFAQ /> : null
        }
      />

      {/* Filter Bottom Sheet */}
      <DriversFilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        initialFilters={filters}
        onApplyFilters={setFilters}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  
  headerBg: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
    paddingHorizontal: 16,
    paddingBottom: 12, 
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0, 
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  searchWrap: {
    flex: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.lg, 
    paddingHorizontal: 16,
    minHeight: 44, 
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#ffffff',
    writingDirection: 'rtl',
  },
  clearBtn: { padding: 4 },

  // Creative Banner Styles
  bannerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.xl,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.1)',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  bannerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: '#0f172a',
    textAlign: 'left',
    lineHeight: 26,
  },
  bannerSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#64748b',
    textAlign: 'left',
    lineHeight: 20,
    marginTop: 2,
  },
  bannerCtaWrap: {
    marginTop: 16,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  bannerCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bannerCtaText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#ffffff',
  },
  
  resultsMeta: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    alignItems: 'flex-end', // Aligns to physical left in RTL
  },
  resultsCount: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#64748b',
    textAlign: 'right', // Forces physical left text alignment
  },
  
  list: {
    paddingHorizontal: 20,
    gap: 16,
  },
  
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  stateText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: '#64748b',
    marginTop: 16,
  },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: Radius.lg,
  },
  retryText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#3b82f6',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stateTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 8,
  },
  stateDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },

  // FAQ Styles
  faqContainer: {
    marginTop: 24,
    marginBottom: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  faqIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: '#0f172a',
    textAlign: 'left',
  },
  faqSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'left',
  },
  faqCardsWrap: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  faqQRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  faqQDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  faqQText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
    textAlign: 'left',
  },
  faqAText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    textAlign: 'left',
    paddingLeft: 14,
  },
  supportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 20,
    gap: 8,
  },
  supportText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#ffffff',
    paddingTop: 2,
  },
});
