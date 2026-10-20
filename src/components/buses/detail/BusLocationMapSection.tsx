import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { Shadows } from '../../../constants/shadows'
import MapView, { Marker } from '../../ui/Map'

export interface BusLocationMapSectionProps {
  latitude: number
  longitude: number
  isMapMounted: boolean
}

export function BusLocationMapSection({
  latitude,
  longitude,
  isMapMounted,
}: BusLocationMapSectionProps) {
  return (
    <View style={s.mapSection}>
      <Text style={s.mapSectionTitle}>الموقع والعنوان</Text>
      <View style={s.mapContainer}>
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
        onPress={() => {
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
          )
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
    padding: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  mapSectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
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
    paddingVertical: 12,
    borderRadius: Radius.md,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  directionsTxt: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    fontSize: 14,
  },
})
