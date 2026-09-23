import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
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
import { SimilarListingsSwiper } from '../../components/listing-detail/SimilarListingsSwiper'
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
  const [isDevModalOpen, setIsDevModalOpen] = useState<boolean>(false)

  // Interactive component states
  const [isFavorite, setIsFavorite] = useState<boolean>(false)
  const [favoriteBusy, setFavoriteBusy] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)

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
            paddingTop={insets.top + 4}
          />

          <Animated.ScrollView
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={[
              s.scrollContent,
              {
                paddingBottom: !isOwner && contactAvailability.mode !== 'hidden' ? 90 : 40,
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

            {/* 8. Similar Listings Swiper */}
            <SimilarListingsSwiper<SimilarCarItem>
              items={MOCK_SIMILAR_ITEMS}
              isLoading={false}
              isError={false}
              onRetry={() => {}}
              cardWidth={155}
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

          {/* Sticky Contact Actions Bar (when buyer & contact available, scroll-aware) */}
          {!isOwner && contactAvailability.mode !== 'hidden' ? (
            <ContactActions
              variant="sticky"
              availability={contactAvailability}
              busy={false}
              onCall={handleContactCall}
              onWhatsApp={handleContactWhatsApp}
              onChat={handleContactChat}
              scrollY={scrollY}
              threshold={320}
            />
          ) : null}

          {/* Sticky Owner Manage Bar (when owner, scroll-aware) */}
          {isOwner ? (
            <OwnerManageBar
              variant="sticky"
              viewCount={data.viewCount ?? 0}
              busy={false}
              actions={[
                {
                  id: 'edit',
                  label: 'تعديل',
                  tone: 'primary',
                  icon: 'create-outline',
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
              scrollY={scrollY}
              threshold={320}
            />
          ) : null}

          {/* Floating Dev Control Button */}
          <TouchableOpacity
            style={[
              s.floatingDevFab,
              {
                bottom:
                  (!isOwner && contactAvailability.mode !== 'hidden') || isOwner
                    ? 78
                    : 24,
              },
            ]}
            onPress={() => setIsDevModalOpen(true)}
            activeOpacity={0.85}
            testID="btn-open-dev-modal"
          >
            <Ionicons name="options" size={16} color={Colors.white} />
            <Text style={s.floatingDevFabText}>معمل التجارب</Text>
          </TouchableOpacity>

          {/* Fullscreen Photo Viewer Modal */}
          <ImageViewerModal
            visible={isViewerOpen}
            images={data.images}
            initialIndex={galleryIndex}
            onClose={() => setIsViewerOpen(false)}
          />
        </View>
      )}

      {/* Dev Controls Bottom Sheet Modal */}
      <Modal
        visible={isDevModalOpen}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsDevModalOpen(false)}
      >
        <View style={s.modalOverlay}>
          <TouchableOpacity
            style={s.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsDevModalOpen(false)}
          />
          <View style={[s.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            {/* Sheet Handle */}
            <View style={s.sheetHandle} />

            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>لوحة تحكم معمل التجارب</Text>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setIsDevModalOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={Colors.text2} />
              </TouchableOpacity>
            </View>

            {/* Scenario Picker */}
            <Text style={s.devSectionTitle}>اختر السيناريو المعروض:</Text>
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

            <View style={s.devDivider} />

            {/* Viewer Mode & States */}
            <Text style={s.devSectionTitle}>وضع العرض وحالة الصفحة:</Text>
            <View style={s.devRow}>
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
                    onPress={() => {
                      setOverrideState(st)
                      if (st !== 'normal') {
                        setIsDevModalOpen(false)
                      }
                    }}
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
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  floatingDevFab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    zIndex: 95,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.floating,
  },
  floatingDevFabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    ...Shadows.floating,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderStrong,
    alignSelf: 'center',
    marginBottom: Spacing.space3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3,
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    color: Colors.text,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.textMuted,
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
    backgroundColor: Colors.surface,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scenarioChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  scenarioChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.text2,
  },
  scenarioChipTextActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.white,
  },
  devDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.space3,
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
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  toggleChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.text2,
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
    paddingVertical: 5,
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stateChipActive: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  stateChipText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: Colors.text2,
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
    padding: Spacing.space2 + 2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  similarCardImagePlaceholder: {
    height: 75,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  similarCardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  similarCardPrice: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    color: Colors.primary,
    textAlign: 'left',
  },
  similarCardMeta: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'left',
    marginTop: 1,
  },
})
