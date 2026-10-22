import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Linking,
  TouchableOpacity,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  FadeInDown,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { RTLText } from '../../constants/rtl'
import { lineHeightFor } from '../../constants/typography'
import { SUPPORT_MAILTO } from '../../constants/support'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'

// Hooks & Utilities
import { useEquipmentDetail } from '../../hooks/listing-detail/useEquipmentDetail'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import {
  useEquipmentOwnerActions,
  isOptimisticLockError,
} from '../../hooks/listing-detail/useEquipmentOwnerActions'
import {
  useEquipmentSimilarListings,
  type SimilarEquipmentItem,
} from '../../hooks/listing-detail/useEquipmentSimilarListings'
import { translateEquipmentOwnerError } from '../../utils/listing-detail/equipmentOwnerErrors'
import { normalizeCurrency } from '../../utils/listing-detail/mapEquipmentDetail'
import { formatNumberWestern, parseDecimal } from '../../utils/listing-detail/formatters'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import {
  EQUIPMENT_BUYER_SAFETY_TIPS_TITLE,
  EQUIPMENT_BUYER_SAFETY_TIPS,
  EQUIPMENT_RENTER_SAFETY_TIPS_TITLE,
  EQUIPMENT_RENTER_SAFETY_TIPS,
  EQUIPMENT_SELLER_SAFETY_TIPS_TITLE,
  EQUIPMENT_SELLER_SAFETY_TIPS,
} from '../../constants/listing-detail/safetyTips'

// Presentational Components
import { ImageGallery } from '../../components/listing-detail/ImageGallery'
import { ImageViewerModal } from '../../components/listing-detail/ImageViewerModal'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import {
  ContactActions,
  type ContactAvailability,
} from '../../components/listing-detail/ContactActions'
import {
  OwnerManageBar,
  type OwnerActionId,
} from '../../components/listing-detail/OwnerManageBar'
import { ListingDescription } from '../../components/listing-detail/ListingDescription'
import { SpecsSections } from '../../components/listing-detail/SpecsSections'
import { SimilarListingsGrid } from '../../components/listing-detail/SimilarListingsGrid'
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import { DetailStates } from '../../components/listing-detail/DetailStates'

// Equipment-Specific Presentational Components
import {
  EquipmentDetailNavBar,
  EquipmentHeaderBlock,
  EquipmentRentalCard,
  EquipmentWantedCard,
  EquipmentLocationCard,
} from '../../components/equipment/detail'

import type { EquipmentDetailViewModel } from '../../types/equipmentDetailViewModel.types'

const DUMMY_VM: EquipmentDetailViewModel = {
  id: '', version: 1, status: 'ACTIVE', title: '', description: '', listingType: 'SALE',
  equipmentListingType: 'EQUIPMENT_SALE', equipmentType: 'EXCAVATOR', equipmentTypeLabel: '',
  price: { amount: 0, formattedAmount: '0', currency: 'ر.ع', fullPriceLabel: '0 ر.ع', isNegotiable: false, listingType: 'SALE' },
  images: [], location: { fullLocationText: '', hasCoordinates: false },
  seller: { id: '', name: '', username: '', isVerified: false, memberSinceLabel: '' },
  whatsappEnabled: true, postedAtLabel: '', viewCount: 0, keySpecs: [], specsSections: [],
  features: [], operatorBadge: null, rental: null, wanted: null,
}

export interface EquipmentDetailScreenProps {
  id: string
}

/**
 * EquipmentDetailScreen
 * Real-data container screen for equipment listings (sale, rent, wanted).
 * Replaces old legacy equipment detail route with modern listing-detail architecture.
 */
export function EquipmentDetailScreen({ id }: EquipmentDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()

  // 1. Data Query
  const { state, vm, refetch } = useEquipmentDetail(id)

  // 2. Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. Foundation Hooks
  const currentVm = vm ?? DUMMY_VM
  const favoriteToggle = useFavoriteToggle('EQUIPMENT_LISTING', id, false, {
    redirectPath: `/equipment/${id}`,
  })
  const contact = useListingContact('EQUIPMENT_LISTING', id, `/equipment/${id}`, vm?.title)
  const ownerActions = useEquipmentOwnerActions(currentVm)
  const similarListings = useEquipmentSimilarListings(id)

  // 4. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [similarPage, setSimilarPage] = useState<number>(1)

  // 5. Scroll Tracker for glassmorphic navbar and sticky bars
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // 6. Reduced Motion & Animations
  const shouldReduceMotion = useAppReducedMotion()

  const heroParallaxStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) return {}
    const translateY = interpolate(scrollY.value, [-150, 0, 250], [-40, 0, 60], Extrapolation.CLAMP)
    const scale = interpolate(scrollY.value, [-150, 0], [1.1, 1], Extrapolation.CLAMP)
    return { transform: [{ translateY }, { scale }] }
  })

  const getEnteringAnimation = (index: number) =>
    shouldReduceMotion ? undefined : FadeInDown.delay(index * 50).springify()

  const goBackSafely = () => (router.canGoBack() ? router.back() : router.push('/'))
  const handleSearchSubmit = (text: string) => router.push({ pathname: '/equipment/browse', params: { search: text } })
  const handleProfilePress = (sellerId: string) => sellerId && router.push(`/profile/${sellerId}`)
  const handleSupportPress = () => Linking.openURL(SUPPORT_MAILTO).catch(() => {})

  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      router.push(`/equipment/edit/${id}`)
      return
    }

    const action = ownerActions.actions.find((a) => a.id === actionId)
    if (!action) return

    const execute = async () => {
      try {
        await ownerActions.run(actionId)
        if (actionId === 'delete') {
          goBackSafely()
        }
      } catch (err: unknown) {
        if (isOptimisticLockError(err)) {
          dialogService.alert('تعارض في البيانات', translateEquipmentOwnerError(err))
        } else {
          dialogService.alert('خطأ', translateEquipmentOwnerError(err))
        }
      }
    }

    if (action.requiresConfirm) {
      dialogService.confirm(
        action.confirmTitle ?? 'تأكيد الإجراء',
        action.confirmMessage ?? 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
        execute,
        action.confirmLabel ?? 'تأكيد',
        'إلغاء',
        action.tone === 'danger'
      )
    } else {
      await execute()
    }
  }

  // Contact availability mode
  const getContactAvailability = (): ContactAvailability => {
    if (!vm || isOwner || vm.status === 'SOLD' || vm.status === 'ARCHIVED' || vm.status === 'SUSPENDED') {
      return { mode: 'hidden' }
    }
    if (!vm.whatsappEnabled) {
      return { mode: 'noWhatsapp' }
    }
    return { mode: 'full' }
  }

  const contactAvailability = getContactAvailability()

  // Filter specs sections by search query
  const filteredSpecsSections = useMemo(() => {
    if (!vm) return []
    if (!searchQuery.trim()) return vm.specsSections
    const q = searchQuery.trim().toLowerCase()
    return vm.specsSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.value.toLowerCase().includes(q)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [vm, searchQuery])

  // Non-ready states render DetailStates directly
  if (state !== 'ready' || !vm) {
    return (
      <View style={s.rootContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <DetailStates
          kind={state === 'ready' ? 'loading' : state}
          onRetry={refetch}
          onBack={goBackSafely}
        />
      </View>
    )
  }

  const isWanted = vm.equipmentListingType === 'EQUIPMENT_WANTED'
  const isRental = vm.equipmentListingType === 'EQUIPMENT_RENT'

  const kindLabel = isWanted
    ? 'مطلوب معدة'
    : isRental
    ? 'للإيجار'
    : 'للبيع'

  // Safety tips resolution
  const tipsTitle = isOwner
    ? EQUIPMENT_SELLER_SAFETY_TIPS_TITLE
    : isRental
    ? EQUIPMENT_RENTER_SAFETY_TIPS_TITLE
    : EQUIPMENT_BUYER_SAFETY_TIPS_TITLE

  const tipsList = isOwner
    ? EQUIPMENT_SELLER_SAFETY_TIPS
    : isRental
    ? EQUIPMENT_RENTER_SAFETY_TIPS
    : EQUIPMENT_BUYER_SAFETY_TIPS

  const statusBadge =
    vm.status === 'SOLD' ? { label: 'تم البيع', tone: 'danger' as const }
    : vm.status === 'RENTED' ? { label: 'تم التأجير', tone: 'warning' as const }
    : vm.status === 'ARCHIVED' ? { label: 'مؤرشف', tone: 'neutral' as const }
    : vm.status === 'DRAFT' ? { label: 'مسودة', tone: 'neutral' as const }
    : undefined

  const hasBottomBar = isOwner || contactAvailability.mode !== 'hidden'

  return (
    <View style={s.rootContainer} testID="equipment-detail-screen">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Navigation Bar (NO share button) */}
      <EquipmentDetailNavBar
        onBack={goBackSafely}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        scrollY={scrollY}
        placeholder="ابحث في تفاصيل المعدة..."
        paddingTop={insets.top + 4}
      />

      {/* Main Content ScrollView */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: hasBottomBar ? 90 : 40 },
        ]}
        testID="equipment-detail-scroll-view"
      >
        {/* 1. Image Gallery */}
        <Animated.View style={heroParallaxStyle}>
          <ImageGallery
            images={vm.images}
            index={galleryIndex}
            onIndexChange={setGalleryIndex}
            onPressImage={(idx) => {
              setGalleryIndex(idx)
              setIsViewerOpen(true)
            }}
          />
        </Animated.View>

        {/* 2. Header Block (title, price/no-price, operator badge under price for RENT) */}
        <Animated.View entering={getEnteringAnimation(1)}>
          <EquipmentHeaderBlock
            title={vm.title}
            kindLabel={kindLabel}
            conditionLabel={vm.conditionLabel}
            price={vm.price}
            isWanted={isWanted}
            isRental={isRental}
            operatorBadge={vm.operatorBadge}
            locationText={vm.location.fullLocationText}
            postedAtLabel={vm.postedAtLabel}
            statusBadge={statusBadge}
          />
        </Animated.View>

        {/* 3. Inline Contact Actions (visitor only) */}
        {!isOwner && contactAvailability.mode !== 'hidden' ? (
          <Animated.View entering={getEnteringAnimation(2)}>
            <ContactActions
              variant="inline"
              availability={contactAvailability}
              onChat={contact.chat}
              onCall={contact.call}
              onWhatsApp={contact.whatsApp}
              busy={contact.busy}
            />
          </Animated.View>
        ) : null}

        {/* 4. Seller Card */}
        <Animated.View entering={getEnteringAnimation(3)}>
          <SellerCard
            seller={vm.seller}
            onPressProfile={() => handleProfilePress(vm.seller.id)}
          />
        </Animated.View>

        {/* 5. Description */}
        {vm.description ? (
          <Animated.View entering={getEnteringAnimation(4)}>
            <ListingDescription text={vm.description} />
          </Animated.View>
        ) : null}

        {/* 6. Key Specs (Hours Used first) */}
        {vm.keySpecs.length > 0 ? (
          <Animated.View entering={getEnteringAnimation(5)}>
            <SpecsSections
              sections={[{ title: 'أبرز المواصفات', items: vm.keySpecs }]}
            />
          </Animated.View>
        ) : null}

        {/* 7. Rental Terms Card (RENT only) */}
        {isRental && vm.rental ? (
          <Animated.View entering={getEnteringAnimation(6)}>
            <EquipmentRentalCard rental={vm.rental} />
          </Animated.View>
        ) : null}

        {/* 8. Wanted Request Details Card (WANTED only) */}
        {isWanted && vm.wanted ? (
          <Animated.View entering={getEnteringAnimation(7)}>
            <EquipmentWantedCard wanted={vm.wanted} />
          </Animated.View>
        ) : null}

        {/* 9. Structured Specifications Sections */}
        {filteredSpecsSections.length > 0 ? (
          <Animated.View entering={getEnteringAnimation(8)}>
            <SpecsSections sections={filteredSpecsSections} />
          </Animated.View>
        ) : null}

        {/* 10. Additional Features Chips */}
        {vm.features.length > 0 ? (
          <Animated.View entering={getEnteringAnimation(9)}>
            <SpecsSections
              sections={[
                {
                  title: 'المميزات الإضافية',
                  items: vm.features.map((f) => ({
                    key: f,
                    label: f,
                    value: '',
                    icon: 'checkmark-circle-outline',
                  })),
                },
              ]}
            />
          </Animated.View>
        ) : null}

        {/* 11. Text Location Card (NO embedded map) */}
        <Animated.View entering={getEnteringAnimation(10)}>
          <EquipmentLocationCard
            locationText={vm.location.fullLocationText}
            latitude={vm.location.latitude}
            longitude={vm.location.longitude}
          />
        </Animated.View>

        {/* 12. Similar Listings Grid (shows loading, error, items; hides when empty) */}
        {similarListings.items.length > 0 || similarListings.isLoading || similarListings.isError ? (
          <Animated.View entering={getEnteringAnimation(11)} testID="equipment-similar-section">
            <SimilarListingsGrid<SimilarEquipmentItem>
              items={similarListings.items}
              isLoading={similarListings.isLoading}
              isError={similarListings.isError}
              onRetry={similarListings.refetch}
              page={similarPage}
              pageCount={1}
              onPageChange={setSimilarPage}
              renderItem={(eq) => {
                const rawImg = eq.images?.[0]
                const imgUri = typeof rawImg === 'string' ? rawImg : rawImg?.url
                const priceVal = eq.dailyPrice ?? eq.monthlyPrice ?? eq.price
                const periodSuffix =
                  eq.dailyPrice !== undefined && eq.dailyPrice !== null
                    ? ' / يوم'
                    : eq.monthlyPrice !== undefined && eq.monthlyPrice !== null
                    ? ' / شهر'
                    : ''
                const currencyLabel = normalizeCurrency(eq.currency)
                const priceDisplay =
                  priceVal !== undefined && priceVal !== null
                    ? `${formatNumberWestern(parseDecimal(priceVal) ?? Number(priceVal))} ${currencyLabel}${periodSuffix}`
                    : ''

                return (
                  <TouchableOpacity
                    key={eq.id}
                    style={s.similarCard}
                    onPress={() => router.push(`/equipment/${eq.id}`)}
                    activeOpacity={0.8}
                    testID="similar-item-card"
                  >
                    <View style={s.similarCardImagePlaceholder}>
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                      ) : (
                        <Ionicons
                          name="hardware-chip-outline"
                          size={28}
                          color={Colors.primary}
                        />
                      )}
                    </View>
                    <Text style={s.similarCardTitle} numberOfLines={2}>
                      {eq.title}
                    </Text>
                    {priceDisplay ? (
                      <Text style={s.similarCardPrice} numberOfLines={1}>
                        {priceDisplay}
                      </Text>
                    ) : null}
                    {eq.city ? (
                      <Text style={s.similarCardMeta} numberOfLines={1}>
                        {eq.city}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                )
              }}
            />
          </Animated.View>
        ) : null}

        {/* 13. Safety Tips */}
        <Animated.View entering={getEnteringAnimation(12)}>
          <SafetyTips
            role={isOwner ? 'seller' : 'buyer'}
            title={tipsTitle}
            tips={tipsList}
          />
        </Animated.View>

        {/* 14. Support Button */}
        <Animated.View entering={getEnteringAnimation(13)}>
          <SupportButton onPress={handleSupportPress} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Fixed Bottom Actions Bar ────────────────────────────── */}
      {isOwner ? (
        <OwnerManageBar
          variant="sticky"
          viewCount={ownerActions.viewCount}
          busy={ownerActions.busy}
          actions={ownerActions.actions}
          onAction={handleOwnerAction}
          scrollY={scrollY}
          threshold={320}
        />
      ) : contactAvailability.mode !== 'hidden' ? (
        <ContactActions
          variant="sticky"
          availability={contactAvailability}
          busy={contact.busy}
          onCall={contact.call}
          onWhatsApp={contact.whatsApp}
          onChat={contact.chat}
          scrollY={scrollY}
          threshold={320}
        />
      ) : null}

      {/* Fullscreen Image Viewer Modal */}
      <ImageViewerModal
        visible={isViewerOpen}
        images={vm.images}
        initialIndex={galleryIndex}
        onClose={() => setIsViewerOpen(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    gap: Spacing.space2,
  },
  similarCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  similarCardImagePlaceholder: {
    height: 88,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
    overflow: 'hidden',
  },
  similarCardTitle: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    textAlign: 'left',
    marginBottom: Spacing.space1,
  },
  similarCardPrice: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.primary,
    textAlign: 'left',
  },
  similarCardMeta: {
    ...RTLText,
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'left',
    marginTop: 2,
  },
})
