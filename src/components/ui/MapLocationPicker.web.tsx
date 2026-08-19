import React from 'react'
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { AppButton } from './AppButton'

interface MapLocationPickerProps {
  isVisible: boolean
  onClose: () => void
  onConfirm: (lat: number, lng: number) => void
  initialLat?: number
  initialLng?: number
  title?: string
}

const MUSCAT_LAT = 23.588
const MUSCAT_LNG = 58.3829

export function MapLocationPicker({
  isVisible,
  onClose,
  onConfirm,
  title = 'تحديد الموقع على الخريطة',
}: MapLocationPickerProps) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.content}>
          <Ionicons name="map-outline" size={56} color={Colors.textMuted} />
          <Text style={styles.mockText}>الخريطة التفاعلية متاحة على تطبيق الهاتف</Text>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <AppButton
            title="استخدام الموقع الافتراضي (مسقط)"
            size="sm"
            onPress={() => {
              onConfirm(MUSCAT_LAT, MUSCAT_LNG)
              onClose()
            }}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    borderBottomWidth: 1,
    borderColor: '#EEF2F6',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14.5,
    color: '#0F172A',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: Spacing.space5,
  },
  mockText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Spacing.space4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
})
