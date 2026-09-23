import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
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
import { useAuthStore } from '../../store/authStore'
import { useCarWizardStore } from '../../store/carWizardStore'
import { dialogService } from '../../store/dialogStore'

// Hooks & Utilities
import { useCarDetail } from '../../hooks/listing-detail/useCarDetail'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useShareListing } from '../../hooks/listing-detail/useShareListing'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import {
  useOwnerActions,
  isOptimisticLockError,
} from '../../hooks/listing-detail/useOwnerActions'
import {
  useSimilarListings,
  type SimilarCarItem,
} from '../../hooks/listing-detail/useSimilarListings'
import { carListingToFormData } from '../../utils/listing-detail/carListingToFormData'
import { formatNumberWestern, parseDecimal } from '../../utils/listing-detail/formatters'
import {
  BUYER_SAFETY_TIPS_TITLE,
  BUYER_SAFETY_TIPS,
  SELLER_SAFETY_TIPS_TITLE,
  SELLER_SAFETY_TIPS,
} from '../../constants/listing-detail/safetyTips'

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

import type { CarDetailViewModel } from '../../types/carDetailViewModel.types'

const DUMMY_VM: CarDetailViewModel = {
  id: '',
  version: 1,
  status: 'ACTIVE',
  title: '',
  description: '',
  listingType: 'SALE',
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
  make: '',
  model: '',
  keySpecs: [],
  specsSections: [],
  features: [],
}

export interface CarDetailScreenProps {
  id: string
}

/**
 * CarDetailScreen
 * Real-data container screen for vehicle details.
 * Connects useCarDetail and foundation hooks to listing-detail presentational components.
 */
export function CarDetailScreen({ id }: CarDetailScreenProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuthStore()

  // 1. Data Query
  const { state, vm, raw, refetch } = useCarDetail(id)

  // 2. Viewer & Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. Foundation Hooks (called unconditionally at top level)
  const currentVm = vm ?? DUMMY_VM
  const favoriteToggle = useFavoriteToggle('LISTING', id, false, { redirectPath: `/cars/${id}` })
  const shareListing = useShareListing(currentVm, { shareTitle: vm?.title ?? 'إعلان سيارة' })
  const contact = useListingContact('LISTING', id, `/cars/${id}`, vm?.title)
  const ownerActions = useOwnerActions(currentVm)
  const similarListings = useSimilarListings(id)

  // 4. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [similarPage, setSimilarPage] = useState<number>(1)

  // 5. Scroll Tracker for glassmorphism and sticky bars
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // Handlers
  const handleSearchSubmit = (text: string) => {
    router.push({
      pathname: '/(tabs)/cars' as any,
      params: { search: text },
    })
  }

  const handleProfilePress = (sellerId: string) => {
    router.push(`/user/${sellerId}` as any)
  }

  const handleSupportPress = () => {
    router.push('/(support)' as any)
  }

  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      if (raw) {
        const formData = carListingToFormData(raw)
        useCarWizardStore.getState().setEditMode(raw.id, formData)
        router.push('/cars/new' as any)
      }
      return
    }

    const action = ownerActions.actions.find((a) => a.id === actionId)
    if (!action) return

    const execute = async () => {
      try {
        await ownerActions.run(actionId)
        if (actionId === 'delete') {
          router.back()
        }
      } catch (err: unknown) {
        if (isOptimisticLockError(err)) {
          dialogService.alert(
            'تعارض في البيانات',
            'تم تعديل الإعلان من جهاز آخر. يرجى التحديث والمحاولة مجدداً.'
          )
        } else {
          dialogService.alert('خطأ', 'تعذر إتمام الإجراء المطلوب. يرجى المحاولة لاحقاً.')
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

  // Non-ready states render DetailStates directly
  if (state !== 'ready' || !vm) {
    return (
      <View style={s.rootContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <DetailStates
          kind={state === 'ready' ? 'loading' : state}
          onRetry={refetch}
          onBack={() => router.back()}
        />
      </View>
    )
  }

  return (
    <View style={s.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Glassmorphic Navigation Bar */}
      <DetailNavBar
        onBack={() => router.back()}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        onShare={shareListing.share}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        scrollY={scrollY}
        placeholder="ابحث في تفاصيل السيارة..."
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
          kindLabel={
            vm.listingType === 'SALE'
              ? 'للبيع'
              : vm.listingType === 'RENTAL'
              ? 'للإيجار'
              : 'مطلوب للشراء'
          }
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

        {/* 7. Specs Sections */}
        <SpecsSections sections={vm.specsSections} />

        {/* 8. Similar Listings Grid (paginated vertical grid, RTL-safe) */}
        <SimilarListingsGrid<SimilarCarItem>
          items={similarListings.items}
          isLoading={similarListings.isLoading}
          isError={similarListings.isError}
          onRetry={similarListings.refetch}
          page={similarPage}
          pageCount={1}
          onPageChange={setSimilarPage}
          renderItem={(car) => (
            <TouchableOpacity
              key={car.id}
              style={s.similarCard}
              onPress={() => router.push(`/cars/${car.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={s.similarCardImagePlaceholder}>
                {car.images?.[0]?.url ? (
                  <Image
                    source={{ uri: car.images[0].url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons
                    name="car-sport"
                    size={28}
                    color={Colors.primaryLight}
                  />
                )}
              </View>
              <Text style={s.similarCardTitle} numberOfLines={2}>
                {car.title}
              </Text>
              <Text style={s.similarCardPrice}>
                {parseDecimal(car.price) !== undefined
                  ? `${formatNumberWestern(parseDecimal(car.price))} ${car.currency ?? 'ر.ع'}`
                  : ''}
              </Text>
              <Text style={s.similarCardMeta}>
                {car.governorate ?? car.city ?? ''}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* 9. Safety Tips */}
        <SafetyTips
          role={isOwner ? 'seller' : 'buyer'}
          title={isOwner ? SELLER_SAFETY_TIPS_TITLE : BUYER_SAFETY_TIPS_TITLE}
          tips={isOwner ? SELLER_SAFETY_TIPS : BUYER_SAFETY_TIPS}
        />

        {/* 10. Support Button */}
        <SupportButton onPress={handleSupportPress} />
      </Animated.ScrollView>

      {/* Sticky Contact Actions Bar (when buyer & contact available, scroll-aware) */}
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

      {/* Sticky Owner Manage Bar (when owner, scroll-aware) */}
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
