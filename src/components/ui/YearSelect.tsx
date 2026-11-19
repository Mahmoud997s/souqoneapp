import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { ModalToastHost } from './ModalToastHost'

interface YearSelectProps {
  value?: string
  onChange: (year: string) => void
  label?: string
  error?: string
}

export function YearSelect({
  value,
  onChange,
  label = 'سنة الصنع *',
  error,
}: YearSelectProps) {
  const insets = useSafeAreaInsets()
  const [modalVisible, setModalVisible] = useState(false)

  // Generate years from (Current Year + 1) down to 1970
  const years = React.useMemo(() => {
    const startYear = new Date().getFullYear() + 1
    const endYear = 1970
    return Array.from({ length: startYear - endYear + 1 }, (_, i) => String(startYear - i))
  }, [])

  const handleOpen = () => {
    setModalVisible(true)
  }

  const handleSelect = (year: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onChange(year)
    setModalVisible(false)
  }

  return (
    <View style={s.container}>
      <View style={s.fieldWrapper}>
        <Text style={s.label}>{label}</Text>
        <TouchableOpacity
          style={[
            s.inputBox,
            value && s.inputBoxActive,
            error ? s.inputBoxError : null,
          ]}
          activeOpacity={0.7}
          onPress={handleOpen}
        >
          <View style={s.iconWrapStart}>
            <Ionicons
              name="calendar-outline"
              size={18}
              color={error ? Colors.error : value ? Colors.primary : Colors.slateMuted}
            />
          </View>
          <View style={s.inputContent}>
            <Text style={[s.inputText, !value && s.placeholder]} numberOfLines={1}>
              {value || 'اختر سنة الصنع'}
            </Text>
          </View>
          <View style={s.iconWrapEnd}>
            <Ionicons
              name="chevron-down"
              size={16}
              color={error ? Colors.error : value ? Colors.primary : Colors.slateMuted}
            />
          </View>
        </TouchableOpacity>
        {error ? <Text style={s.errorTxt}>{error}</Text> : null}
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Handle Bar */}
            <View style={s.handleBar} />

            {/* Header */}
            <View style={s.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={s.modalTitle}>اختر سنة الصنع</Text>
                <Text style={s.modalSubtitle}>حدد سنة الصنع من القائمة التالية</Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={Colors.slateMuted} />
              </TouchableOpacity>
            </View>

            {/* Years List */}
            <FlatList
              data={years}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => {
                const isSelected = value === item

                return (
                  <TouchableOpacity
                    style={[s.listItem, isSelected && s.listItemSelected]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(item)}
                  >
                    <View style={s.listItemLeft}>
                      <View style={[s.radioCircle, isSelected && s.radioCircleSelected]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color={Colors.white} />}
                      </View>
                    </View>

                    <View style={s.listItemContent}>
                      <Text style={[s.listItemText, isSelected && s.listItemTextSelected]}>
                        {item}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              }}
            />
          </View>
        </KeyboardAvoidingView>
        {modalVisible && <ModalToastHost />}
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    gap: 12,
  },
  fieldWrapper: {
    gap: 5,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.slateBody,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 1,
  },
  inputBox: {
    height: 48,
    backgroundColor: Colors.slateSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputBoxError: {
    borderColor: Colors.error,
    backgroundColor: Colors.dangerBg,
  },
  errorTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  iconWrapStart: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapEnd: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContent: {
    flex: 1,
    marginStart: 8,
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.slateHeading,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13.5,
    lineHeight: 18,
    color: Colors.slateMuted,
  },

  /* ── Bottom Sheet Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.scrimDark45,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    maxHeight: '70%',
  },
  handleBar: {
    width: 38,
    height: 4,
    backgroundColor: Colors.slateBorderStrong,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slateSubtleBg,
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.slateHeading,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.slateText,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.slateSurface,
  },
  listItemSelected: {
    backgroundColor: Colors.infoSoftBg,
  },
  listItemLeft: {
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    marginStart: 8,
  },
  listItemText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13.5,
    lineHeight: 19,
    color: Colors.slateDark,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  listItemTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.slateBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  radioCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
})
