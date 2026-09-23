import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  StatusBar,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
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
import { carListingToFormData } from '../../utils/listing-detail/carListingToFormData'

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
  const favoriteToggle = useFavoriteToggle('LISTING', id, false)
  const shareListing = useShareListing(currentVm, { shareTitle: vm?.title ?? 'إعلان سيارة' })
  const contact = useListingContact('LISTING', id, `/cars/${id}`, vm?.title)
  const ownerActions = useOwnerActions(currentVm)

  // 4. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

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
})
