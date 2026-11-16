import React from 'react'
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { lineHeightFor } from '../../constants/typography'
import { OPERATOR_ROLES } from '../../constants/operators'
import { CardSystem, getHomeStandardCardWidth } from '../../constants/cardSystem'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { useFavoriteToggle } from '../../hooks/listing-detail/useFavoriteToggle'
import { getOperatorTypeLabel, getEquipmentTypeLabel } from '../../utils/equipment-mappers'
import { formatLocation } from '../../utils/mappers'
import { OperatorCardHeader } from './operator/OperatorCardHeader'
import { OperatorCardChips } from './operator/OperatorCardChips'
import { OperatorCardActions } from './operator/OperatorCardActions'
import { buildOperatorChips } from './operator/buildOperatorChips'
import { areCardPropsEqual } from '../../utils/cardMemoComparison'

export interface OperatorCardProps {
  item: any
  onPress?: () => void
  maxChips?: number
  actionMenu?: React.ReactNode
  ownerActions?: React.ReactNode
  fullWidth?: boolean
}

function getWatermarkIconName(operatorType?: string | null): React.ComponentProps<typeof Ionicons>['name'] {
  const matched = OPERATOR_ROLES.find((role) => role.id === operatorType)
  return (matched?.icon as React.ComponentProps<typeof Ionicons>['name']) ?? 'construct-outline'
}

/**
 * OperatorCard
 * Unified operator card component serving all contexts (browse, landing, search, my-listings).
 * Strict token-only styling (zero raw hex/rgba) with lightweight list performance (no GlassSurface/Svg).
 */
function OperatorCardComponent({
  item,
  onPress,
  maxChips = 3,
  actionMenu,
  ownerActions,
  fullWidth = true,
}: OperatorCardProps) {
  if (!item) return null

  const raw = item.raw || item
  const user = item.user || raw.user
  const operatorId = String(item.id || raw?.id || '')

  const name =
    user?.displayName ||
    user?.username ||
    item.title ||
    raw.title ||
    'مشغل في سوق ون'

  const userAvatar = item.avatar || item.profileImageUrl || raw?.profileImageUrl || user?.avatarUrl || raw?.user?.avatarUrl || item.avatarUrl
  const images: string[] = Array.isArray(item.images)
    ? item.images
    : Array.isArray(raw?.images)
    ? raw.images
    : []
  const isVerified = Boolean(item.isVerified ?? raw?.isVerified ?? user?.isVerified ?? false)
  const isOnline = Boolean((raw?.isOnline ?? item.isOnline ?? user?.isOnline) === true)

  const locationDisplay = item.governorate || formatLocation(raw) || 'سلطنة عمان'

  const operatorType = raw?.operatorType || item.operatorType
  const operatorTypeLabel = operatorType ? getOperatorTypeLabel(operatorType) : null

  const experienceYearsNum = Number(raw?.experienceYears ?? item.experienceYears ?? 0)
  const experienceText =
    experienceYearsNum > 0
      ? `${experienceYearsNum} سنوات خبرة`
      : null

  const rawEquip: string[] = raw?.equipmentTypes || item.equipmentTypes || []
  const equipmentTags = rawEquip.length > 0
    ? rawEquip.map((t) => getEquipmentTypeLabel(t))
    : []

  const certificationsList: unknown[] = Array.isArray(raw?.certifications)
    ? raw.certifications
    : Array.isArray(item.certifications)
    ? item.certifications
    : []
  const certsCount = certificationsList.length
  const hasCertifications = certsCount > 0

  const averageRating = Number(raw?.averageRating ?? item.averageRating ?? 0)
  const reviewCount = Number(raw?.reviewCount ?? item.reviewCount ?? 0)

  // Assemble chip badges using strict total budget
  const { chips: visibleChips, extraCount } = buildOperatorChips({
    operatorTypeLabel,
    experienceText,
    hasCertifications,
    equipmentTags,
    maxChips,
  })

  // Price formatting: daily rate as primary, hourly rate as secondary, fallback to "السعر عند التواصل"
  const dailyRate = Number(raw?.dailyRate ?? item.dailyRate ?? item.price ?? 0)
  const hourlyRate = Number(raw?.hourlyRate ?? item.hourlyRate ?? 0)
  const currencySymbol = (item.currency || raw?.currency) === 'USD' ? '$' : 'ر.ع.'

  let displayPrice = 'السعر عند التواصل'
  if (dailyRate > 0) {
    displayPrice = `${dailyRate} ${currencySymbol} / يوم`
  } else if (hourlyRate > 0) {
    displayPrice = `${hourlyRate} ${currencySymbol} / ساعة`
  } else if (item.priceText || raw?.priceText) {
    displayPrice = item.priceText || raw.priceText
  }

  // Contact & Favorite actions (public mode only)
  const isOwnerMode = Boolean(actionMenu || ownerActions)
  const contact = useListingContact(
    'OPERATOR_LISTING',
    operatorId,
    `/equipment/operators/${operatorId}`,
    name
  )

  const fav = useFavoriteToggle('OPERATOR_LISTING', operatorId, Boolean(item.isFavorite ?? raw?.isFavorite), {
    redirectPath: `/equipment/operators/${operatorId}`,
    title: name,
  })

  const handleCall = (e: any) => {
    e.stopPropagation?.()
    contact.call()
  }

  const handleWhatsApp = (e: any) => {
    e.stopPropagation?.()
    contact.whatsApp()
  }

  const handleChat = (e: any) => {
    e.stopPropagation?.()
    contact.chat()
  }

  const handleToggleFavorite = (e: any) => {
    e.stopPropagation?.()
    fav.toggle()
  }

  const isWhatsappEnabled = Boolean(
    item.whatsappEnabled || raw?.whatsappEnabled || raw?.whatsapp || item.whatsapp
  )

  const showStatsRow = certsCount > 0 || experienceYearsNum > 0 || averageRating > 0

  return (
    <TouchableOpacity
      style={[
        s.card,
        fullWidth ? s.cardFull : s.cardFixed,
      ]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${name}، ${locationDisplay}، ${displayPrice}`}
      testID="operator-card"
    >
      <View style={s.watermarkWrap} pointerEvents="none">
        <Ionicons
          testID="operator-watermark-icon"
          name={getWatermarkIconName(operatorType)}
          size={72}
          color={Colors.primaryDark}
          style={s.watermarkIcon}
        />
      </View>

      <OperatorCardHeader
        name={name}
        avatarUrl={userAvatar}
        images={images}
        isVerified={isVerified}
        isOnline={isOnline}
        operatorTypeLabel={operatorTypeLabel}
        locationDisplay={locationDisplay}
        isOwnerMode={isOwnerMode}
        displayPrice={displayPrice}
        actionMenu={actionMenu}
        isFavorite={fav.isFavorite}
        onToggleFavorite={isOwnerMode ? undefined : handleToggleFavorite}
      />

      {showStatsRow && (
        <View style={s.statsRow} testID="operator-stats-row">
          {certsCount > 0 && (
            <View style={s.statItem} testID="operator-stat-certs">
              <Ionicons name="ribbon-outline" size={12} color={Colors.primary} />
              <Text style={s.statText}>{certsCount} شهادة</Text>
            </View>
          )}
          {experienceYearsNum > 0 && (
            <View style={s.statItem} testID="operator-stat-exp">
              <Ionicons name="briefcase-outline" size={12} color={Colors.primary} />
              <Text style={s.statText}>{experienceYearsNum} سنوات</Text>
            </View>
          )}
          {averageRating > 0 && (
            <View style={s.statItem} testID="operator-stat-rating">
              <Ionicons name="star" size={12} color={Colors.warning} />
              <Text style={s.statText}>
                {averageRating.toFixed(1)}
                {reviewCount > 0 ? ` (${reviewCount})` : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      <OperatorCardChips
        chips={visibleChips}
        extraCount={extraCount}
      />

      {!isOwnerMode && (
        <OperatorCardActions
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          onChat={handleChat}
          isWhatsappEnabled={isWhatsappEnabled}
        />
      )}

      {ownerActions && (
        <View testID="operator-card-owner-actions" style={s.ownerActionsWrap}>
          {ownerActions}
        </View>
      )}
    </TouchableOpacity>
  )
}

export const OperatorCard = React.memo(OperatorCardComponent, areCardPropsEqual)

const s = StyleSheet.create({
  card: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    padding: CardSystem.padding.dense,
    ...CardSystem.styles.border,
    marginBottom: Spacing.space3,
  },
  cardFull: {
    width: '100%',
  },
  cardFixed: {
    width: getHomeStandardCardWidth(Dimensions.get('window').width),
    alignSelf: 'flex-start',
  },
  watermarkWrap: {
    position: 'absolute',
    bottom: 6,
    end: 8,
  },
  watermarkIcon: {
    opacity: 0.05,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.space3,
    marginTop: Spacing.space2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.space2,
    paddingVertical: 2,
  },
  statText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: lineHeightFor(11),
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  ownerActionsWrap: {
    marginTop: Spacing.space2,
  },
})
