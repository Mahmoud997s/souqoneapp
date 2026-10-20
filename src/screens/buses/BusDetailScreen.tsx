import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Linking,
  InteractionManager,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { SUPPORT_MAILTO } from '../../constants/support'
import MapView, { Marker } from '../../components/ui/Map'
import { useAuthStore } from '../../store/authStore'
import { useBusWizardStore } from '../../store/busWizardStore'
import { dialogService } from '../../store/dialogStore'

// Hooks & Utilities
import { useBusDetail } from '../../hooks/listing-detail/useBusDetail'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { useRequireAuth } from '../../hooks/listing-detail/useRequireAuth'
import {
  useBusOwnerActions,
  isOptimisticLockError,
} from '../../hooks/listing-detail/useBusOwnerActions'
import {
  useBusSimilarListings,
  type SimilarBusItem,
} from '../../hooks/listing-detail/useBusSimilarListings'
import { busListingToFormData } from '../../utils/listing-detail/busListingToFormData'
import { translateBusOwnerError } from '../../utils/listing-detail/busOwnerErrors'
import { formatNumberWestern, parseDecimal } from '../../utils/listing-detail/formatters'
import {
  BUYER_SAFETY_TIPS_TITLE,
  BUYER_SAFETY_TIPS,
  SELLER_SAFETY_TIPS_TITLE,
  SELLER_SAFETY_TIPS,
} from '../../constants/listing-detail/safetyTips'

// Presentational Components
import { BusDetailNavBar } from '../../components/buses/detail/BusDetailNavBar'
import { ImageGallery } from '../../components/listing-detail/ImageGallery'
import { ImageViewerModal } from '../../components/listing-detail/ImageViewerModal'
import { ListingHeaderBlock } from '../../components/listing-detail/ListingHeaderBlock'
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
import { BusContractSection } from '../../components/buses/detail/BusContractSection'
import { SimilarListingsGrid } from '../../components/listing-detail/SimilarListingsGrid'
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import { DetailStates } from '../../components/listing-detail/DetailStates'

import type { BusDetailViewModel } from '../../types/busDetailViewModel.types'

const DUMMY_VM: BusDetailViewModel = {
  id: '',
  version: 1,
  status: 'ACTIVE',
  title: '',
  description: '',
  listingType: 'SALE',
  busListingType: 'BUS_SALE',
  busTypeLabel: '',
  price: {
    amount: 0,
    formattedAmount: '0',
    currency: 'ر.ع',
    fullPriceLabel: '0 ر.ع',
    isNegotiable: false,
    listingType: 'BUS_SALE',
  },
  images: [],
  location: { fullLocationText: '', hasCoordinates: false },
  seller: { id: '', name: '', username: '', isVerified: false, memberSinceLabel: '' },
  whatsappEnabled: true,
  postedAtLabel: '',
  viewCount: 0,
  make: '',
  model: '',
  keySpecs: [],
  specsSections: [],
  features: [],
  contract: { access: 'hidden' },
}

export interface BusDetailScreenProps {
  id: string
}

/**
 * BusDetailScreen
 * Real-data container screen for bus and transport listings.
 * Connects useBusDetail and bus foundation hooks to listing-detail presentational components.
 */
export function BusDetailScreen({ id }: BusDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()
  const { requireAuth } = useRequireAuth()

  // 1. Data Query
  const { state, vm, raw, refetch } = useBusDetail(id)

  // 2. Viewer & Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. Foundation Hooks (called unconditionally at top level)
  const currentVm = vm ?? DUMMY_VM
  const favoriteToggle = useFavoriteToggle('BUS_LISTING', id, false, { redirectPath: `/buses/${id}` })
  const contact = useListingContact('BUS_LISTING', id, `/buses/${id}`, vm?.title)
  const ownerActions = useBusOwnerActions(currentVm)
  const similarListings = useBusSimilarListings(id)

  // 4. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [similarPage, setSimilarPage] = useState<number>(1)
  const [isMapMounted, setIsMapMounted] = useState<boolean>(false)

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsMapMounted(true)
    })
    return () => task.cancel()
  }, [])

  // 5. Scroll Tracker for glassmorphism and sticky bars
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // Handlers
  const goBackSafely = () => {
    if (router.canGoBack()) router.back()
    else router.push('/')
  }

  const handleSearchSubmit = (text: string) => {
    router.push({
      pathname: '/buses/browse' as any,
      params: { search: text },
    })
  }

  const handleProfilePress = (sellerId: string) => {
    router.push(`/profile/${sellerId}` as any)
  }

  const handleSupportPress = () => {
    Linking.openURL(SUPPORT_MAILTO).catch(() => {})
  }

  const handleRequireLogin = () => {
    requireAuth(`/buses/${id}`, () => {})
  }

  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      if (raw) {
        const formData = busListingToFormData(raw)
        useBusWizardStore.getState().setEditMode(raw.id, formData, raw.version)
        router.push('/buses/new' as any)
      }
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
          dialogService.alert('تعارض في البيانات', translateBusOwnerError(err))
        } else {
          dialogService.alert('خطأ', translateBusOwnerError(err))
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

  // Contact availability mode (optimistic display respecting whatsappEnabled & status)
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

  // Filter specs sections by search query if present
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

  const kindLabel =
    vm.busListingType === 'BUS_SALE'
      ? 'للبيع'
      : vm.busListingType === 'BUS_RENT'
      ? 'للإيجار'
      : 'بيع مع عقد'

  return (
    <View style={s.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Glassmorphic Navigation Bar (Without Share Button) */}
      <BusDetailNavBar
        onBack={goBackSafely}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        scrollY={scrollY}
        placeholder="ابحث في تفاصيل الحافلة..."
        paddingTop={insets.top + 4}
      />

      {/* Main Content ScrollView */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingBottom:
              (!isOwner && contactAvailability.mode !== 'hidden') || isOwner ? 90 : 40,
          },
        ]}
      >
        {/* 1. Image Gallery */}
        <ImageGallery
          images={vm.images}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onPressImage={(idx) => {
            setGalleryIndex(idx)
            setIsViewerOpen(true)
          }}
        />

        {/* 2. Listing Header Block */}
        <ListingHeaderBlock
          title={vm.title}
          kindLabel={kindLabel}
          conditionLabel={vm.conditionLabel}
          price={vm.price}
          locationText={vm.location.fullLocationText}
          postedAtLabel={vm.postedAtLabel}
          statusBadge={
            vm.status === 'SOLD'
              ? { label: 'تم البيع', tone: 'danger' }
              : vm.status === 'RENTED'
              ? { label: 'تم التأجير', tone: 'warning' }
              : vm.status === 'ARCHIVED'
              ? { label: 'مؤرشف', tone: 'neutral' }
              : undefined
          }
        />

        {/* 3. Owner Management Bar (when viewer is owner) */}
        {isOwner ? (
          <OwnerManageBar
            variant="inline"
            viewCount={ownerActions.viewCount}
            busy={ownerActions.busy}
            actions={ownerActions.actions}
            onAction={handleOwnerAction}
          />
        ) : null}

        {/* 4. Inline Contact Actions (when not owner) */}
        {!isOwner && contactAvailability.mode !== 'hidden' ? (
          <ContactActions
            variant="inline"
            availability={contactAvailability}
            busy={contact.busy}
            onCall={contact.call}
            onWhatsApp={contact.whatsApp}
            onChat={contact.chat}
          />
        ) : null}

        {/* 5. Seller Card (when not owner) */}
        {!isOwner ? (
          <SellerCard seller={vm.seller} onPressProfile={handleProfilePress} />
        ) : null}

        {/* 6. Listing Description */}
        <ListingDescription text={vm.description} collapsedLines={5} />

        {/* 7. Specs Sections (filtered by section search) */}
        <SpecsSections sections={filteredSpecsSections} />

        {/* 8. Bus Commercial Contract Section */}
        <BusContractSection
          contract={vm.contract}
          price={vm.price}
          busListingType={vm.busListingType}
          onRequireLogin={handleRequireLogin}
        />

        {/* 9. Location Map (only when the listing has coordinates) */}
        {vm.location.hasCoordinates &&
        vm.location.latitude !== undefined &&
        vm.location.longitude !== undefined ? (
          <View style={s.mapSection}>
            <Text style={s.mapSectionTitle}>الموقع والعنوان</Text>
            <View style={s.mapContainer}>
              {isMapMounted ? (
                <>
                  <MapView
                    style={{ width: '100%', height: '100%' }}
                    initialRegion={{
                      latitude: vm.location.latitude,
                      longitude: vm.location.longitude,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: vm.location.latitude,
                        longitude: vm.location.longitude,
                      }}
                    />
                  </MapView>
                  <View style={StyleSheet.absoluteFill} />
                </>
              ) : (
                <View style={s.mapPlaceholder}>
                  <Ionicons name="location-outline" size={32} color={Colors.primary} />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={s.directionsBtn}
              activeOpacity={0.8}
              onPress={() => {
                Linking.openURL(
                  `https://www.google.com/maps/dir/?api=1&destination=${vm.location.latitude},${vm.location.longitude}`
                )
              }}
            >
              <Ionicons name="navigate-circle-outline" size={24} color={Colors.primary} />
              <Text style={s.directionsTxt}>الحصول على الاتجاهات</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* 10. Similar Listings Grid */}
        <SimilarListingsGrid<SimilarBusItem>
          items={similarListings.items}
          isLoading={similarListings.isLoading}
          isError={similarListings.isError}
          onRetry={similarListings.refetch}
          page={similarPage}
          pageCount={1}
          onPageChange={setSimilarPage}
          renderItem={(bus) => {
            const rawImg = bus.images?.[0]
            const imgUri = typeof rawImg === 'string' ? rawImg : rawImg?.url
            const priceVal = bus.dailyPrice ?? bus.monthlyPrice ?? bus.price
            return (
              <TouchableOpacity
                key={bus.id}
                style={s.similarCard}
                onPress={() => router.push(`/buses/${bus.id}` as any)}
                activeOpacity={0.8}
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
                      name="bus-outline"
                      size={28}
                      color={Colors.primaryLight}
                    />
                  )}
                </View>
                <Text style={s.similarCardTitle} numberOfLines={2}>
                  {bus.title}
                </Text>
                <Text style={s.similarCardPrice}>
                  {priceVal !== undefined && priceVal !== null
                    ? `${formatNumberWestern(parseDecimal(priceVal) ?? priceVal)} ${bus.currency ?? 'ر.ع'}`
                    : ''}
                </Text>
                <Text style={s.similarCardMeta}>
                  {bus.governorateNameAr ?? ''}
                </Text>
              </TouchableOpacity>
            )
          }}
        />

        {/* 11. Safety Tips */}
        <SafetyTips
          role={isOwner ? 'seller' : 'buyer'}
          title={isOwner ? SELLER_SAFETY_TIPS_TITLE : BUYER_SAFETY_TIPS_TITLE}
          tips={isOwner ? SELLER_SAFETY_TIPS : BUYER_SAFETY_TIPS}
        />

        {/* 12. Support Button */}
        <SupportButton onPress={handleSupportPress} />
      </Animated.ScrollView>

      {/* Sticky Contact Actions Bar (when buyer & contact available) */}
      {!isOwner && contactAvailability.mode !== 'hidden' ? (
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

      {/* Sticky Owner Manage Bar (when owner) */}
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
      ) : null}

      {/* Fullscreen Photo Viewer Modal */}
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
  mapSection: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  mapSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
  },
  mapContainer: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.paleMint,
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directionsTxt: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    fontSize: 14,
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
    overflow: 'hidden',
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
