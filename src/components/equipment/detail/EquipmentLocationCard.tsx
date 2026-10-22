import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import { RTLText } from '../../../constants/rtl'
import { lineHeightFor } from '../../../constants/typography'

export interface EquipmentLocationCardProps {
  locationText: string
  latitude?: number
  longitude?: number
}

/**
 * EquipmentLocationCard
 * Text-based location card with external directions link.
 * Strictly adheres to equipment decision: text location card instead of embedded map.
 */
export function EquipmentLocationCard({
  locationText,
  latitude,
  longitude,
}: EquipmentLocationCardProps) {
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude)

  const handleOpenDirections = () => {
    if (!hasCoordinates) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    Linking.openURL(url).catch(() => {})
  }

  return (
    <View style={s.card} testID="equipment-location-card">
      <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>
        الموقع والعنوان
      </Text>

      <View style={s.locationRow}>
        <Ionicons name="location-outline" size={20} color={Colors.primary} />
        <Text style={s.locationText} maxFontSizeMultiplier={1.3}>
          {locationText || 'سلطنة عُمان'}
        </Text>
      </View>

      {hasCoordinates && (
        <TouchableOpacity
          style={s.directionsBtn}
          onPress={handleOpenDirections}
          activeOpacity={0.8}
          testID="equipment-directions-button"
          accessibilityRole="button"
          accessibilityLabel="الحصول على الاتجاهات"
        >
          <Ionicons name="navigate-circle-outline" size={22} color={Colors.primary} />
          <Text style={s.directionsTxt} maxFontSizeMultiplier={1.3}>
            الحصول على الاتجاهات
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardTitle: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
    textAlign: 'left',
    marginBottom: Spacing.space3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationText: {
    ...RTLText,
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.text,
    textAlign: 'left',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.paleMint,
    paddingVertical: Spacing.space3,
    minHeight: Spacing.touch,
    borderRadius: Radius.md,
    marginTop: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directionsTxt: {
    ...RTLText,
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    color: Colors.primary,
    textAlign: 'left',
  },
})
