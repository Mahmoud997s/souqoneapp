import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  I18nManager,
  StatusBar,
  SafeAreaView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { HorizontalScrollCard } from '../../src/components/ui/HorizontalScrollCard'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH_60 = Math.round(SCREEN_WIDTH * 0.6)
const CARD_WIDTH_FULL = Math.round(SCREEN_WIDTH - Spacing.space5 * 2)

interface TestItem {
  id: string
  title: string
  subtitle: string
  color: string
}

const generateItems = (count: number, prefix: string): TestItem[] => {
  const colors = [
    '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED',
    '#0891B2', '#DB2777', '#4F46E5', '#16A34A', '#CA8A04',
    '#9333EA', '#E11D48',
  ]
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    title: `كارت ${i}`,
    subtitle: `${prefix} — عنصر رقم ${i + 1}`,
    color: colors[i % colors.length],
  }))
}

export default function ScrollCardTestScreen() {
  const router = useRouter()
  const [selectedCase, setSelectedCase] = useState<number>(0)
  const [tappedMessage, setTappedMessage] = useState<string>('اضغط على أي كارت لاختبار الاستجابة')

  // The 5 test datasets
  const singleCardData = generateItems(1, 'حالة 1')
  const twoCardsData = generateItems(2, 'حالة 2')
  const partialCardsData = generateItems(5, 'حالة 3')
  const fullWidthCardsData = generateItems(4, 'حالة 4')
  const longListData = generateItems(12, 'حالة 5')

  const cases = [
    { title: 'الكل معاً', id: 0 },
    { title: '1. كارت واحد (60%)', id: 1 },
    { title: '2. كارتان (60%)', id: 2 },
    { title: '3. جزئي (60%) + نقاط', id: 3 },
    { title: '4. كامل العرض (100%)', id: 4 },
    { title: '5. قائمة طويلة (12 كارت)', id: 5 },
    { title: '6. كرت عرض الكل (See All)', id: 6 },
  ]

  const renderCard = (item: TestItem, index: number, width: number, height = 180) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => setTappedMessage(`تم الضغط بنجاح على: ${item.title} (${item.subtitle})`)}
      style={[
        s.testCard,
        {
          width,
          height,
          backgroundColor: item.color,
        },
      ]}
    >
      <View style={s.cardBadge}>
        <Text style={s.badgeText}>موضع: {index}</Text>
      </View>
      <View style={s.cardCenter}>
        <Text style={s.cardTitle}>{item.title}</Text>
        <Text style={s.cardSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={s.cardFooter}>
        <Text style={s.cardHint}>اضغط هنا للاختبار</Text>
        <Ionicons name="finger-print-outline" size={16} color="#ffffffcc" />
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={s.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-forward" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>اختبار HorizontalScrollCard</Text>
          <Text style={s.headerSubtitle}>Zero-RTL-Dependency (Gesture + Reanimated)</Text>
        </View>
      </View>

      {/* RTL & Environment Status Banner */}
      <View style={s.statusBanner}>
        <View style={s.statusRow}>
          <Text style={s.statusLabel}>قيمة I18nManager.isRTL الحالية:</Text>
          <View style={[s.tag, I18nManager.isRTL ? s.tagGreen : s.tagAmber]}>
            <Text style={s.tagText}>{I18nManager.isRTL ? 'true (RTL)' : 'false (LTR)'}</Text>
          </View>
        </View>
        <Text style={s.statusNote}>
          الكارت 0 يلتصق باليمين الفيزيائي دائماً، دون أي تأثر بلغة النظام.
        </Text>
        {tappedMessage ? (
          <View style={s.tappedBox}>
            <Ionicons name="checkmark-circle" size={16} color="#059669" />
            <Text style={s.tappedText}>{tappedMessage}</Text>
          </View>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsContent}>
          {cases.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[s.tabItem, selectedCase === c.id && s.tabItemActive]}
              onPress={() => setSelectedCase(c.id)}
            >
              <Text style={[s.tabText, selectedCase === c.id && s.tabTextActive]}>{c.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Content List */}
      <ScrollView style={s.mainScroll} contentContainerStyle={s.mainContent}>
        {/* Case 1: Single Card */}
        {(selectedCase === 0 || selectedCase === 1) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.numberCircle}><Text style={s.numberText}>1</Text></View>
              <View>
                <Text style={s.sectionTitle}>حالة 1: كارت واحد فقط (Single Card 60%)</Text>
                <Text style={s.sectionDesc}>يجب أن يثبت ملتصقاً باليمين تماماً دون انزلاق أو أوفست شاذ</Text>
              </View>
            </View>
            <HorizontalScrollCard
              data={singleCardData}
              cardWidth={CARD_WIDTH_60}
              cardHeight={160}
              renderItem={({ item, index }) => renderCard(item, index, CARD_WIDTH_60, 160)}
            />
          </View>
        )}

        {/* Case 2: Two Cards */}
        {(selectedCase === 0 || selectedCase === 2) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.numberCircle}><Text style={s.numberText}>2</Text></View>
              <View>
                <Text style={s.sectionTitle}>حالة 2: كارتان اثنان (Two Cards 60%)</Text>
                <Text style={s.sectionDesc}>سحب خفيف ينتقل بين الكارت 0 والكارت 1 بنعومة تامة</Text>
              </View>
            </View>
            <HorizontalScrollCard
              data={twoCardsData}
              cardWidth={CARD_WIDTH_60}
              cardHeight={160}
              showDots
              renderItem={({ item, index }) => renderCard(item, index, CARD_WIDTH_60, 160)}
            />
          </View>
        )}

        {/* Case 3: Partial Width Cards */}
        {(selectedCase === 0 || selectedCase === 3) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.numberCircle}><Text style={s.numberText}>3</Text></View>
              <View>
                <Text style={s.sectionTitle}>حالة 3: كروت جزئية العرض (60% Peeking Next Card)</Text>
                <Text style={s.sectionDesc}>محاكاة CarCard مع ظهور جزء من الكارت التالي ونقاط الترقيم</Text>
              </View>
            </View>
            <HorizontalScrollCard
              data={partialCardsData}
              cardWidth={CARD_WIDTH_60}
              cardHeight={170}
              showDots
              renderItem={({ item, index }) => renderCard(item, index, CARD_WIDTH_60, 170)}
            />
          </View>
        )}

        {/* Case 4: Full Width Banner */}
        {(selectedCase === 0 || selectedCase === 4) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.numberCircle}><Text style={s.numberText}>4</Text></View>
              <View>
                <Text style={s.sectionTitle}>حالة 4: كروت تملأ العرض بالكامل (100% Full Width Banner)</Text>
                <Text style={s.sectionDesc}>بانر كامل العرض مع snap عند كل صفحة بدقة ونقاط تفاعلية</Text>
              </View>
            </View>
            <HorizontalScrollCard
              data={fullWidthCardsData}
              cardWidth={CARD_WIDTH_FULL}
              cardHeight={180}
              gap={12}
              paddingEnd={Spacing.space5}
              showDots
              renderItem={({ item, index }) => renderCard(item, index, CARD_WIDTH_FULL, 180)}
            />
          </View>
        )}

        {/* Case 5: Long List */}
        {(selectedCase === 0 || selectedCase === 5) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.numberCircle}><Text style={s.numberText}>5</Text></View>
              <View>
                <Text style={s.sectionTitle}>حالة 5: قائمة طويلة (12 كارت — Long List)</Text>
                <Text style={s.sectionDesc}>اختبار السحب السريع (Flick) والأداء العالي 60fps حتى النهاية</Text>
              </View>
            </View>
            <HorizontalScrollCard
              data={longListData}
              cardWidth={CARD_WIDTH_60}
              cardHeight={170}
              showDots
              renderItem={({ item, index }) => renderCard(item, index, CARD_WIDTH_60, 170)}
            />
          </View>
        )}

        {/* Case 6: See All Card */}
        {(selectedCase === 0 || selectedCase === 6) && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.numberCircle}><Text style={s.numberText}>6</Text></View>
              <View>
                <Text style={s.sectionTitle}>حالة 6: كرت عرض الكل في نهاية القائمة (See All Card)</Text>
                <Text style={s.sectionDesc}>كرت تفاعلي أنيق يظهر بنهاية القائمة ويدخل بسلاسة في فيزياء التمرير</Text>
              </View>
            </View>
            <HorizontalScrollCard
              data={partialCardsData}
              cardWidth={CARD_WIDTH_60}
              cardHeight={170}
              showDots
              onSeeAll={() => setTappedMessage('تم الضغط على كرت "عرض الكل" بنجاح!')}
              seeAllTitle="عرض الكل"
              seeAllSubtitle="تصفح جميع العناصر المتاحة"
              renderItem={({ item, index }) => renderCard(item, index, CARD_WIDTH_60, 170)}
            />
          </View>
        )}

        <View style={{ height: 10 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space5,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  headerSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'left',
    marginTop: 2,
  },
  statusBanner: {
    backgroundColor: '#EFF6FF',
    marginHorizontal: Spacing.space5,
    marginTop: Spacing.space3,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: '#1E40AF',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  statusNote: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#3B82F6',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagGreen: {
    backgroundColor: '#DCFCE7',
  },
  tagAmber: {
    backgroundColor: '#FEF3C7',
  },
  tagText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#0F172A',
  },
  tappedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  tappedText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#065F46',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  tabsWrapper: {
    marginTop: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#ffffff',
  },
  tabsContent: {
    paddingHorizontal: Spacing.space5,
    paddingVertical: 8,
    gap: 8,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabItemActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#64748B',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  mainScroll: {
    flex: 1,
  },
  mainContent: {
    paddingTop: Spacing.space3,
    gap: Spacing.space5,
  },
  section: {
    backgroundColor: '#ffffff',
    paddingVertical: Spacing.space4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.space5,
    marginBottom: Spacing.space3,
  },
  numberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: '#ffffff',
  },
  sectionTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  sectionDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  testCard: {
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  cardBadge: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#ffffff',
  },
  cardCenter: {
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 8,
  },
  cardHint: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
