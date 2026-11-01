import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Linking,
  Share,
  RefreshControl,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  FadeInDown,
} from 'react-native-reanimated'
import { useRouter, router as globalRouter } from 'expo-router'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { lineHeightFor } from '../../constants/typography'
import { SUPPORT_MAILTO } from '../../constants/support'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'
import { servicesApi } from '../../api/services'
import { useServiceWizardStore } from '../../store/serviceWizardStore'
import { assertOwnerHasPhoneForEdit } from '../../utils/assertOwnerHasPhoneForEdit'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'

// Hooks
import { useServiceDetail } from './hooks/useServiceDetail'
import { useDetailRefresh } from '../../hooks/listing-detail/useDetailRefresh'
import { invalidateServiceListingQueries } from './hooks/serviceQueryKeys'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { buildShareMessage } from '../../hooks/listing-detail/useShareListing'

// Presentational Components
import {
  DetailTopBar,
  LocationCard,
  StaleDataBanner,
} from '../../components/listing-detail'
import { getDetailErrorKind } from '../../utils/listing-detail/getDetailErrorKind'
import { ImageGallery } from '../../components/listing-detail/ImageGallery'
import { ImageViewerModal } from '../../components/listing-detail/ImageViewerModal'
import { ListingDescription } from '../../components/listing-detail/ListingDescription'
import { SellerCard } from '../../components/listing-detail/SellerCard'
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import { DetailStates } from '../../components/listing-detail/DetailStates'
import {
  ContactActions,
  type ContactAvailability,
} from '../../components/listing-detail/ContactActions'
import {
  OwnerManageBar,
  type OwnerAction,
  type OwnerActionId,
} from '../../components/listing-detail/OwnerManageBar'

// Service-Specific Presentational Components & Constants
import {
  ServicePriceHeader,
  ServiceSpecializations,
  ServiceScheduleCard,
  ServiceWebsiteCard,
} from './components'
import {
  SERVICE_CUSTOMER_SAFETY_TIPS_TITLE,
  SERVICE_CUSTOMER_SAFETY_TIPS,
  SERVICE_PROVIDER_SAFETY_TIPS_TITLE,
  SERVICE_PROVIDER_SAFETY_TIPS,
} from './constants/serviceSafetyTips'
import type { SellerView, GalleryImage } from '../../types/listingDetail.types'

export interface ServiceDetailScreenProps {
  id: string
}

const OWNER_ACTIONS: OwnerAction[] = [
  {
    id: 'edit',
    label: 'تعديل',
    tone: 'primary',
    icon: 'create-outline',
    requiresConfirm: false,
  },
  {
    id: 'delete',
    label: 'حذف',
    tone: 'danger',
    icon: 'trash-outline',
    requiresConfirm: true,
    confirmTitle: 'حذف الإعلان',
    confirmMessage: 'هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.',
    confirmLabel: 'نعم، احذف',
  },
]

/**
 * ServiceDetailScreen
 * Modern car service detail screen adhering to the shared listing-detail architecture.
 * Provides full parity with Cars, Buses, and Equipment screens.
 */
export function ServiceDetailScreen({ id }: ServiceDetailScreenProps) {
  const router = typeof useRouter === 'function' ? useRouter() : globalRouter
  let queryClient: QueryClient | null = null
  try {
    queryClient = useQueryClient()
  } catch {
    queryClient = null
  }
  const { user } = useAuthStore()

  // 1. Data Query
  const { state, vm, raw, refetch, isRefetchError, error } = useServiceDetail(id)
  const { refreshing, onRefresh } = useDetailRefresh(refetch)

  // 2. Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [isOwnerBusy, setIsOwnerBusy] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Filter specializations by in-page search query
  const filteredSpecializations = useMemo(() => {
    if (!vm?.specializations) return []
    const q = searchQuery.trim().toLowerCase()
    if (!q) return vm.specializations
    return vm.specializations.filter((spec) =>
      spec.toLowerCase().includes(q)
    )
  }, [vm?.specializations, searchQuery])

  // 4. Shared Foundation Hooks
  const favoriteToggle = useFavoriteToggle('CAR_SERVICE', id, false, {
    redirectPath: `/services/${id}`,
    title: vm?.title,
  })
  const contact = useListingContact(
    'CAR_SERVICE',
    id,
    `/services/${id}`,
    vm?.title,
  )

  const handleShare = async () => {
    try {
      const message = buildShareMessage(vm?.title ?? 'إعلان خدمة سيارات', id)
      await Share.share({ message })
    } catch {
      // Non-fatal
    }
  }

  // 5. Scroll Tracker & Animations
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  const shouldReduceMotion = useAppReducedMotion()

  const heroParallaxStyle = useAnimatedStyle(() => {
    if (shouldReduceMotion) return {}
    return {
      transform: [
        {
          translateY: scrollY.value > 0 ? scrollY.value * 0.18 : 0,
        },
      ],
    }
  })

  const getEnteringAnimation = (index: number) => {
    if (shouldReduceMotion) return undefined
    return FadeInDown.delay(index * 45).duration(280)
  }

  // Gallery images adapter
  const galleryImages = useMemo<GalleryImage[]>(
    () =>
      (vm?.images ?? []).map((imgUrl, idx) => ({
        id: `${vm?.id ?? 'img'}-${idx}`,
        url: imgUrl,
        order: idx,
        isPrimary: idx === 0,
      })),
    [vm?.id, vm?.images],
  )

  // 6. Navigation Helpers
  const goBackSafely = () => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) {
      router.back()
    } else if (typeof router.back === 'function') {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleSearchSubmit = (text: string) => {
    router.push({
      pathname: '/services/browse' as any,
      params: { q: text },
    })
  }

  const handleSupportPress = () => {
    Linking.openURL(SUPPORT_MAILTO).catch(() => {
      dialogService.alert('تنبيه', 'تعذر فتح تطبيق البريد الإلكتروني', 'error')
    })
  }

  const handleSellerProfilePress = (sellerId: string) => {
    router.push(`/profile/${sellerId}`)
  }

  // 7. Owner Actions Handler
  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      const hasPhone = Boolean(
        user?.phone?.trim() ||
          (raw as { contactPhone?: string })?.contactPhone ||
          (raw as { seller?: { phone?: string } })?.seller?.phone,
      )
      if (!hasPhone) {
        if (!assertOwnerHasPhoneForEdit()) {
          return
        }
      }

      if (raw) {
        useServiceWizardStore.getState().setEditMode(raw.id, {
          title: raw.title ?? '',
          description: raw.description ?? '',
          serviceType: raw.serviceType ?? null,
          providerType: raw.providerType ?? null,
          providerName: raw.providerName ?? '',
          specializations: raw.specializations ?? [],
          isHomeService: Boolean(raw.isHomeService),
          workingHoursOpen: raw.workingHoursOpen ?? null,
          workingHoursClose: raw.workingHoursClose ?? null,
          workingDays: raw.workingDays ?? [],
          priceFrom:
            raw.priceFrom != null
              ? Number(raw.priceFrom)
              : raw.price != null
              ? Number(raw.price)
              : null,
          priceTo: raw.priceTo != null ? Number(raw.priceTo) : null,
          currency: raw.currency ?? 'OMR',
          whatsappEnabled: Boolean(raw.whatsappEnabled),
          website: raw.website ?? '',
          governorateId: raw.governorateId ? Number(raw.governorateId) : null,
          wilayaId: raw.wilayaId ? Number(raw.wilayaId) : null,
          governorateNameAr:
            raw.governorateRef?.nameAr ?? raw.governorate ?? '',
          wilayaNameAr: raw.wilayaRef?.nameAr ?? raw.city ?? '',
          address: raw.address ?? '',
          latitude: raw.latitude ?? null,
          longitude: raw.longitude ?? null,
          existingImages: (raw.images ?? []).map((img) => ({
            id: typeof img === 'string' ? img : img.id || img.url,
            url: typeof img === 'string' ? img : img.url || '',
          })),
        })
      }
      router.push('/services/new')
      return
    }

    if (actionId === 'delete') {
      dialogService.confirm(
        'حذف الإعلان',
        'هل أنت متأكد من حذف هذا الإعلان؟ لا يمكن التراجع عن هذا الإجراء.',
        async () => {
          try {
            setIsOwnerBusy(true)
            await servicesApi.remove(id)
            if (queryClient) {
              await invalidateServiceListingQueries(queryClient, id, {
                removeDetail: true,
              })
            }
            dialogService.alert('تم', 'تم حذف إعلان الخدمة بنجاح', 'success')
            goBackSafely()
          } catch (err: unknown) {
            const kind = getDetailErrorKind(err)
            let errorMsg = 'فشل حذف الإعلان'
            if (kind === 'offline') {
              errorMsg = 'تعذر الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.'
            } else if (kind === 'timeout') {
              errorMsg = 'انتهت مهلة الاتصال بالخادم. يرجى إعادة المحاولة.'
            } else if (err instanceof Error && err.message) {
              errorMsg = err.message
            }
            dialogService.alert('خطأ', errorMsg, 'error')
          } finally {
            setIsOwnerBusy(false)
          }
        },
        'نعم، احذف',
        'تراجع',
        true,
      )
    }
  }

  // 8. Contact Availability
  const getContactAvailability = (): ContactAvailability => {
    if (
      !vm ||
      isOwner ||
      vm.status === 'ARCHIVED' ||
      vm.status === 'SUSPENDED'
    ) {
      return { mode: 'hidden' }
    }
    if (!vm.whatsappEnabled) {
      return { mode: 'noWhatsapp' }
    }
    return { mode: 'full' }
  }

  const contactAvailability = getContactAvailability()

  // 9. Non-Ready States
  if (state !== 'ready' || !vm) {
    const errorKind = getDetailErrorKind(error)
    const kind =
      state === 'loading'
        ? 'loading'
        : state === 'notFound' || errorKind === 'notFound'
        ? 'notFound'
        : errorKind === 'unknown'
        ? 'error'
        : errorKind

    return (
      <View style={s.rootContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Colors.white}
          translucent
        />
        <DetailStates
          kind={kind}
          onRetry={refetch}
          onBack={goBackSafely}
        />
      </View>
    )
  }

  const sellerCardData: SellerView = {
    id: vm.seller.id,
    name: vm.seller.name,
    username: vm.seller.username,
    avatarUrl: vm.seller.avatarUrl,
    isVerified: vm.seller.isVerified,
    memberSinceLabel: vm.seller.memberSinceLabel ?? '',
  }

  const hasBottomBar = isOwner || contactAvailability.mode !== 'hidden'
  const locationText = vm.location.address
    ? `${vm.location.fullLocationText} - ${vm.location.address}`
    : vm.location.fullLocationText

  return (
    <View style={s.rootContainer} testID="service-detail-screen">
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.white}
        translucent
      />

      {/* Fixed Glassmorphic Top Bar */}
      <DetailTopBar
        onBack={goBackSafely}
        onShare={handleShare}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        placeholder="ابحث في تفاصيل الخدمة..."
      />

      {/* Pinned Stale Data Banner directly below top bar */}
      {isRefetchError && (
        <StaleDataBanner
          onRetry={refetch}
          isRefetching={refreshing}
        />
      )}

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
          />
        }
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: hasBottomBar ? 90 : 40 },
        ]}
        testID="service-detail-scroll-view"
      >
        {/* 1. Image Gallery */}
        <Animated.View style={heroParallaxStyle}>
          <ImageGallery
            images={galleryImages}
            index={galleryIndex}
            onIndexChange={setGalleryIndex}
            onPressImage={(idx: number) => {
              setGalleryIndex(idx)
              setIsViewerOpen(true)
            }}
            category="services"
            compactEmptyState={true}
          />
        </Animated.View>

        {/* 2. Specialized Price Header */}
        <Animated.View entering={getEnteringAnimation(1)}>
          <ServicePriceHeader
            title={vm.title}
            price={vm.price}
            serviceTypeLabel={vm.serviceTypeLabel}
            providerTypeLabel={vm.providerTypeLabel}
            providerName={vm.providerName}
            isHomeService={vm.isHomeService}
            postedAtLabel={vm.postedAtLabel}
            viewCount={vm.viewCount}
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

        {/* 4. Seller Card (Section 4 - below contact actions, above specializations) */}
        {!isOwner ? (
          <Animated.View entering={getEnteringAnimation(3)}>
            <SellerCard
              seller={sellerCardData}
              onPressProfile={handleSellerProfilePress}
            />
          </Animated.View>
        ) : null}

        {/* 5. Specializations & Tags */}
        {(vm.specializations.length > 0 || searchQuery.trim().length > 0) && (
          <Animated.View entering={getEnteringAnimation(4)}>
            {searchQuery.trim() && filteredSpecializations.length === 0 ? (
              <View style={s.noMatchContainer} testID="specs-no-match">
                <Text style={s.noMatchText}>لا توجد نتائج مطابقة</Text>
              </View>
            ) : (
              <ServiceSpecializations specializations={filteredSpecializations} />
            )}
          </Animated.View>
        )}

        {/* 6. Schedule & Working Days Card */}
        {(vm.workingSchedule.hasSchedule || vm.isHomeService) && (
          <Animated.View entering={getEnteringAnimation(5)}>
            <ServiceScheduleCard
              schedule={vm.workingSchedule}
              isHomeService={vm.isHomeService}
            />
          </Animated.View>
        )}

        {/* 7. Description */}
        {Boolean(vm.description) && (
          <Animated.View entering={getEnteringAnimation(6)}>
            <ListingDescription text={vm.description} collapsedLines={5} />
          </Animated.View>
        )}

        {/* 8. Location Card with embedded map if coordinates exist */}
        <Animated.View entering={getEnteringAnimation(7)}>
          <LocationCard
            locationText={locationText}
            latitude={vm.location.latitude}
            longitude={vm.location.longitude}
          />
        </Animated.View>

        {/* 9. Website Card */}
        {Boolean(vm.website) && (
          <Animated.View entering={getEnteringAnimation(8)}>
            <ServiceWebsiteCard website={vm.website} />
          </Animated.View>
        )}

        {/* 10. Safety Tips */}
        <Animated.View entering={getEnteringAnimation(9)}>
          <SafetyTips
            role={isOwner ? 'seller' : 'buyer'}
            title={
              isOwner
                ? SERVICE_PROVIDER_SAFETY_TIPS_TITLE
                : SERVICE_CUSTOMER_SAFETY_TIPS_TITLE
            }
            tips={
              isOwner
                ? SERVICE_PROVIDER_SAFETY_TIPS
                : SERVICE_CUSTOMER_SAFETY_TIPS
            }
          />
        </Animated.View>

        {/* 11. Support Button */}
        <Animated.View entering={getEnteringAnimation(10)}>
          <SupportButton onPress={handleSupportPress} />
        </Animated.View>
      </Animated.ScrollView>

      {/* ── Fixed Bottom Actions Bar ────────────────────────────── */}
      {isOwner ? (
        <OwnerManageBar
          variant="sticky"
          viewCount={vm.viewCount}
          busy={isOwnerBusy}
          actions={OWNER_ACTIONS}
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
        images={galleryImages}
        initialIndex={galleryIndex}
        onClose={() => setIsViewerOpen(false)}
        category="services"
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
