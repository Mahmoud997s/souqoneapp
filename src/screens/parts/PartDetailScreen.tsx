import React, { useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Linking,
  RefreshControl,
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
import { useRouter, router as expoRouter } from 'expo-router'
import { startEdit } from '../../navigation/listingRoutes'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { TopBarTokens, DetailLayoutTokens } from '../../constants/topBarTokens'
import { lineHeightFor } from '../../constants/typography'
import { SUPPORT_MAILTO } from '../../constants/support'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { toastService } from '../../store/toastStore'
import { usePartWizardStore, resolvePartListingType } from '../../store/partWizardStore'
import { partsApi } from '../../api/parts'
import { assertOwnerHasPhoneForEdit } from '../../utils/assertOwnerHasPhoneForEdit'

// Hooks
import { usePartDetail } from './hooks/usePartDetail'
import { useDetailRefresh } from '../../hooks/listing-detail/useDetailRefresh'
import { invalidatePartListingQueries } from './hooks/partQueryKeys'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { useShareListing } from '../../hooks/listing-detail/useShareListing'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

// Presentational Components
import { ImageGallery } from '../../components/listing-detail/ImageGallery'
import { ImageViewerModal } from '../../components/listing-detail/ImageViewerModal'
import { ListingHeaderBlock } from '../../components/listing-detail/ListingHeaderBlock'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import { LocationCard } from '../../components/listing-detail/LocationCard'
import { ListingDescription } from '../../components/listing-detail/ListingDescription'
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import { DetailStates, DetailStateKind } from '../../components/listing-detail/DetailStates'
import { DetailTopBar } from '../../components/listing-detail/DetailTopBar'
import { DetailStaleBanner } from '../../components/listing-detail/DetailStaleBanner'
import { getDetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'
import {
  ContactActions,
  type ContactAvailability,
} from '../../components/listing-detail/ContactActions'
import {
  OwnerManageBar,
  type OwnerActionId,
  type OwnerBusyAction,
} from '../../components/listing-detail/OwnerManageBar'

import {
  BUYER_SAFETY_TIPS_TITLE,
  BUYER_SAFETY_TIPS,
  SELLER_SAFETY_TIPS_TITLE,
  SELLER_SAFETY_TIPS,
} from '../../constants/listing-detail/safetyTips'

// Parts-specific components
import { PartSpecsSection, hasMatchingPartSpecs } from './components/PartSpecsSection'
import type { PartDetailViewModel } from '../../types/partDetailViewModel.types'

const DUMMY_VM: PartDetailViewModel = {
  id: '',
  version: 1,
  status: 'ACTIVE',
  title: '',
  description: '',
  listingType: 'SALE',
  condition: 'USED',
  conditionLabel: 'مستعمل',
  price: {
    amount: 0,
    formattedAmount: '0',
    currency: 'ر.ع',
    fullPriceLabel: '0 ر.ع',
    isNegotiable: false,
    listingType: 'SALE',
  },
  images: [],
  location: { fullLocationText: '', hasCoordinates: false },
  seller: { id: '', name: '', username: '', isVerified: false, memberSinceLabel: '' },
  whatsappEnabled: true,
  postedAtLabel: '',
  viewCount: 0,
  partCategory: 'OTHER',
  partCategoryLabel: 'أخرى',
  isOriginal: false,
  originalityLabel: 'تجاري / بديل',
  compatibleMakes: [],
  compatibleMakesLabels: [],
  compatibleModels: [],
  hasWarranty: false,
  compatibleVehicleTypes: [],
  compatibleVehicleTypesLabels: [],
  keySpecs: [],
  specsSections: [],
}

const PART_OWNER_ACTIONS = [
  { id: 'edit' as const, label: 'تعديل', tone: 'primary' as const, icon: 'create-outline' },
  { id: 'delete' as const, label: 'حذف', tone: 'danger' as const, icon: 'trash-outline' },
]

export interface PartDetailScreenProps {
  id: string
}

/**
 * PartDetailScreen
 * Real-data container screen for spare parts detail.
 * Built with the shared listing-detail component architecture for full parity with
 * Cars, Buses, and Equipment.
 */
export function PartDetailScreen({ id }: PartDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const router = typeof useRouter === 'function' ? useRouter() : expoRouter
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // 1. Data Query
  const { state, vm, raw, refetch, isRefetchError, error } = usePartDetail(id)
  const { refreshing, onRefresh } = useDetailRefresh(refetch)

  // 2. Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. Foundation Hooks
  const currentVm = vm ?? DUMMY_VM
  const favoriteToggle = useFavoriteToggle('SPARE_PART', id, false, {
    redirectPath: `/parts/${id}`,
  })
  const shareListing = useShareListing(currentVm, { shareTitle: vm?.title ?? 'إعلان قطعة غيار' })
  const contact = useListingContact('SPARE_PART', id, `/parts/${id}`, vm?.title)

  // 4. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [ownerBusyAction, setOwnerBusyAction] = useState<OwnerBusyAction>(null)
  const ownerBusyRef = useRef<OwnerBusyAction>(null)

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
  const handleSearchSubmit = (text: string) => {
    router.push({
      pathname: '/parts/browse',
      params: { q: text },
    })
  }
  const handleProfilePress = (sellerId: string) => sellerId && router.push(`/profile/${sellerId}`)
  const handleSupportPress = () =>
    Linking.openURL(SUPPORT_MAILTO).catch(() => {
      toastService.show({ kind: 'error', title: 'تعذر فتح تطبيق البريد' })
    })

  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      if (!assertOwnerHasPhoneForEdit()) return
      if (raw) {
        router.push(startEdit('SPARE_PART', raw))
      }
      return
    }

    if (actionId === 'delete') {
      if (ownerBusyRef.current !== null) return
      toastService.confirm({
        title: 'حذف الإعلان',
        message: 'هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.',
        intent: 'danger',
        confirmLabel: 'حذف',
        cancelLabel: 'إلغاء',
        onConfirm: async () => {
          if (ownerBusyRef.current !== null) return
          ownerBusyRef.current = 'delete'
          setOwnerBusyAction('delete')
          try {
            await partsApi.remove(id)
            await invalidatePartListingQueries(queryClient, id, { removeDetail: true })
            toastService.show({ kind: 'success', title: 'تم حذف الإعلان' })
            goBackSafely()
          } catch (e: unknown) {
            const kind = getDetailErrorKind(e)
            let msg = 'فشل حذف الإعلان'
            if (kind === 'offline') {
              msg = 'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.'
            } else if (kind === 'timeout') {
              msg = 'انتهت مهلة الاتصال بالخادم. يرجى إعادة المحاولة.'
            } else if (e instanceof Error && e.message) {
              msg = e.message
            }
            toastService.show({ kind: 'error', title: msg })
          } finally {
            ownerBusyRef.current = null
            setOwnerBusyAction(null)
          }
        },
      })
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

  // Non-ready states render DetailStates directly
  if (state !== 'ready' || !vm) {
    const errorKind = getDetailErrorKind(error)
    const kind: DetailStateKind =
      state === 'loading'
        ? 'loading'
        : state === 'notFound' || errorKind === 'notFound'
        ? 'notFound'
        : errorKind === 'offline' || errorKind === 'timeout' || errorKind === 'serverError'
        ? errorKind
        : 'error'

    return (
      <View style={s.rootContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} translucent />
        <DetailStates
          kind={kind}
          onRetry={refetch}
          onBack={goBackSafely}
        />
      </View>
    )
  }

  const statusBadge =
    vm.status === 'SOLD'
      ? { label: 'تم البيع', tone: 'danger' as const }
      : vm.status === 'ARCHIVED'
      ? { label: 'مؤرشف', tone: 'neutral' as const }
      : vm.status === 'DRAFT'
      ? { label: 'مسودة', tone: 'neutral' as const }
      : undefined

  const hasBottomBar = isOwner || contactAvailability.mode !== 'hidden'

  return (
    <View style={s.rootContainer} testID="part-detail-screen">
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Content ScrollView */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressViewOffset={insets.top + TopBarTokens.detailTopBarBodyHeight}
          />
        }
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: insets.top + TopBarTokens.detailTopBarBodyHeight,
            paddingBottom: hasBottomBar
              ? DetailLayoutTokens.stickyBarContentPadding + insets.bottom
              : DetailLayoutTokens.noBarContentPadding,
          },
        ]}
        testID="part-detail-scroll-view"
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
            category="parts"
            compactEmptyState={true}
          />
        </Animated.View>

        {/* 2. Header Block (location omitted to avoid duplication with LocationCard) */}
        <Animated.View entering={getEnteringAnimation(1)}>
          <ListingHeaderBlock
            title={vm.title}
            kindLabel="قطعة غيار"
            conditionLabel={vm.conditionLabel}
            price={vm.price}
            postedAtLabel={vm.postedAtLabel}
            viewCount={vm.viewCount}
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
              busyAction={contact.busyAction}
            />
          </Animated.View>
        ) : null}

        {/* 4. Seller Card (when not owner) */}
        {!isOwner ? (
          <Animated.View entering={getEnteringAnimation(3)}>
            <SellerCard
              seller={vm.seller}
              onPressProfile={() => handleProfilePress(vm.seller.id)}
            />
          </Animated.View>
        ) : null}

        {/* 5. Description */}
        {vm.description ? (
          <Animated.View entering={getEnteringAnimation(4)}>
            <ListingDescription text={vm.description} collapsedLines={5} />
          </Animated.View>
        ) : null}

        {/* 6. Technical Specifications & Compatibility Section */}
        <Animated.View entering={getEnteringAnimation(5)}>
          {searchQuery.trim() && !hasMatchingPartSpecs(vm, searchQuery) ? (
            <View style={s.noMatchContainer} testID="specs-no-match">
              <Text style={s.noMatchText}>لا توجد نتائج مطابقة</Text>
            </View>
          ) : (
            <PartSpecsSection vm={vm} searchQuery={searchQuery} />
          )}
        </Animated.View>

        {/* 7. Location Card with embedded map */}
        <Animated.View entering={getEnteringAnimation(6)}>
          <LocationCard
            locationText={vm.location.fullLocationText}
            latitude={vm.location.latitude}
            longitude={vm.location.longitude}
          />
        </Animated.View>

        {/* 8. Safety Tips */}
        <Animated.View entering={getEnteringAnimation(7)}>
          <SafetyTips
            role={isOwner ? 'seller' : 'buyer'}
            title={isOwner ? SELLER_SAFETY_TIPS_TITLE : BUYER_SAFETY_TIPS_TITLE}
            tips={isOwner ? SELLER_SAFETY_TIPS : BUYER_SAFETY_TIPS}
          />
        </Animated.View>

        {/* 9. Support Button */}
        <Animated.View entering={getEnteringAnimation(8)}>
          <SupportButton onPress={handleSupportPress} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Fixed Bottom Actions Bar ────────────────────────────── */}
      {isOwner ? (
        <OwnerManageBar
          variant="sticky"
          viewCount={vm.viewCount}
          busyAction={ownerBusyAction}
          actions={PART_OWNER_ACTIONS}
          onAction={handleOwnerAction}
        />
      ) : contactAvailability.mode !== 'hidden' ? (
        <ContactActions
          variant="sticky"
          availability={contactAvailability}
          busyAction={contact.busyAction}
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
        category="parts"
      />

      {/* Floating Glassmorphic Top Bar (Overlay) */}
      <DetailTopBar
        onBack={goBackSafely}
        onShare={shareListing.share}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        placeholder="ابحث في تفاصيل القطعة..."
      />

      {/* Pinned Stale Data Banner directly below overlaid top bar */}
      {isRefetchError ? (
        <DetailStaleBanner
          onRetry={refetch}
          isRefetching={refreshing}
        />
      ) : null}
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
  noMatchContainer: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space3,
    padding: Spacing.space4,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  noMatchText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
})
