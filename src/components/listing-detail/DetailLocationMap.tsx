import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker } from '../ui/Map'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'
import { RTLText } from '../../constants/rtl'
import { lineHeightFor } from '../../constants/typography'
import { scheduleIdleTask } from '../../utils/scheduleIdleTask'
import { toastService } from '../../store/toastStore'

export interface DetailLocationMapProps {
  latitude?: number
  longitude?: number
  /** Optional external deferred-mount flag (e.g. Cars/Buses). When omitted, defers internally via scheduleIdleTask. */
  isMapMounted?: boolean
  testID?: string
}

/**
 * DetailLocationMap
 * Unified detail-page location map card matching Cars (`CarDetailScreen`) 1-to-1:
 * - Renders ONLY when valid finite non-zero coordinates exist.
 * - Deferred MapView + Marker (delta 0.05) with touch-shield overlay.
 * - Directions CTA opening Google Maps (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`).
 */
export function DetailLocationMap({
  latitude,
  longitude,
  isMapMounted: externalIsMapMounted,
  testID = 'detail-location-map',
}: DetailLocationMapProps) {
  const [internalMounted, setInternalMounted] = useState(false)

  const hasValidCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    (latitude !== 0 || longitude !== 0)

  const isMapMounted =
    externalIsMapMounted !== undefined ? externalIsMapMounted : internalMounted

  useEffect(() => {
    if (!hasValidCoordinates || externalIsMapMounted !== undefined) return
    const task = scheduleIdleTask(() => {
      setInternalMounted(true)
    })
    return () => task.cancel()
  }, [hasValidCoordinates, externalIsMapMounted])

  if (!hasValidCoordinates) {
    return null
  }

  return (
    <View style={s.mapSection} testID={testID}>
      <Text style={s.mapSectionTitle}>الموقع والعنوان</Text>
      <View style={s.mapContainer} testID={`${testID}-container`}>
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
      <TouchableOpacity
        style={s.directionsBtn}
        activeOpacity={0.8}
        testID={`${testID}-directions-btn`}
        accessibilityRole="button"
        accessibilityLabel="الحصول على الاتجاهات"
        onPress={() => {
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
          ).catch(() => {
            toastService.show({ kind: 'error', title: 'تعذر فتح تطبيق الخرائط' })
          })
        }}
      >
        <Ionicons name="navigate-circle-outline" size={24} color={Colors.primary} />
        <Text style={s.directionsTxt}>الحصول على الاتجاهات</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  mapSection: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  mapSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: lineHeightFor(16),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
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
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
    color: Colors.primary,
    fontSize: 14,
    lineHeight: lineHeightFor(14),
  },
})
