import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native'
import MapView, { Region } from './Map'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { AppButton } from './AppButton'
import { ModalToastHost } from './GlobalToast'
import { logWarn } from '../../utils/safeLog'
import { getLocationCenterCoords } from '../../constants/locations'

interface MapLocationPickerProps {
  isVisible: boolean
  onClose: () => void
  onConfirm: (lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
  governorate?: string | number | null
  wilaya?: string | number | null
  title?: string
}

export function MapLocationPicker({
  isVisible,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  governorate,
  wilaya,
  title = 'تحديد الموقع على الخريطة',
}: MapLocationPickerProps) {
  const insets = useSafeAreaInsets()
  const fallbackCenter = getLocationCenterCoords(governorate, wilaya)

  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number
    longitude: number
  } | null>(
    initialLat != null && initialLng != null
      ? { latitude: initialLat, longitude: initialLng }
      : fallbackCenter
  )

  const [region, setRegion] = useState<Region>({
    latitude: initialLat ?? fallbackCenter.latitude,
    longitude: initialLng ?? fallbackCenter.longitude,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  })

  const [isLoadingLoc, setIsLoadingLoc] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Sync initial props or selected governorate/wilaya center when opened (never auto-fetch GPS)
  useEffect(() => {
    if (isVisible) {
      if (initialLat != null && initialLng != null) {
        setSelectedLocation({ latitude: initialLat, longitude: initialLng })
        setRegion({
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        })
      } else {
        const center = getLocationCenterCoords(governorate, wilaya)
        setSelectedLocation(center)
        setRegion({
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        })
      }
    }
  }, [isVisible, initialLat, initialLng, governorate, wilaya])

  const getCurrentLocation = async () => {
    try {
      setIsLoadingLoc(true)
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setIsLoadingLoc(false)
        return
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      const newLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }
      setSelectedLocation(newLoc)
      setRegion({
        ...newLoc,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      })
    } catch (err) {
      logWarn('MapLocationPicker', err)
    } finally {
      setIsLoadingLoc(false)
    }
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation.latitude, selectedLocation.longitude)
      onClose()
    }
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} translucent />
        {/* Compact Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={24} color={Colors.slateMuted} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>اسحب الخريطة لتثبيت الدبوس بدقة</Text>
          </View>

          <View style={styles.closeBtnPlaceholder} />
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            onRegionChange={() => setIsDragging(true)}
            onRegionChangeComplete={(r) => {
              setRegion(r)
              setSelectedLocation({ latitude: r.latitude, longitude: r.longitude })
              setIsDragging(false)
            }}
            onPress={(e: any) => {
              const coord = e?.nativeEvent?.coordinate
              if (coord && typeof coord.latitude === 'number' && typeof coord.longitude === 'number') {
                setSelectedLocation({ latitude: coord.latitude, longitude: coord.longitude })
                setRegion((prev) => ({
                  ...prev,
                  latitude: coord.latitude,
                  longitude: coord.longitude,
                }))
              }
            }}
            showsUserLocation
            showsMyLocationButton={false}
          />

          {/* Floating Instructions Pill */}
          <View style={styles.floatingHintPill} pointerEvents="none">
            <Ionicons name="hand-left-outline" size={13} color={Colors.infoText} />
            <Text style={styles.floatingHintTxt}>
              {isDragging ? 'جاري ضبط الإحداثيات...' : 'حرّك الخريطة لتغيير مكان الدبوس'}
            </Text>
          </View>

          {/* Scaled Center Pin */}
          <View style={styles.centerPinContainer} pointerEvents="none">
            <Ionicons
              name="location"
              size={36}
              color={Colors.primary}
              style={[
                styles.pinIcon,
                { transform: [{ translateY: isDragging ? -10 : 0 }] },
              ]}
            />
            <View style={[styles.pinShadow, { opacity: isDragging ? 0.2 : 0.6 }]} />
          </View>

          {/* My Location GPS Button */}
          <TouchableOpacity
            style={styles.myLocationBtn}
            onPress={getCurrentLocation}
            disabled={isLoadingLoc}
            activeOpacity={0.8}
          >
            {isLoadingLoc ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons name="locate" size={20} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Scaled Profile-Matched Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {selectedLocation ? (
            <View style={styles.coordDisplayRow}>
              <View style={styles.coordDot} />
              <Text style={styles.coordLabel}>تم تحديد الموقع على الخريطة ✓</Text>
            </View>
          ) : (
            <Text style={styles.helpText}>يرجى تحريك الخريطة لتحديد الموقع</Text>
          )}

          <AppButton
            title="تأكيد وتثبيت الموقع"
            size="sm"
            onPress={handleConfirm}
            disabled={!selectedLocation || isDragging}
          />
        </View>
      </View>
      {isVisible && <ModalToastHost />}
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slateSubtleBg,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    padding: 2,
  },
  closeBtnPlaceholder: {
    width: 28,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.slateHeading,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 14,
    color: Colors.slateText,
    textAlign: 'center',
    marginTop: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  floatingHintPill: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.whiteAlpha95,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    ...Platform.select({
      ios: { shadowColor: Colors.shadowBlack, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  floatingHintTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.infoText,
  },
  myLocationBtn: {
    position: 'absolute',
    bottom: 16,
    end: 16,
    backgroundColor: Colors.surface,
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: Colors.shadowBlack, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -18,
    marginTop: -36,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 36,
    height: 36,
    zIndex: 10,
  },
  pinIcon: {
    marginBottom: -6,
  },
  pinShadow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: Colors.scrimSlate60,
    transform: [{ scaleX: 2 }],
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.slateBorder,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: Colors.shadowBlack, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 5 },
    }),
  },
  coordDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.slateSurface,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  coordDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.emeraldSoft,
  },
  coordLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.slateText,
  },
  coordValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15,
    color: Colors.slateHeading,
  },
  helpText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.slateText,
    textAlign: 'center',
  },
})
