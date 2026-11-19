import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { ModalToastHost } from './ModalToastHost'
import { locationsApi } from '../../api/locations'
import { GovernorateRef, WilayaRef } from '../../types/location.types'
import { logWarn } from '../../utils/safeLog'
import { normalizeArabic } from '../../utils/arabicNormalize'
import { GlassPickerButton } from './GlassPickerButton'

interface GovernorateWilayaSelectProps {
  governorateId?: number | null
  wilayaId?: number | null
  onLocationChange: (govId: number, wilId: number, govNameAr: string, wilNameAr: string) => void
  showCity?: boolean
  govLabelText?: string
  cityLabelText?: string
  govError?: string
  cityError?: string
  fallbackGovName?: string
  fallbackCityName?: string
}

export function GovernorateWilayaSelect({
  governorateId,
  wilayaId,
  onLocationChange,
  showCity = true,
  govLabelText = 'المحافظة',
  cityLabelText = 'الولاية / المدينة',
  govError,
  cityError,
  fallbackGovName,
  fallbackCityName,
}: GovernorateWilayaSelectProps) {
  const insets = useSafeAreaInsets()
  const [modalType, setModalType] = useState<'governorate' | 'city' | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  const [governorates, setGovernorates] = useState<GovernorateRef[]>([])
  const [wilayas, setWilayas] = useState<WilayaRef[]>([])
  const [isLoadingGovs, setIsLoadingGovs] = useState(false)
  const [isLoadingWilayas, setIsLoadingWilayas] = useState(false)

  // Derived labels for UI
  const activeGov = governorates.find((g) => g.id === governorateId)
  const activeCity = wilayas.find((w) => w.id === wilayaId)

  const govDisplayLabel = activeGov?.nameAr || fallbackGovName || 'اختر المحافظة'
  const cityDisplayLabel = activeCity?.nameAr || fallbackCityName || 'اختر الولاية'

  useEffect(() => {
    fetchGovernorates()
  }, [])

  useEffect(() => {
    if (governorateId) {
      fetchWilayas(governorateId)
    } else {
      setWilayas([])
    }
  }, [governorateId])

  const fetchGovernorates = async () => {
    setIsLoadingGovs(true)
    try {
      const govs = await locationsApi.getGovernorates()
      setGovernorates(govs)
    } catch (error) {
      logWarn('GovWilayaSelect:Governorates', error)
    } finally {
      setIsLoadingGovs(false)
    }
  }

  const fetchWilayas = async (govId: number) => {
    setIsLoadingWilayas(true)
    try {
      const wils = await locationsApi.getWilayas(govId)
      setWilayas(wils)
    } catch (error) {
      logWarn('GovWilayaSelect:Wilayas', error)
    } finally {
      setIsLoadingWilayas(false)
    }
  }

  const handleOpenGovernorate = () => {
    setSearchQuery('')
    setModalType('governorate')
  }

  const handleOpenCity = () => {
    if (!governorateId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      setSearchQuery('')
      setModalType('governorate')
      return
    }
    setSearchQuery('')
    setModalType('city')
  }

  const handleSelect = (item: GovernorateRef | WilayaRef) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (modalType === 'governorate') {
      const g = item as GovernorateRef
      onLocationChange(g.id, 0, g.nameAr, '')
      setModalType('city')
    } else if (modalType === 'city') {
      const w = item as WilayaRef
      const parentGov = activeGov || governorates.find((g) => g.id === governorateId)
      const govName = parentGov?.nameAr || ''
      const govId = governorateId || 0
      onLocationChange(govId, w.id, govName, w.nameAr)
      setModalType(null)
    }
  }

  const currentList = React.useMemo(() => {
    const list = modalType === 'governorate' ? governorates : wilayas
    if (!searchQuery.trim()) return list
    const q = normalizeArabic(searchQuery)
    return list.filter((item) => {
      const nameArNorm = normalizeArabic(item.nameAr || '')
      const nameEnNorm = (item.nameEn || '').toLowerCase()
      return nameArNorm.includes(q) || nameEnNorm.includes(searchQuery.toLowerCase().trim())
    })
  }, [modalType, governorates, wilayas, searchQuery])

  return (
    <View style={s.container}>
      {/* ── 1. Governorate Field ── */}
      <View style={s.fieldWrapper}>
        <Text style={s.label}>{govLabelText} *</Text>
        <GlassPickerButton
          testID="gov-picker-btn"
          active={Boolean(activeGov)}
          error={Boolean(govError)}
          style={s.compactBox}
          onPress={handleOpenGovernorate}
        >
          <View style={s.iconWrapStart}>
            {isLoadingGovs ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name="location-outline"
                size={18}
                color={govError ? Colors.error : activeGov ? Colors.primary : Colors.slateMuted}
              />
            )}
          </View>
          <View style={s.inputContent}>
            <Text style={[s.inputText, !governorateId && s.placeholder]} numberOfLines={1}>
              {govDisplayLabel}
            </Text>
          </View>
          <View style={s.iconWrapEnd}>
            <Ionicons
              name="chevron-down"
              size={16}
              color={govError ? Colors.error : activeGov ? Colors.primary : Colors.slateMuted}
            />
          </View>
        </GlassPickerButton>
        {govError ? <Text style={s.errorTxt}>{govError}</Text> : null}
      </View>

      {/* ── 2. Wilaya / City Field ── */}
      {showCity && (
        <View style={s.fieldWrapper}>
          <Text style={s.label}>{cityLabelText} *</Text>
          <GlassPickerButton
            testID="wilaya-picker-btn"
            active={Boolean(activeCity)}
            error={Boolean(cityError)}
            style={[s.compactBox, !activeGov && s.dimmedBox]}
            onPress={handleOpenCity}
          >
            <View style={s.iconWrapStart}>
              {isLoadingWilayas ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={
                    cityError
                      ? Colors.error
                      : !activeGov
                      ? Colors.slateBorderStrong
                      : activeCity
                      ? Colors.primary
                      : Colors.slateMuted
                  }
                />
              )}
            </View>
            <View style={s.inputContent}>
              <Text
                style={[
                  s.inputText,
                  !wilayaId && s.placeholder,
                  !activeGov && { color: Colors.slateMuted },
                ]}
                numberOfLines={1}
              >
                {cityDisplayLabel}
              </Text>
            </View>
            <View style={s.iconWrapEnd}>
              <Ionicons
                name="chevron-down"
                size={16}
                color={
                  cityError
                    ? Colors.error
                    : !activeGov
                    ? Colors.slateBorderStrong
                    : activeCity
                    ? Colors.primary
                    : Colors.slateMuted
                }
              />
            </View>
          </GlassPickerButton>
          {cityError ? <Text style={s.errorTxt}>{cityError}</Text> : null}
        </View>
      )}

      {/* ── Bottom Sheet Modal (Profile Unified Scale) ── */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
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
                <Text style={s.modalTitle}>
                  {modalType === 'governorate' ? 'اختر المحافظة' : `اختر الولاية (${govDisplayLabel})`}
                </Text>
                <Text style={s.modalSubtitle}>
                  {modalType === 'governorate'
                    ? 'حدد المحافظة لعرض الولايات التابعة لها'
                    : 'اختر الولاية أو المدينة المناسبة لموقع إعلانك'}
                </Text>
              </View>
              <TouchableOpacity
                style={s.modalCloseBtn}
                onPress={() => setModalType(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={Colors.slateMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={s.searchBox}>
              <Ionicons name="search" size={17} color={Colors.slateMuted} style={{ marginEnd: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder={
                  modalType === 'governorate' ? 'ابحث عن اسم المحافظة...' : 'ابحث عن اسم الولاية...'
                }
                placeholderTextColor={Colors.slateMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign="right"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={16} color={Colors.slateMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Locations List */}
            <FlatList
              data={currentList}
              keyExtractor={(item: any) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => {
                const label = item.nameAr
                const isSelected =
                  modalType === 'governorate'
                    ? governorateId === item.id
                    : wilayaId === item.id

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
                        {label}
                      </Text>
                      {item.nameEn ? (
                        <Text style={s.listItemSubText}>{item.nameEn}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )
              }}
              ListEmptyComponent={
                <View style={s.emptyBox}>
                  <Ionicons name="search-outline" size={32} color={Colors.slateMuted} />
                  <Text style={s.emptyText}>لم يتم العثور على نتائج مطابقة</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
        {modalType !== null && <ModalToastHost />}
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
    fontSize: 12,
    lineHeight: 17,
    color: Colors.slateBody,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  compactBox: {
    height: 46,
    minHeight: 46,
  },
  dimmedBox: {
    opacity: 0.6,
  },
  errorTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
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
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.slateHeading,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.slateMuted,
  },

  /* ── Bottom Sheet Styles (Matching Profile Location Modal) ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.scrimDark45,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    maxHeight: '80%',
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
  searchBox: {
    marginHorizontal: 14,
    marginVertical: 8,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.slateSurface,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.slateHeading,
    textAlign: 'right',
    writingDirection: 'rtl',
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
  listItemSubText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.slateMuted,
    writingDirection: 'ltr',
    textAlign: 'left',
    marginTop: 1,
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
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: Colors.slateMuted,
    writingDirection: 'rtl',
  },
})
