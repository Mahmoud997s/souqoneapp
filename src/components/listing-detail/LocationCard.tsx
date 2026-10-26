import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  InteractionManager,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker } from '../ui/Map'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { RTLText } from '../../constants/rtl'
import { lineHeightFor } from '../../constants/typography'

export interface LocationCardProps {
  locationText: string
  latitude?: number
  longitude?: number
}

/**
 * LocationCard
 * Location card with address text and embedded map (when coordinates are present) matching cars reference.
 * Used across detail screens (Equipment, Operators, etc.).
 */
export function LocationCard({
  locationText,
  latitude,
  longitude,
}: LocationCardProps) {
  const [isMapMounted, setIsMapMounted] = useState<boolean>(false)

  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude)

  useEffect(() => {
    if (!hasCoordinates) return
    const task = InteractionManager.runAfterInteractions(() => {
      setIsMapMounted(true)
    })
    return () => task.cancel()
  }, [hasCoordinates])

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

      {hasCoordinates && (
        <View style={s.mapContainer} testID="location-map-container">
          {isMapMounted ? (
            <>
              <MapView
                style={{ width: '100%', height: '100%' }}
                initialRegion={{
                  latitude,
                  longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                />
              </MapView>
              {/* Overlay to prevent accidental touches capturing scroll */}
              <View style={StyleSheet.absoluteFill} />
            </>
          ) : (
            <View style={s.mapPlaceholder}>
              <Ionicons name="location-outline" size={32} color={Colors.primary} />
            </View>
          )}
        </View>
      )}

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
  mapContainer: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    position: 'relative',
    marginBottom: Spacing.space3,
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
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
