import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, ActivityIndicator, Platform
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'
import { LinearGradient } from 'expo-linear-gradient'
import { AppButton } from '../../src/components/ui/AppButton'
import { Stepper } from '../../src/components/ui/Stepper'
import * as Location from 'expo-location'
import { POST_GOVERNORATES, POST_CITIES_BY_GOVERNORATE, OMAN_LOCATIONS } from '../../src/constants/locations'

import { GovernorateWilayaSelect } from '../../src/components/ui/GovernorateWilayaSelect'
import { dialogService } from '../../src/store/dialogStore'

import MapView, { PROVIDER_GOOGLE } from '../../src/components/ui/Map';



const OMAN_CENTER = {
  latitude: 23.5859,
  longitude: 58.4059,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
}

export default function PostStep4Screen() {
  const insets = useSafeAreaInsets()
  const { category, governorate, city, governorateId, wilayaId, locationNote, latitude, longitude, set } = usePostStore()
  
  const mapRef = useRef<any>(null);
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  
  const [region, setRegion] = useState({
    latitude: latitude || OMAN_CENTER.latitude,
    longitude: longitude || OMAN_CENTER.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  })

  useEffect(() => {
    if (!latitude && !longitude) {
      getCurrentLocation()
    }
  }, [])

  const getCurrentLocation = async () => {
    setLoadingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
      setRegion(newRegion)
      set({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
      mapRef.current?.animateToRegion(newRegion, 1000)
    } catch (e) {
      console.warn("Location error:", e)
    } finally {
      setLoadingLocation(false)
    }
  }

  const handleRegionChangeComplete = (newRegion: any) => {
    setRegion(newRegion)
    set({ latitude: newRegion.latitude, longitude: newRegion.longitude })
  }

  return (
    <View style={s.root}>
      <AppHeader title="الموقع" showBack />

      <ScrollView 
        contentContainerStyle={s.content} 
        showsVerticalScrollIndicator={false}
      >
        <View style={s.centerWrap}>
          <View style={s.progressWrap}>
            <Stepper currentStep={4} totalSteps={5} title="موقع الإعلان" />
          </View>

          {/* Map Section */}
          <View style={s.card}>
            <View style={s.mapHeader}>
              <Text style={s.title}>الموقع على الخريطة</Text>
              <TouchableOpacity onPress={getCurrentLocation} style={s.myLocBtn}>
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="locate" size={18} color={Colors.primary} />
                )}
                <Text style={s.myLocTxt}>موقعي الحالي</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={s.infoTxt}>حرك الخريطة لتحديد الموقع الدقيق للإعلان</Text>

            <View style={s.mapContainer}>
              {Platform.OS === 'web' ? (
                <View style={[s.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e5e5' }]}>
                  <Text style={{ fontFamily: 'Almarai_700Bold', color: Colors.textMuted }}>الخريطة غير مدعومة على الويب</Text>
                </View>
              ) : (
                <MapView
                  ref={mapRef}
                  style={s.map}
                  provider={PROVIDER_GOOGLE}
                  initialRegion={region}
                  onRegionChangeComplete={handleRegionChangeComplete}
                  showsUserLocation={true}
                  showsMyLocationButton={false}
                  pitchEnabled={false}
                  toolbarEnabled={false}
                />
              )}
              {/* Center Pin Overlay */}
              <View style={s.mapPinOverlay} pointerEvents="none">
                <Ionicons name="location" size={40} color={'#E11D48'} style={{ marginTop: -36, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }} />
                <View style={s.pinShadow} />
              </View>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.title}>المدينة والمنطقة</Text>
            <GovernorateWilayaSelect
              governorateId={governorateId}
              wilayaId={wilayaId}
              onLocationChange={(govId, wilId, govNameAr, wilNameAr) => {
                set({
                  governorateId: govId,
                  wilayaId: wilId || undefined,
                  // Temporarily keep string fields populated as well
                  governorate: govNameAr,
                  city: wilNameAr
                })
              }}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[s.bottomBarWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={s.bottomBarContent}>
          <AppButton 
            variant="outline" 
            size="sm"
            title="السابق" 
            onPress={() => router.back()} 
            style={{ flex: 1 }} 
          />
          <AppButton 
            title="التالي" 
            size="sm"
            onPress={() => {
              if (!governorateId) {
                dialogService.alert('تنبيه', 'يرجى تحديد المحافظة')
                return
              }
              if (!wilayaId) {
                dialogService.alert('تنبيه', 'يرجى تحديد الولاية')
                return
              }
              router.push('/post/step5')
            }} 
            style={{ flex: 1 }} 
          />
        </View>
      </View>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { 
    paddingHorizontal: Spacing.space3, 
    paddingTop: Spacing.space3, 
    paddingBottom: 90,
  },
  centerWrap: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  progressWrap: { marginBottom: Spacing.space3 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.space2 },
  progressStepTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.primary },
  progressTitle: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.textMuted },
  progressBarBg: { height: 10, backgroundColor: Colors.surface, borderRadius: 100, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 100 },
  
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontFamily: 'Almarai_700Bold', fontSize: 13.5, lineHeight: 18, color: Colors.text, writingDirection: 'rtl', textAlign: 'left', marginBottom: 4 },
  myLocBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EFF6FF', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  myLocTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, color: Colors.primary, writingDirection: 'rtl' },
  infoTxt: { fontFamily: 'Almarai_400Regular', fontSize: 11.5, lineHeight: 16, color: Colors.textMuted, writingDirection: 'rtl', textAlign: 'left', marginBottom: 8 },
  
  mapContainer: { width: '100%', height: 180, borderRadius: 12, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#E5E7EB' },
  map: { width: '100%', height: '100%' },
  mapPinOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  pinShadow: { width: 14, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', marginTop: 2 },
  
  bottomBarWrap: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0, 
    backgroundColor: Colors.white,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  bottomBarContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.space3,
    paddingHorizontal: Spacing.space4,
  },
})
