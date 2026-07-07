import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { UnifiedCardItem } from './UnifiedCard'
import { getOperatorTypeLabel, getEquipmentTypeLabel } from '../../utils/equipment-mappers'

interface Props {
  item: UnifiedCardItem
  onPress: () => void
}

export function OperatorCard({ item, onPress }: Props) {
  const { title, price, priceText, priceLabel, currency, governorate, raw } = item
  const isVerified = (item as any).isVerified ?? false
  
  // Extract data from raw
  const operatorType = getOperatorTypeLabel(raw?.operatorType)
  const experienceYears = raw?.experienceYears
  
  // Example tags: from equipmentTypes or specialties
  const experienceText = experienceYears ? `${experienceYears} سنة خبرة` : null
  
  // Example tags: from equipmentTypes or specialties
  const equipmentTags = (raw?.equipmentTypes && raw.equipmentTypes.length > 0)
    ? raw.equipmentTypes.map((t: string) => getEquipmentTypeLabel(t))
    : ['معدات ثقيلة']

  const allTags = [operatorType, experienceText, ...equipmentTags].filter(Boolean)
  const displayTags = allTags.slice(0, 3)
  const extraCount = allTags.length - 3

  const description = item.description || raw?.description

  // Format price
  let displayPrice = ''
  const displayCurrency = currency === 'USD' ? '$' : 'ر.ع.'
  if (price && price > 0) {
    displayPrice = `${price} ${displayCurrency}` + (priceLabel ? ` /${priceLabel}` : '')
  } else if (priceText) {
    displayPrice = priceText
  }

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.9}>
      <View style={s.topRow}>
        <View style={s.iconBox}>
          <Ionicons name="people-outline" size={24} color={Colors.accent} />
        </View>
        <View style={s.textContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={[s.title, { flexShrink: 1 }]} numberOfLines={1}>{title}</Text>
          </View>
          {description ? (
            <Text style={s.subtitle} numberOfLines={2}>{description}</Text>
          ) : null}
        </View>
      </View>

      {displayTags && displayTags.length > 0 && (
        <View style={s.tagsRow}>
          {displayTags.map((tag: string | null, i: number) => (
            <View key={i} style={s.tag}>
              <Text style={s.tagTxt}>{tag}</Text>
            </View>
          ))}
          {extraCount > 0 && (
            <View style={s.tag}>
              <Text style={s.tagTxt}>+{extraCount}</Text>
            </View>
          )}
        </View>
      )}

      <View style={s.footer}>
        <View style={s.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
          <Text style={s.locationTxt} numberOfLines={1}>{governorate}</Text>
        </View>
        <Text style={s.priceTxt}>{displayPrice}</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.space3,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: Radius.lg,
    backgroundColor: '#fffbeb',
    alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.space3,
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 15, color: Colors.text, textAlign: 'left',
  },
  verifiedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#E7F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 100,
  },
  verifiedTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 2, paddingBottom: 4,
    fontSize: 9, color: '#1877F2',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 12, color: Colors.textMuted, textAlign: 'left', lineHeight: 20, marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.space3,
  },
  tag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  tagTxt: {
    fontFamily: 'Almarai_700Bold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 11, color: Colors.text2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.space3,
    borderTopWidth: 1, borderTopColor: Colors.surface,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationTxt: {
    fontFamily: 'Almarai_400Regular', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 12, color: Colors.textMuted, textAlign: 'left',
  },
  priceTxt: {
    fontFamily: 'Almarai_800ExtraBold', includeFontPadding: false, paddingTop: 4, paddingBottom: 4,
    fontSize: 14, color: Colors.accent, textAlign: 'right',
  },
})
