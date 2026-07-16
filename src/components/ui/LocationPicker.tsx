import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { OMAN_LOCATIONS, getWilayatsForGovernorate } from '../../constants/locations'

interface LocationPickerProps {
  governorate: string
  onGovernorateChange: (val: string) => void
  city?: string
  onCityChange?: (val: string) => void
  showCity?: boolean
  govLabelText?: string
  cityLabelText?: string
}

export function LocationPicker({
  governorate,
  onGovernorateChange,
  city,
  onCityChange,
  showCity = true,
  govLabelText = 'المحافظة',
  cityLabelText = 'الولاية / المدينة',
}: LocationPickerProps) {
  const [modalType, setModalType] = useState<'governorate' | 'city' | null>(null)

  // Determine current active governorate to get its cities
  const activeGov = OMAN_LOCATIONS.find((g) => g.id === governorate || g.labelAr === governorate)
  const cities = activeGov ? activeGov.wilayats : []

  // Derived labels for UI
  const govDisplayLabel = activeGov?.labelAr || governorate || 'اختر المحافظة'
  const activeCity = cities.find((c) => c.id === city || c.labelAr === city)
  const cityDisplayLabel = activeCity?.labelAr || city || 'اختر الولاية'

  return (
    <View style={s.container}>
      {/* Governorate Selector */}
      <View style={s.fieldWrapper}>
        <Text style={s.label}>{govLabelText}</Text>
        <TouchableOpacity
          style={s.inputBox}
          activeOpacity={0.7}
          onPress={() => setModalType('governorate')}
        >
          <View style={s.iconWrapRight}>
            <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
          </View>
          <View style={s.inputContent}>
            <Text style={[s.inputText, !activeGov && s.placeholder]}>{govDisplayLabel}</Text>
          </View>
          <View style={s.iconWrapLeft}>
            <Ionicons name="chevron-down-outline" size={20} color={Colors.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      {/* City Selector */}
      {showCity && (
        <View style={s.fieldWrapper}>
          <Text style={s.label}>{cityLabelText}</Text>
          <TouchableOpacity
            style={[s.inputBox, !activeGov && s.inputBoxDisabled]}
            activeOpacity={0.7}
            onPress={() => {
              if (activeGov) setModalType('city')
            }}
            disabled={!activeGov}
          >
            <View style={s.iconWrapRight}>
              <Ionicons name="business-outline" size={20} color={!activeGov ? Colors.border : Colors.textMuted} />
            </View>
            <View style={s.inputContent}>
              <Text style={[s.inputText, !city && s.placeholder, !activeGov && { color: Colors.border }]}>
                {cityDisplayLabel}
              </Text>
            </View>
            <View style={s.iconWrapLeft}>
              <Ionicons name="chevron-down-outline" size={20} color={!activeGov ? Colors.border : Colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>
                {modalType === 'governorate' ? 'اختر المحافظة' : 'اختر الولاية'}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={modalType === 'governorate' ? OMAN_LOCATIONS : cities}
              keyExtractor={(item: any) => item.id || item.value || item.labelAr}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => {
                const label = item.labelAr
                const isSelected =
                  modalType === 'governorate'
                    ? governorate === item.id || governorate === item.labelAr
                    : city === item.labelAr

                return (
                  <TouchableOpacity
                    style={[s.listItem, isSelected && s.listItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (modalType === 'governorate') {
                        // Some systems expect `id` some expect `labelAr`, we use `labelAr` usually or `id`.
                        // For backwards compatibility across the app, if they pass a specific format, we handle it in parent, 
                        // but here we will emit `labelAr` as default for generic use, but Wait, we should emit `id` for new forms, or `labelAr` for older ones.
                        // Actually, looking at `add.tsx`, it uses free text, so we can emit `labelAr`.
                        // Register uses `id` (muscat).
                        // Let's emit `item.labelAr` because most new screens expect the readable string, except for register.
                        // For maximum flexibility, let's just emit `labelAr` here, and if a component needs the ID, we can adapt it.
                        // Actually, let's just emit `item.labelAr` as the value since most forms treat governorate as string like "مسقط".
                        onGovernorateChange(item.labelAr)
                        // Reset city when governorate changes
                        if (onCityChange) onCityChange('')
                      } else {
                        if (onCityChange) onCityChange(item.labelAr)
                      }
                      setModalType(null)
                    }}
                  >
                    <Text style={[s.listItemText, isSelected && s.listItemTextSelected]}>
                      {label}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                )
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    gap: Spacing.space4,
  },
  fieldWrapper: {
    gap: 8,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    includeFontPadding: false,
  },
  inputBox: {
    height: 52,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputBoxDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  iconWrapRight: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapLeft: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  inputText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  listContent: {
    paddingBottom: Spacing.space5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surface,
  },
  listItemSelected: {
    backgroundColor: Colors.surface,
  },
  listItemText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 16,
    color: Colors.text,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  listItemTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
})
