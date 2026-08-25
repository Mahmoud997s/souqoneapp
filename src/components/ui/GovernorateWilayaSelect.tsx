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
import { locationsApi } from '../../api/locations'
import { GovernorateRef, WilayaRef } from '../../types/location.types'

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

function normalizeArabic(text: string): string {
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim()
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
      console.warn('Failed to fetch governorates', error)
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
      console.warn('Failed to fetch wilayas', error)
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
        <TouchableOpacity
          style={[
            s.inputBox,
            activeGov && s.inputBoxActive,
            govError ? s.inputBoxError : null,
          ]}
          activeOpacity={0.7}
          onPress={handleOpenGovernorate}
        >
          <View style={s.iconWrapStart}>
            {isLoadingGovs ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name="location-outline"
                size={18}
                color={govError ? Colors.error : activeGov ? Colors.primary : '#94A3B8'}
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
              color={govError ? Colors.error : activeGov ? Colors.primary : '#94A3B8'}
            />
          </View>
        </TouchableOpacity>
        {govError ? <Text style={s.errorTxt}>{govError}</Text> : null}
      </View>

      {/* ── 2. Wilaya / City Field ── */}
      {showCity && (
        <View style={s.fieldWrapper}>
          <Text style={s.label}>{cityLabelText} *</Text>
          <TouchableOpacity
            style={[
              s.inputBox,
              !activeGov && s.inputBoxDisabled,
              activeCity && s.inputBoxActive,
              cityError ? s.inputBoxError : null,
            ]}
            activeOpacity={0.7}
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
                      ? '#CBD5E1'
                      : activeCity
                      ? Colors.primary
                      : '#94A3B8'
                  }
                />
              )}
            </View>
            <View style={s.inputContent}>
              <Text
                style={[
                  s.inputText,
                  !wilayaId && s.placeholder,
                  !activeGov && { color: '#94A3B8' },
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
                    ? '#CBD5E1'
                    : activeCity
                    ? Colors.primary
                    : '#94A3B8'
                }
              />
            </View>
          </TouchableOpacity>
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
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={s.searchBox}>
              <Ionicons name="search" size={17} color="#94A3B8" style={{ marginEnd: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder={
                  modalType === 'governorate' ? 'ابحث عن اسم المحافظة...' : 'ابحث عن اسم الولاية...'
                }
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                textAlign="right"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={16} color="#94A3B8" />
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
                        {isSelected && <Ionicons name="checkmark" size={12} color="#ffffff" />}
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
                  <Ionicons name="search-outline" size={32} color="#94A3B8" />
                  <Text style={s.emptyText}>لم يتم العثور على نتائج مطابقة</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
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
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  inputBox: {
    height: 46,
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#FEF2F2',
  },
  inputBoxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#94A3B8',
  },

  /* ── Bottom Sheet Styles (Matching Profile Location Modal) ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopStartRadius: 20,
    borderTopEndRadius: 20,
    maxHeight: '80%',
  },
  handleBar: {
    width: 38,
    height: 4,
    backgroundColor: '#CBD5E1',
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
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 21,
    color: '#0F172A',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#64748B',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
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
    borderBottomColor: '#F8FAFC',
  },
  listItemSelected: {
    backgroundColor: '#EFF6FF',
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
    color: '#1E293B',
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
    color: '#94A3B8',
    writingDirection: 'ltr',
    textAlign: 'left',
    marginTop: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
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
    color: '#94A3B8',
    writingDirection: 'rtl',
  },
})
