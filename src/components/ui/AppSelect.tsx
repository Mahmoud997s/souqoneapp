import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

interface AppSelectProps {
  label?: string
  value: string
  onValueChange: (val: string) => void
  items: { label: string; value: string }[]
  placeholder?: string
  iconRight?: string
  disabled?: boolean
}

export function AppSelect({ label, value, onValueChange, items, placeholder, iconRight, disabled }: AppSelectProps) {
  const [modalVisible, setModalVisible] = useState(false)

  const selectedItem = items.find(i => i.value === value)
  const displayLabel = selectedItem ? selectedItem.label : (placeholder || 'اختر...')

  return (
    <View style={s.container}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[s.inputBox, disabled && s.disabled]}
        activeOpacity={0.7}
        onPress={() => {
          if (disabled) {
            Alert.alert('تنبيه', 'الرجاء تحديد الخيار السابق أولاً')
            return
          }
          setModalVisible(true)
        }}
      >
        <View style={s.iconWrapRight}>
          {iconRight ? (
            <Ionicons name={iconRight as any} size={20} color={Colors.textMuted} />
          ) : (
            <Ionicons name="list-outline" size={20} color={Colors.textMuted} />
          )}
        </View>
        <View style={s.inputContent}>
          <Text style={[s.inputText, !selectedItem && s.placeholder]}>{displayLabel}</Text>
        </View>
        <View style={s.iconWrapLeft}>
          <Ionicons name="chevron-down-outline" size={20} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Modal Bottom Sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalSheet}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{label || 'اختر'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={items}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => {
                const isSelected = item.value === value
                return (
                  <TouchableOpacity
                    style={[s.listItem, isSelected && s.listItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onValueChange(item.value)
                      setModalVisible(false)
                    }}
                  >
                    <Text style={[s.listItemText, isSelected && s.listItemTextSelected]}>
                      {item.label}
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
  container: { gap: Spacing.space2, width: '100%' },
  label: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
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
  disabled: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
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
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
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
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18,
    color: Colors.text,
    writingDirection: 'rtl',
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
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  listItemTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
})
