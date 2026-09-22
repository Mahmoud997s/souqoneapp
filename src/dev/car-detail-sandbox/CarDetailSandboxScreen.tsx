import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'

// Presentational Components
import { DetailNavBar } from '../../components/listing-detail/DetailNavBar'
import { ImageGallery } from '../../components/listing-detail/ImageGallery'
import { ImageViewerModal } from '../../components/listing-detail/ImageViewerModal'
import { ListingHeaderBlock } from '../../components/listing-detail/ListingHeaderBlock'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import {
  ContactActions,
  type ContactAvailability,
} from '../../components/listing-detail/ContactActions'
import { ListingDescription } from '../../components/listing-detail/ListingDescription'
import { SpecsSections } from '../../components/listing-detail/SpecsSections'
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import {
  OwnerManageBar,
  type OwnerActionId,
} from '../../components/listing-detail/OwnerManageBar'
import { SimilarListingsGrid } from '../../components/listing-detail/SimilarListingsGrid'
import { DetailStates } from '../../components/listing-detail/DetailStates'

// Fixtures
import {
  SCENARIOS,
  FIXTURE_SALE_FULL,
  type ScenarioItem,
} from './fixtures'
import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'

type OverrideState = 'normal' | 'loading' | 'error' | 'notFound' | 'offline'

interface SimilarCarItem {
  id: string
  title: string
  price: string
  year: number
  location: string
}

const MOCK_SIMILAR_ITEMS: SimilarCarItem[] = [
  {
    id: 'sim-1',
    title: 'تويوتا لاندكروزر GXR 2023',
    price: '28,500 ر.ع',
    year: 2023,
    location: 'مسقط',
  },
  {
    id: 'sim-2',
    title: 'لكزس LX600 VIP 2022',
    price: '46,000 ر.ع',
    year: 2022,
    location: 'صحار',
  },
  {
    id: 'sim-3',
    title: 'نيسان باترول بلاتينيوم 2024',
    price: '29,800 ر.ع',
    year: 2024,
    location: 'صلالة',
  },
  {
    id: 'sim-4',
    title: 'تويوتا برادو TXL 2023',
    price: '19,200 ر.ع',
    year: 2023,
    location: 'نزوى',
  },
]

/**
 * CarDetailSandboxScreen
 * Development & visual review sandbox for car detail presentational components.
 * Accessible via /dev/car-detail-sandbox for live inspection on iOS/Android devices.
 */
export function CarDetailSandboxScreen() {
  const insets = useSafeAreaInsets()

  // Sandbox state controls
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('sale_full')
  const [isOwner, setIsOwner] = useState<boolean>(false)
  const [overrideState, setOverrideState] = useState<OverrideState>('normal')
  const [isDevPanelOpen, setIsDevPanelOpen] = useState<boolean>(true)

  // Interactive component states
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [favoriteBusy, setFavoriteBusy] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [similarPage, setSimilarPage] = useState<number>(1)

  // Reanimated scroll tracker
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // Selected fixture data
  const currentScenario =
    SCENARIOS.find((s) => s.id === selectedScenarioId) || SCENARIOS[0]
  const data: CarDetailViewModel = currentScenario.data

  // Calculate contact availability mode
  const getContactAvailability = (): ContactAvailability => {
    if (isOwner || data.status === 'SOLD' || data.status === 'ARCHIVED') {
      return { mode: 'hidden' }
    }
    if (selectedScenarioId === 'chat_only') {
      return { mode: 'chatOnly' }
    }
    if (!data.whatsappEnabled || selectedScenarioId === 'no_whatsapp') {
      return { mode: 'noWhatsapp' }
    }
    return { mode: 'full' }
  }

  const contactAvailability = getContactAvailability()

  // Fake handlers (safe, no console logging of PII)
  const handleToggleFavorite = () => {
    setFavoriteBusy(true)
    setTimeout(() => {
      setIsFavorite((prev) => !prev)
      setFavoriteBusy(false)
    }, 300)
  }

  const handleShare = () => {
    Alert.alert('مشاركة', 'تم استدعاء إجراء المشاركة للإعلان')
  }

  const handleSearchSubmit = (text: string) => {
    Alert.alert('بحث', `تم إرسال البحث: ${text}`)
  }

  const handleContactCall = () => {
    Alert.alert('اتصال', 'تم الضغط على زر الاتصال الهاتفي')
  }

  const handleContactWhatsApp = () => {
    Alert.alert('واتساب', 'تم الضغط على زر مراسلة واتساب')
  }

  const handleContactChat = () => {
    Alert.alert('محادثة', 'تم الضغط على زر المحادثة الفورية')
  }

  const handleProfilePress = (sellerId: string) => {
    Alert.alert('الملف الشخصي للبائع', `معرف البائع: ${sellerId}`)
  }

  const handleOwnerAction = (actionId: OwnerActionId) => {
    Alert.alert('إجراء المالك', `تم اختيار الإجراء: ${actionId}`)
  }

  const handleSupportPress = () => {
    Alert.alert('الدعم الفني', 'تم الضغط على زر الدعم الفني')
  }

  const buyerTips = [
    'تأكد من معاينة وفحص السيارة شخصياً في ورشة معتمدة قبل إتمام الشراء.',
    'لا تقم بتحويل أي مبالغ مالية أو عربون مسبقاً قبل المعاينة وفحص أوراق السيارة.',
    'قارن السعر مع متوسط أسعار السوق لنفس الموديل والمواصفات.',
    'تحقق من تطابق رقم الهيكل (VIN) مع الاستمارة الرسمية للسيارة.',
  ]

  return (
    <View style={s.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Floating Dev Control Panel Toggle */}
      <View style={[s.devBarHeader, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={s.devBarToggleButton}
          onPress={() => setIsDevPanelOpen((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isDevPanelOpen ? 'options' : 'options-outline'}
            size={18}
            color={Colors.white}
          />
          <Text style={s.devBarToggleText}>
            معمل التجارب {isDevPanelOpen ? '(إخفاء التحكم)' : '(إظهار التحكم)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Dev Controls Panel */}
      {isDevPanelOpen ? (
        <View style={s.devPanel}>
          <Text style={s.devSectionTitle}>السيناريو:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipsScroll}
          >
            {SCENARIOS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  s.scenarioChip,
                  selectedScenarioId === item.id && s.scenarioChipActive,
                ]}
                onPress={() => {
                  setSelectedScenarioId(item.id)
                  setGalleryIndex(0)
                }}
              >
                <Text
                  style={[
                    s.scenarioChipText,
                    selectedScenarioId === item.id && s.scenarioChipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={s.devRow}>
            {/* Viewer Mode Toggle */}
            <TouchableOpacity
              style={[s.toggleChip, isOwner && s.toggleChipActive]}
              onPress={() => setIsOwner((prev) => !prev)}
            >
              <Ionicons
                name={isOwner ? 'person' : 'person-outline'}
                size={14}
                color={isOwner ? Colors.white : Colors.primary}
              />
              <Text style={[s.toggleChipText, isOwner && s.toggleChipTextActive]}>
                {isOwner ? 'عرض: المالك' : 'عرض: زائر / مشتري'}
              </Text>
            </TouchableOpacity>

            {/* Override States */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.overrideScroll}
            >
              {(
                ['normal', 'loading', 'error', 'notFound', 'offline'] as OverrideState[]
              ).map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[
                    s.stateChip,
                    overrideState === st && s.stateChipActive,
                  ]}
                  onPress={() => setOverrideState(st)}
                >
                  <Text
                    style={[
                      s.stateChipText,
                      overrideState === st && s.stateChipTextActive,
                    ]}
                  >
                    {st === 'normal'
                      ? 'طبيعي'
                      : st === 'loading'
                      ? 'تحميل'
                      : st === 'error'
                      ? 'خطأ'
                      : st === 'notFound'
                      ? 'غير موجود'
                      : 'أوفلاين'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}

      {/* Main View Area */}
      {overrideState !== 'normal' ? (
        <View style={s.overrideContainer}>
          <DetailStates
            kind={overrideState}
            onRetry={() => Alert.alert('إعادة المحاولة', 'تم طلب إعادة المحاولة')}
            onBack={() => setOverrideState('normal')}
          />
        </View>
      ) : (
        <View style={s.mainWrapper}>
          {/* Top Fixed Detail Navigation Bar */}
          <DetailNavBar
            onBack={() => Alert.alert('رجوع', 'تم الضغط على زر الرجوع')}
            isFavorite={isFavorite}
            favoriteBusy={favoriteBusy}
            canFavorite={!isOwner}
            onToggleFavorite={handleToggleFavorite}
            onShare={handleShare}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onSearchSubmit={handleSearchSubmit}
            scrollY={scrollY}
            placeholder="ابحث في تفاصيل السيارة..."
            paddingTop={insets.top + (isDevPanelOpen ? 0 : 4)}
          />

          <Animated.ScrollView
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={[
              s.scrollContent,
              {
                paddingTop: insets.top + 54,
                paddingBottom: contactAvailability.mode !== 'hidden' ? 90 : 40,
              },
            ]}
          >
            {/* 1. Image Gallery */}
            <ImageGallery
              images={data.images}
              index={galleryIndex}
              onIndexChange={setGalleryIndex}
              onPressImage={(idx) => {
                setGalleryIndex(idx)
                setIsViewerOpen(true)
              }}
            />

            {/* 2. Listing Header Block */}
            <ListingHeaderBlock
              title={data.title}
              kindLabel={
                data.listingType === 'SALE'
                  ? 'للبيع'
                  : data.listingType === 'RENTAL'
                  ? 'للإيجار'
                  : 'مطلوب للشراء'
              }
              conditionLabel={data.conditionLabel}
              price={data.price}
              locationText={data.location.fullLocationText}
              postedAtLabel={data.postedAtLabel}
              statusBadge={
                data.status === 'SOLD'
                  ? { label: 'تم البيع', tone: 'danger' }
                  : data.status === 'RENTED'
                  ? { label: 'تم التأجير', tone: 'warning' }
                  : data.status === 'ARCHIVED'
                  ? { label: 'مؤرشف', tone: 'neutral' }
                  : undefined
              }
            />

            {/* 3. Owner Management Bar (when viewer is owner) */}
            {isOwner ? (
              <OwnerManageBar
                viewCount={data.viewCount}
                busy={false}
                actions={[
                  {
                    id: 'edit',
                    label: 'تعديل',
                    tone: 'primary',
                    icon: 'pencil-outline',
                  },
                  {
                    id: 'markSold',
                    label: 'تمييز كمباع',
                    tone: 'neutral',
                    icon: 'checkmark-circle-outline',
                  },
                  {
                    id: 'delete',
                    label: 'حذف',
                    tone: 'danger',
                    icon: 'trash-outline',
                  },
                ]}
                onAction={handleOwnerAction}
              />
            ) : null}

            {/* 4. Inline Contact Actions (when not owner) */}
            {!isOwner ? (
              <ContactActions
                variant="inline"
                availability={contactAvailability}
                busy={false}
                onCall={handleContactCall}
                onWhatsApp={handleContactWhatsApp}
                onChat={handleContactChat}
              />
            ) : null}

            {/* 5. Seller Card */}
            <SellerCard seller={data.seller} onPressProfile={handleProfilePress} />

            {/* 6. Description Block */}
            <ListingDescription text={data.description} collapsedLines={5} />

            {/* 7. Specs Sections */}
            <SpecsSections sections={data.specsSections} />

            {/* 8. Similar Listings Grid */}
            <SimilarListingsGrid<SimilarCarItem>
              items={MOCK_SIMILAR_ITEMS}
              isLoading={false}
              isError={false}
              onRetry={() => {}}
              page={similarPage}
              pageCount={3}
              onPageChange={setSimilarPage}
              columns={2}
              renderItem={(car) => (
                <View style={s.similarCard}>
                  <View style={s.similarCardImagePlaceholder}>
                    <Ionicons
                      name="car-sport"
                      size={28}
                      color={Colors.primaryLight}
                    />
                  </View>
                  <Text style={s.similarCardTitle} numberOfLines={2}>
                    {car.title}
                  </Text>
                  <Text style={s.similarCardPrice}>{car.price}</Text>
                  <Text style={s.similarCardMeta}>{car.location}</Text>
                </View>
              )}
            />

            {/* 9. Safety Guidelines */}
            <SafetyTips
              role={isOwner ? 'seller' : 'buyer'}
              title={
                isOwner
                  ? 'نصائح أمان وإرشادات للمعلن'
                  : 'نصائح وإرشادات أمان للمشتري'
              }
              tips={buyerTips}
            />

            {/* 10. Support Button */}
            <SupportButton onPress={handleSupportPress} />
          </Animated.ScrollView>

          {/* Sticky Contact Actions Bar (at screen bottom when not owner) */}
          {!isOwner && contactAvailability.mode !== 'hidden' ? (
            <ContactActions
              variant="sticky"
              availability={contactAvailability}
              busy={false}
              onCall={handleContactCall}
              onWhatsApp={handleContactWhatsApp}
              onChat={handleContactChat}
            />
          ) : null}

          {/* Fullscreen Photo Viewer Modal */}
          <ImageViewerModal
            visible={isViewerOpen}
            images={data.images}
            initialIndex={galleryIndex}
            onClose={() => setIsViewerOpen(false)}
          />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  devBarHeader: {
    backgroundColor: '#0F172A',
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space2,
    zIndex: 110,
  },
  devBarToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    gap: 6,
  },
  devBarToggleText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.white,
  },
  devPanel: {
    backgroundColor: '#1E293B',
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space3,
    zIndex: 109,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  devSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 6,
    textAlign: 'left',
  },
  chipsScroll: {
    gap: 6,
    paddingBottom: 8,
  },
  scenarioChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#334155',
    borderRadius: Radius.pill,
  },
  scenarioChipActive: {
    backgroundColor: Colors.accent,
  },
  scenarioChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: '#E2E8F0',
  },
  scenarioChipTextActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.white,
  },
  devRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  toggleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  toggleChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#E2E8F0',
  },
  toggleChipTextActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.white,
  },
  overrideScroll: {
    gap: 6,
  },
  stateChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#334155',
    borderRadius: Radius.sm,
  },
  stateChipActive: {
    backgroundColor: Colors.error,
  },
  stateChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#CBD5E1',
  },
  stateChipTextActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.white,
  },
  overrideContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  mainWrapper: {
    flex: 1,
  },
  scrollContent: {
    gap: Spacing.space2,
  },
  similarCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  similarCardImagePlaceholder: {
    height: 90,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  similarCardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  similarCardPrice: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'left',
  },
  similarCardMeta: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'left',
    marginTop: 2,
  },
})
