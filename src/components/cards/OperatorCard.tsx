import React from 'react'
import {
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { CardSystem } from '../../constants/cardSystem'
import { useListingContact } from '../../hooks/listing-detail/useListingContact'
import { getOperatorTypeLabel, getEquipmentTypeLabel } from '../../utils/equipment-mappers'
import { formatLocation } from '../../utils/mappers'
import { OperatorCardHeader } from './operator/OperatorCardHeader'
import { OperatorCardChips } from './operator/OperatorCardChips'
import { OperatorCardActions } from './operator/OperatorCardActions'

const CARD_FIXED_WIDTH = Dimensions.get('window').width * 0.65

export interface OperatorCardProps {
  item: any
  onPress?: () => void
  fullWidth?: boolean
  maxChips?: number
  actionMenu?: React.ReactNode
}

/**
 * OperatorCard
 * Unified operator card component serving all contexts (browse, landing, search, my-listings).
 * Designed following the Impeccable method with strict token-only styling (zero raw hex).
 */
export function OperatorCard({
  item,
  onPress,
  fullWidth = false,
  maxChips = 3,
  actionMenu,
}: OperatorCardProps) {
  if (!item) return null

  const raw = item.raw || item
  const user = item.user || raw.user

  const name =
    user?.displayName ||
    user?.username ||
    item.title ||
    raw.title ||
    'مشغل في سوق ون'

  const userAvatar = item.avatar || user?.avatarUrl || raw?.user?.avatarUrl || item.avatarUrl
  const isVerified = Boolean(item.isVerified ?? raw?.isVerified ?? user?.isVerified ?? false)

  const locationDisplay = item.governorate || formatLocation(raw) || 'سلطنة عمان'

  const operatorType = raw?.operatorType || item.operatorType
  const operatorTypeLabel = operatorType ? getOperatorTypeLabel(operatorType) : null

  const experienceYears = raw?.experienceYears ?? item.experienceYears
  const experienceText =
    experienceYears != null && Number(experienceYears) > 0
      ? `${experienceYears} سنوات خبرة`
      : null

  const rawEquip: string[] = raw?.equipmentTypes || item.equipmentTypes || []
  const equipmentTags = rawEquip.length > 0
    ? rawEquip.map((t) => getEquipmentTypeLabel(t))
    : []

  const hasCertifications = Boolean(raw?.certifications && raw.certifications.length > 0)

  // Assemble chip badges
  const allChips: Array<{ key: string; label: string; icon: any; isMci?: boolean }> = []
  if (operatorTypeLabel) {
    allChips.push({ key: 'type', label: operatorTypeLabel, icon: 'account-hard-hat', isMci: true })
  }
  if (experienceText) {
    allChips.push({ key: 'exp', label: experienceText, icon: 'shield-checkmark-outline' })
  }
  equipmentTags.forEach((tag, idx) => {
    allChips.push({ key: `eq-${idx}`, label: tag, icon: 'construct-outline' })
  })

  const visibleChips = allChips.slice(0, maxChips)
  const extraCount = allChips.length - maxChips

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

  // Contact actions (public mode only)
  const isOwnerMode = Boolean(actionMenu)
  const contact = useListingContact(
    'OPERATOR_LISTING',
    item.id || raw?.id || '',
    `/equipment/operators/${item.id || raw?.id || ''}`,
    name
  )

  const handleCall = (e: any) => {
    e.stopPropagation?.()
    contact.call()
  }

  const handleWhatsApp = (e: any) => {
    e.stopPropagation?.()
    contact.whatsApp()
  }

  const isWhatsappEnabled = Boolean(item.whatsappEnabled || raw?.whatsappEnabled)

  return (
    <TouchableOpacity
      style={[s.card, fullWidth ? s.cardFull : s.cardFixed]}
      onPress={onPress}
      activeOpacity={0.88}
      testID="operator-card"
    >
      <OperatorCardHeader
        name={name}
        avatarUrl={userAvatar}
        isVerified={isVerified}
        locationDisplay={locationDisplay}
        isOwnerMode={isOwnerMode}
        displayPrice={displayPrice}
        actionMenu={actionMenu}
      />

      <OperatorCardChips
        chips={visibleChips}
        hasCertifications={hasCertifications}
        extraCount={extraCount}
      />

      {!isOwnerMode && (
        <OperatorCardActions
          onCall={handleCall}
          onWhatsApp={handleWhatsApp}
          isWhatsappEnabled={isWhatsappEnabled}
        />
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    padding: CardSystem.padding.dense,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.space3,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardFull: {
    width: '100%',
  },
  cardFixed: {
    width: CARD_FIXED_WIDTH,
  },
})
