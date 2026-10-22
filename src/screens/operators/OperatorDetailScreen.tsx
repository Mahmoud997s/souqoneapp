import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { SUPPORT_MAILTO } from '../../constants/support'
import { useAuthStore } from '../../store/authStore'
import { dialogService } from '../../store/dialogStore'

// Hooks & Utilities
import { useOperatorDetail } from '../../hooks/listing-detail/useOperatorDetail'
import { useOperatorReviews } from '../../hooks/listing-detail/useOperatorReviews'
import { useOperatorOwnerActions } from '../../hooks/listing-detail/useOperatorOwnerActions'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { translateOperatorOwnerError } from '../../utils/listing-detail/operatorOwnerErrors'
import { assertOwnerHasPhoneForEdit } from '../../utils/assertOwnerHasPhoneForEdit'
import { useAppReducedMotion } from '../../utils/listing-detail/useAppReducedMotion'
import {
  OPERATOR_HIRER_SAFETY_TIPS_TITLE,
  OPERATOR_HIRER_SAFETY_TIPS,
  OPERATOR_OWNER_SAFETY_TIPS_TITLE,
  OPERATOR_OWNER_SAFETY_TIPS,
} from '../../constants/listing-detail/safetyTips'

// Shared Presentational Components
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
import { SafetyTips } from '../../components/listing-detail/SafetyTips'
import { SupportButton } from '../../components/listing-detail/SupportButton'
import { DetailStates } from '../../components/listing-detail/DetailStates'
import type { GalleryImage } from '../../types/carDetailViewModel.types'

// Shared Listing-Detail Components
import {
  GlassDetailNavBar,
  LocationCard,
} from '../../components/listing-detail'

// Operator-Specific Presentational Components
import {
  OperatorHeroHeader,
  OperatorRatesCard,
  OperatorCertificationsCard,
  OperatorReviewsCard,
  OperatorPendingDeletionBanner,
} from '../../components/operators/detail'

export interface OperatorDetailScreenProps {
  id: string
}

export function OperatorDetailScreen({ id }: OperatorDetailScreenProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore((s) => s.user)
  const reducedMotion = useAppReducedMotion()

  const { state, vm, raw, error, refetch } = useOperatorDetail(id)
  const isOwner = Boolean(user && vm && user.id === vm.seller.id)

  const ownerActions = useOperatorOwnerActions(isOwner ? vm : undefined)

  const favoriteToggle = useFavoriteToggle('OPERATOR_LISTING', id, false, {
    redirectPath: `/equipment/operators/${id}`,
  })

  const contact = useListingContact(
    'OPERATOR_LISTING',
    id,
    `/equipment/operators/${id}`,
    vm?.title
  )

  const reviewsQuery = useOperatorReviews(id)

  // Scroll tracking for Navbar & Floating Contact
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
  })

  // State
  const [activeCertificateImage, setActiveCertificateImage] = useState<string | null>(null)

  const availability: ContactAvailability = useMemo(() => {
    if (!vm) return { mode: 'hidden' }
    if (vm.whatsappEnabled) return { mode: 'full' }
    return { mode: 'noWhatsapp' }
  }, [vm])

  const handleOwnerAction = async (actionId: OwnerActionId) => {
    if (actionId === 'edit') {
      if (!assertOwnerHasPhoneForEdit()) return
      router.push(`/equipment/operators/edit/${id}`)
      return
    }

    const actionDef = ownerActions.actions.find((a) => a.id === actionId)
    if (actionDef?.requiresConfirm) {
      dialogService.confirm(
        actionDef.confirmTitle ?? 'تأكيد الإجراء',
        actionDef.confirmMessage ?? 'هل أنت متأكد من تنفيذ هذا الإجراء؟',
        async () => {
          try {
            await ownerActions.run(actionId)
          } catch (err) {
            const msg = translateOperatorOwnerError(err)
            dialogService.alert('خطأ', msg)
          }
        },
        actionDef.confirmLabel ?? 'تأكيد',
        'إلغاء'
      )
      return
    }

    try {
      await ownerActions.run(actionId)
    } catch (err) {
      const msg = translateOperatorOwnerError(err)
      dialogService.alert('خطأ', msg)
    }
  }

  const handleCancelPendingDeletion = () => {
    handleOwnerAction('restore')
  }

  const handleOpenReviewsList = () => {
    if (!vm) return
    router.push(`/reviews/${id}?type=OPERATOR_LISTING&revieweeId=${vm.seller.id}`)
  }

  const handleOpenWriteReview = () => {
    if (!vm) return
    if (!user) {
      router.push({
        pathname: '/login',
        params: { redirect: `/reviews/${id}?type=OPERATOR_LISTING&revieweeId=${vm.seller.id}&write=true` },
      })
      return
    }
    router.push(`/reviews/${id}?type=OPERATOR_LISTING&revieweeId=${vm.seller.id}&write=true`)
  }

  const handleOpenSupport = () => {
    Linking.openURL(SUPPORT_MAILTO).catch(() => {})
  }

  const handlePressSellerProfile = (sellerId: string) => {
    router.push(`/user/${sellerId}`)
  }

  // Loading, Not Found, Offline, Error states
  if (state === 'loading') {
    return <DetailStates kind="loading" onBack={() => router.back()} onRetry={() => refetch()} />
  }

  if (state === 'notFound') {
    return (
      <DetailStates
        kind="notFound"
        onBack={() => router.back()}
      />
    )
  }

  if (state === 'offline') {
    return <DetailStates kind="offline" onBack={() => router.back()} onRetry={() => refetch()} />
  }

  if (state === 'error' || !vm) {
    return <DetailStates kind="error" onBack={() => router.back()} onRetry={() => refetch()} />
  }

  const certificateImagesList: GalleryImage[] = activeCertificateImage
    ? [
        {
          id: 'cert-doc-view',
          url: activeCertificateImage,
          order: 0,
          isPrimary: true,
        },
      ]
    : []

  return (
    <View style={s.container} testID="operator-detail-screen">
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} translucent />

      {/* Navigation Bar */}
      <GlassDetailNavBar
        onBack={() => router.back()}
        isFavorite={favoriteToggle.isFavorite}
        favoriteBusy={favoriteToggle.isBusy}
        canFavorite={!isOwner}
        onToggleFavorite={favoriteToggle.toggle}
        scrollY={scrollY}
        paddingTop={insets.top}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: insets.top + Spacing.space6,
            paddingBottom: insets.bottom + 90,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pending Deletion Banner (Owner only) */}
        {isOwner && vm.pendingDeletion && (
          <OperatorPendingDeletionBanner
            pendingDeletion={vm.pendingDeletion}
            onCancel={handleCancelPendingDeletion}
            busy={ownerActions.busy}
          />
        )}

        {/* Hero Header */}
        <OperatorHeroHeader vm={vm} />

        {/* Owner Management Bar OR Contact Actions */}
        {isOwner ? (
          <OwnerManageBar
            actions={ownerActions.actions}
            onAction={handleOwnerAction}
            busy={ownerActions.busy}
            viewCount={ownerActions.viewCount}
          />
        ) : (
          <ContactActions
            variant="inline"
            availability={availability}
            busy={contact.busy}
            onCall={contact.call}
            onWhatsApp={contact.whatsApp}
            onChat={contact.chat}
          />
        )}

        {/* Seller Card */}
        <SellerCard
          seller={vm.seller}
          onPressProfile={handlePressSellerProfile}
        />

        {/* Listing Description / Bio */}
        {Boolean(vm.description) && (
          <ListingDescription text={vm.description} />
        )}

        {/* Rates Breakdown */}
        <OperatorRatesCard rates={vm.rates} />

        {/* Certifications and Equipment Types */}
        <OperatorCertificationsCard
          equipmentTypes={vm.equipmentTypes}
          certifications={vm.certifications}
          specializations={vm.specializations}
          onPressCertificate={(img) => setActiveCertificateImage(img)}
        />

        {/* Location Card */}
        <LocationCard
          locationText={vm.location.fullLocationText}
          latitude={vm.location.latitude}
          longitude={vm.location.longitude}
        />

        {/* Reviews Card */}
        <OperatorReviewsCard
          averageRating={reviewsQuery.summary.averageRating}
          totalReviews={reviewsQuery.summary.reviewCount}
          isLoading={reviewsQuery.isLoading}
          isError={reviewsQuery.isError}
          canWrite={!isOwner}
          onPressViewAll={handleOpenReviewsList}
          onPressWrite={handleOpenWriteReview}
          onRetry={reviewsQuery.refetch}
        />

        {/* Safety Tips */}
        <SafetyTips
          role={isOwner ? 'seller' : 'buyer'}
          title={isOwner ? OPERATOR_OWNER_SAFETY_TIPS_TITLE : OPERATOR_HIRER_SAFETY_TIPS_TITLE}
          tips={isOwner ? OPERATOR_OWNER_SAFETY_TIPS : OPERATOR_HIRER_SAFETY_TIPS}
        />

        {/* Support Button */}
        <SupportButton onPress={handleOpenSupport} />
      </Animated.ScrollView>

      {/* Sticky Bottom Floating Contact Actions (Visitors only) */}
      {!isOwner && (
        <ContactActions
          variant="sticky"
          availability={availability}
          busy={contact.busy}
          onCall={contact.call}
          onWhatsApp={contact.whatsApp}
          onChat={contact.chat}
          scrollY={scrollY}
          threshold={320}
        />
      )}

      {/* Certificate Document Image Viewer Modal */}
      <ImageViewerModal
        visible={Boolean(activeCertificateImage)}
        images={certificateImagesList}
        initialIndex={0}
        onClose={() => setActiveCertificateImage(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
  },
  scrollContent: {
    paddingBottom: Spacing.space6,
  },
})
