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

// Hooks
import { useCarDetail } from '../../hooks/listing-detail/useCarDetail'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useShareListing } from '../../hooks/listing-detail/useShareListing'

// Presentational Components
import { DetailNavBar } from '../../components/listing-detail/DetailNavBar'
import { ImageGallery } from '../../components/listing-detail/ImageGallery'
import { ImageViewerModal } from '../../components/listing-detail/ImageViewerModal'
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
  const { state, vm, raw, error, refetch } = useCarDetail(id)

  // 2. Viewer & Ownership
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  // 3. Foundation Hooks (called unconditionally at top level)
  const currentVm = vm ?? DUMMY_VM
  const favoriteToggle = useFavoriteToggle('LISTING', id, false)
  const shareListing = useShareListing(currentVm, { shareTitle: vm?.title ?? 'إعلان سيارة' })

  // 4. UI Local State
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [isViewerOpen, setIsViewerOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // 5. Scroll Tracker for glassmorphism
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
        contentContainerStyle={s.scrollContent}
      >
        {/* Gallery */}
        <ImageGallery
          images={vm.images}
          index={galleryIndex}
          onIndexChange={setGalleryIndex}
          onPressImage={(idx) => {
            setGalleryIndex(idx)
            setIsViewerOpen(true)
          }}
        />
      </Animated.ScrollView>

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
    paddingBottom: 40,
  },
})
