import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { AppButton } from '../ui/AppButton'
import { BUS_LISTING_TYPES, BUS_TYPES, BUS_MAKES } from '../../../app/post/_constants/bus'

export interface BusFilters {
  busListingType?: string
  busType?: string
  make?: string
  capacityMin?: number
}

interface BusFilterBottomSheetProps {
  visible: boolean
  onClose: () => void
  currentFilters: BusFilters
  onApply: (filters: BusFilters) => void
}

export function BusFilterBottomSheet({ visible, onClose, currentFilters, onApply }: BusFilterBottomSheetProps) {
  const [localFilters, setLocalFilters] = useState<BusFilters>(currentFilters)

  useEffect(() => {
    setLocalFilters(currentFilters)
  }, [currentFilters, visible])

  const toggleFilter = (key: keyof BusFilters, val: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key] === val ? undefined : val
    }))
  }

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleReset = () => {
    setLocalFilters({})
  }

  const renderChips = (title: string, data: { id: string, label: string }[], fieldKey: keyof BusFilters) => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.chipsRow}>
        {data.map(item => {
          const active = localFilters[fieldKey] === item.id
          return (
            <TouchableOpacity
              key={item.id}
              style={[s.chip, active && s.chipActive]}
              onPress={() => toggleFilter(fieldKey, item.id)}
            >
              <Text style={[s.chipTxt, active && s.chipTxtActive]}>{item.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={s.sheet}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={s.header}>
              <Text style={s.title}>تصفية الحافلات</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
              {renderChips('نوع الإعلان', BUS_LISTING_TYPES, 'busListingType')}
              {renderChips('فئة الحافلة', BUS_TYPES, 'busType')}
              {renderChips('الماركة', BUS_MAKES, 'make')}

              <View style={s.section}>
                <Text style={s.sectionTitle}>الحد الأدنى لعدد المقاعد</Text>
                <View style={s.chipsRow}>
                  {[10, 15, 30, 45, 50].map(cap => {
                    const active = localFilters.capacityMin === cap
                    return (
                      <TouchableOpacity
                        key={cap}
                        style={[s.chip, active && s.chipActive]}
                        onPress={() => toggleFilter('capacityMin', cap)}
                      >
                        <Text style={[s.chipTxt, active && s.chipTxtActive]}>+ {cap} مقعد</Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={s.footer}>
              <AppButton title="تطبيق الفرز" onPress={handleApply} style={{ flex: 2 }} />
              <AppButton title="إعادة ضبط" variant="outline" onPress={handleReset} style={{ flex: 1 }} />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', overflow: 'hidden' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5, paddingVertical: Spacing.space4,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: Colors.text },
  closeBtn: { padding: 4 },
  content: { padding: Spacing.space5 },
  section: { marginBottom: Spacing.space5 },
  sectionTitle: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: Colors.text, marginBottom: Spacing.space3, textAlign: 'left' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  chipTxt: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.textMuted },
  chipTxtActive: { color: Colors.primary },
  footer: {
    flexDirection: 'row', gap: Spacing.space3, padding: Spacing.space5,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white
  }
})
