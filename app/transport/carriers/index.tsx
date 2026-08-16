import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, StatusBar, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg';
import { Colors } from '../../../src/constants/colors';
import { Gradients } from '../../../src/constants/gradients';
import { Radius } from '../../../src/constants/radius';
import { transportApi } from '../../../src/api/transport';
import { CarrierCard } from '../../../src/components/transport/CarrierCard';
import { CarrierProfile } from '../../../src/types/transport.types';
import { SupportHelpButton } from '../../../src/components/ui/SupportHelpButton';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const FAQ_DATA = [
  {
    q: 'كيف أضمن موثوقية الناقل؟',
    a: 'جميع الناقلين المعتمدين لدينا يمرون بعملية تحقق لضمان تقديم خدمة آمنة واحترافية.'
  },
  {
    q: 'هل يمكنني التفاوض على السعر؟',
    a: 'نعم، يمكنك "طلب عرض سعر" من الناقل مباشرة أو التواصل معه عبر الواتساب للاتفاق على التفاصيل.'
  },
  {
    q: 'ماذا لو تأخرت الشحنة؟',
    a: 'نوصي دائماً بالتواصل المباشر مع الناقل. فريق الدعم الخاص بنا متاح دائماً للمساعدة في الحالات الطارئة.'
  }
];

const FILTER_GROUPS = [
  {
    title: 'الحالة والتصنيف',
    items: [
      { id: 'all', label: 'الكل', icon: 'apps-outline' },
      { id: 'available', label: 'متاح حالياً', icon: 'time-outline' },
      { id: 'verified', label: 'مُعتمدون', icon: 'shield-checkmark-outline' },
    ]
  },
  {
    title: 'نوع الخدمة',
    items: [
      { id: 'GOODS', label: 'بضائع', icon: 'cube-outline' },
      { id: 'FURNITURE', label: 'عفش', icon: 'home-outline' },
      { id: 'CONSTRUCTION', label: 'مواد بناء', icon: 'construct-outline' },
      { id: 'HEAVY', label: 'نقل ثقيل', icon: 'bus-outline' },
      { id: 'BACKLOAD', label: 'ردود (شحنات عودة)', icon: 'swap-horizontal-outline' },
      { id: 'EQUIPMENT', label: 'معدات', icon: 'hardware-chip-outline' },
    ]
  },
  {
    title: 'نوع المركبة',
    items: [
      { id: 'PICKUP', label: 'ونيت / دباب', icon: 'car-sport-outline' },
      { id: 'TRAILER', label: 'تريلا', icon: 'bus-outline' },
      { id: 'FLATBED', label: 'سطحة', icon: 'car-outline' },
      { id: 'REFRIGERATED', label: 'نقل مبرد', icon: 'snow-outline' },
    ]
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
          <Text style={s.faqTitle}>معلومات هامة للعملاء</Text>
          <Text style={s.faqSubtitle}>كل ما تحتاج معرفته عن خدمات النقل</Text>
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

      <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 20, marginBottom: 0 }} />
    </View>
  );
}

export default function CarriersDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transport-carriers-directory'],
    queryFn: () => transportApi.getCarriers(),
  });

  const carriers = useMemo(() => {
    const d = data?.data as any;
    const items = d?.items ?? d?.data ?? (Array.isArray(d) ? d : []);
    
    let filtered = items;

    // 1. Text Search Filter
    if (search) {
      filtered = filtered.filter((c: CarrierProfile) => {
        const name = c.companyName || c.user?.displayName || '';
        const bio = c.bio || '';
        return name.includes(search) || bio.includes(search);
      });
    }

    // 2. Quick Filters
    if (activeFilter !== 'all') {
      if (activeFilter === 'available') {
        filtered = filtered.filter((c: CarrierProfile) => c.isAvailable);
      } else if (activeFilter === 'verified') {
        filtered = filtered.filter((c: CarrierProfile) => c.isVerified || c.user?.isVerified);
      } else if (['GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT'].includes(activeFilter)) {
        filtered = filtered.filter((c: CarrierProfile) => c.serviceTypes?.includes(activeFilter));
      } else if (['PICKUP', 'TRAILER', 'FLATBED', 'REFRIGERATED'].includes(activeFilter)) {
        filtered = filtered.filter((c: CarrierProfile) => c.vehicleTypes?.includes(activeFilter));
      }
    }
    
    return filtered;
  }, [data, search, activeFilter]);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Calculate static top padding
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
                placeholder="ابحث عن شركة، ناقل..."
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

          <TouchableOpacity onPress={() => setIsFilterVisible(true)} style={s.filterBtn}>
            <Ionicons name="options" size={22} color="#ffffff" />
            {activeFilter !== 'all' && <View style={s.filterBadge} />}
          </TouchableOpacity>
        </View>
      </AnimatedLinearGradient>

      <Animated.FlatList
        data={carriers}
        keyExtractor={item => item.id}
        // Top padding accounts for new highly compact header
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
                   <MaterialCommunityIcons name="truck-fast-outline" size={26} color={Colors.primary} />
                </View>
                <View style={s.bannerTextWrap}>
                  <Text style={s.bannerTitle}>دليل الناقلين</Text>
                  <Text style={s.bannerSubtitle}>استكشف أفضل شركات ومركبات النقل المعتمدة</Text>
                </View>
              </View>

              <TouchableOpacity style={s.bannerCtaWrap} activeOpacity={0.8}>
                <LinearGradient
                  colors={Gradients.primary as any}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.bannerCtaGradient}
                >
                  <Text style={s.bannerCtaText}>انضم إلينا كمزود خدمة نقل</Text>
                  <Ionicons name="arrow-back" size={16} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={s.resultsMeta}>
              <Text style={s.resultsCount}>{isLoading ? 'جاري البحث...' : `${carriers.length} ناقل متاح`}</Text>
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
            ) : carriers.length === 0 ? (
              <View style={s.centerState}>
                <View style={s.emptyIconWrap}>
                  <Ionicons name="business-outline" size={48} color="#94a3b8" />
                </View>
                <Text style={s.stateTitle}>لا يوجد ناقلون</Text>
                <Text style={s.stateDesc}>لم نتمكن من العثور على شركات نقل مطابقة لبحثك الحالي.</Text>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <CarrierCard
            carrier={item}
            maxChips={5}
            onPress={() => router.push(`/transport/carriers/${item.id}` as any)}
          />
        )}
        ListFooterComponent={
          !isLoading && !isError ? <DirectoryFAQ /> : null
        }
      />

      {/* Filter Bottom Sheet */}
      <Modal
        visible={isFilterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setIsFilterVisible(false)} />
          <View style={[s.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20), maxHeight: '85%' }]}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>تصفية النتائج</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)} style={s.sheetCloseBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.sheetScrollContent}>
              {FILTER_GROUPS.map((group, idx) => (
                <View key={idx} style={s.filterGroup}>
                  <Text style={s.filterGroupTitle}>{group.title}</Text>
                  <View style={s.filterGroupChips}>
                    {group.items.map(filter => {
                      const isActive = activeFilter === filter.id;
                      return (
                        <TouchableOpacity
                          key={filter.id}
                          style={[s.groupChip, isActive && s.groupChipActive]}
                          onPress={() => {
                            setActiveFilter(filter.id);
                            setIsFilterVisible(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name={filter.icon as any} size={16} color={isActive ? Colors.primary : '#64748b'} />
                          <Text style={[s.groupChipText, isActive && s.groupChipTextActive]}>
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  
  // Bottom Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    color: '#0f172a',
  },
  sheetCloseBtn: {
    padding: 4,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
  },
  sheetScrollContent: {
    paddingBottom: 24,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterGroupTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: '#334155',
    marginBottom: 12,
    textAlign: 'left',
  },
  filterGroupChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  groupChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: Colors.primary,
  },
  groupChipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#64748b',
  },
  groupChipTextActive: {
    color: Colors.primary,
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
    paddingLeft: 14, // align with text, not dot
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
