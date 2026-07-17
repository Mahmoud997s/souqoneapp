import React, { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Modal, FlatList, ActivityIndicator, Platform, Alert
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
import { LocationPicker } from '../../src/components/ui/LocationPicker'

let MapView: any = null;
let PROVIDER_GOOGLE: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}



const OMAN_CENTER = {
  latitude: 23.5859,
  longitude: 58.4059,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
}

export default function PostStep4Screen() {
  const insets = useSafeAreaInsets()
  const { governorate, city, locationNote, latitude, longitude, set } = usePostStore()
  
  const mapRef = useRef<typeof MapView>(null);
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

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
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
                <Ionicons name="locate" size={20} color={Colors.primary} />
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
              <Ionicons name="location" size={44} color={'#E11D48'} style={{ marginTop: -40, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }} />
              <View style={s.pinShadow} />
            </View>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.title}>المدينة والمنطقة</Text>
          <LocationPicker
            governorate={governorate}
            onGovernorateChange={(val) => {
              set({ governorate: val, city: '' })
            }}
            city={city}
            onCityChange={(val) => {
              set({ city: val })
            }}
          />
        </View>
      </ScrollView>

      <View style={[s.bottomBar, { bottom: Math.max(insets.bottom, Spacing.space4) }]}>
        <AppButton variant="outline" title="السابق" onPress={() => router.back()} style={{ flex: 1 }} />
        <AppButton title="التالي" onPress={() => {
          if (!governorate) {
            Alert.alert('تنبيه', 'يرجى تحديد المحافظة')
            return
          }
          if (!city) {
            Alert.alert('تنبيه', 'يرجى تحديد الولاية')
            return
          }
          router.push('/post/step5')
        }} style={{ flex: 1 }} />
      </View>

    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FA' },
  content: { padding: Spacing.space4, paddingBottom: 100 },
  progressWrap: { marginBottom: Spacing.space6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.space2 },
  progressStepTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary },
  progressTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.textMuted },
  progressBarBg: { height: 10, backgroundColor: Colors.surface, borderRadius: 100, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 100 },
  
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.space5,
    marginBottom: Spacing.space6,
    borderWidth: 1, borderColor: '#F3F4F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  
  mapHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.space2 },
  title: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text, writingDirection: 'rtl' },
  myLocBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  myLocTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 12, color: Colors.primary, writingDirection: 'rtl' },
  infoTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.textMuted, writingDirection: 'rtl', marginBottom: Spacing.space4 },
  
  mapContainer: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden', position: 'relative', borderWidth: 1, borderColor: '#E5E7EB' },
  map: { width: '100%', height: '100%' },
  mapPinOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  pinShadow: { width: 14, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.15)', marginTop: 2 },
  
  label: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, marginBottom: Spacing.space2, marginTop: Spacing.space4, textAlign: 'right' },
  textInput: { height: 52, borderRadius: 14, paddingHorizontal: Spacing.space4, fontFamily: 'Almarai_400Regular',  fontSize: 15, color: Colors.text, backgroundColor: '#F8F9FA', textAlign: 'right', borderWidth: 1.5, borderColor: '#E5E7EB' },
  textInputFocused: { borderColor: Colors.primary, backgroundColor: '#FFFFFF', ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: {width:0, height:2}, shadowOpacity:0.1, shadowRadius:4}, android: {elevation: 2} }) },
  textArea: { height: 110, paddingTop: Spacing.space4, textAlignVertical: 'top' },
  scrollChips: { gap: Spacing.space3, paddingBottom: Spacing.space2, marginTop: Spacing.space2 },
  chipRound: { paddingHorizontal: 16, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  chipRoundActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  chipTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.text },
  chipTxtActive: { color: Colors.primary },
  selectWrap: { height: 52, borderRadius: 14, paddingHorizontal: Spacing.space4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: Spacing.space4 },
  selectText: { fontFamily: 'Almarai_400Regular',  fontSize: 16, color: Colors.text, writingDirection: 'rtl', textAlign: 'left' },
  placeholder: { color: Colors.textMuted },
  
  bottomBar: { 
    position: 'absolute', left: 0, right: 0, 
    paddingHorizontal: Spacing.space4, 
    flexDirection: 'row', gap: Spacing.space3
  },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Colors.white, borderTopStartRadius: 24, borderTopEndRadius: 24, paddingHorizontal: Spacing.space5, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginTop: Spacing.space3, marginBottom: Spacing.space2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.space3, borderBottomWidth: 1, borderBottomColor: '#F1F3F5', marginBottom: Spacing.space2 },
  modalTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text },
  modalSearchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: Spacing.space4, height: 56, marginBottom: Spacing.space4, borderWidth: 1.5, borderColor: '#E5E7EB' },
  modalSearchInput: { flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: 16, color: Colors.text, paddingHorizontal: Spacing.space2 },
  govItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.space4, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  govItemActive: { backgroundColor: '#EFF6FF', borderRadius: 8 },
  govItemTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text, writingDirection: 'rtl' },
  govItemTxtActive: { color: Colors.primary },
})
