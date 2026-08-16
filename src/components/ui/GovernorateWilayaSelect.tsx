import React, { useState, useMemo, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
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
}: GovernorateWilayaSelectProps) {
  const [modalType, setModalType] = useState<'governorate' | 'city' | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([])
  const [wilayas, setWilayas] = useState<WilayaRef[]>([])
  const [isLoadingGovs, setIsLoadingGovs] = useState(false)
  const [isLoadingWilayas, setIsLoadingWilayas] = useState(false)

  // Derived labels for UI
  const activeGov = governorates.find(g => g.id === governorateId)
  const activeCity = wilayas.find(w => w.id === wilayaId)
  
  const govDisplayLabel = activeGov?.nameAr || 'اختر المحافظة'
  const cityDisplayLabel = activeCity?.nameAr || 'اختر الولاية'

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

  useEffect(() => {
    setSearchQuery('')
  }, [modalType])

  const currentList = useMemo(() => {
    const rawList = modalType === 'governorate' ? governorates : wilayas
    if (!searchQuery.trim()) return rawList

    const q = normalizeArabic(searchQuery)
    return rawList.filter((item) => {
      const nameAr = normalizeArabic(item.nameAr || '')
      const nameEn = (item.nameEn || '').toLowerCase()
      return nameAr.includes(q) || nameEn.includes(searchQuery.toLowerCase().trim())
    })
  }, [modalType, searchQuery, governorates, wilayas])

  const handleSelect = (item: any) => {
    Haptics.selectionAsync().catch(() => {})
    if (modalType === 'governorate') {
      const newGovId = item.id
      // Clear city selection visually, but we need to pass a valid city ID eventually, 
      // passing 0 or keeping previous doesn't make sense. We pass 0 as temporary clearing flag if needed, 
      // but the component API expects both. Let's just pass 0 for wilId indicating it needs selection.
      onLocationChange(newGovId, 0, item.nameAr, '')
      
      if (showCity) {
        setTimeout(() => {
          setModalType('city')
        }, 250)
      } else {
        setModalType(null)
      }
    } else {
      // Selecting Wilaya
      if (activeGov) {
        onLocationChange(activeGov.id, item.id, activeGov.nameAr, item.nameAr)
      }
      setModalType(null)
    }
  }

  return (
    <View style={s.container}>
      {/* ── Governorate Field ── */}
      <View style={s.fieldWrapper}>
        <Text style={s.label}>{govLabelText}</Text>
        <TouchableOpacity
          style={[s.inputBox, activeGov && s.inputBoxActive]}
          activeOpacity={0.7}
          onPress={() => setModalType('governorate')}
        >
          <View style={s.iconWrapStart}>
            {isLoadingGovs ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons
                name="location-outline"
                size={20}
                color={activeGov ? Colors.primary : Colors.textMuted}
              />
            )}
          </View>
          <View style={s.inputContent}>
            <Text style={[s.inputText, !activeGov && s.placeholder]}>{govDisplayLabel}</Text>
          </View>
          <View style={s.iconWrapEnd}>
            <Ionicons
              name="chevron-down"
              size={18}
              color={activeGov ? Colors.primary : Colors.textMuted}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* ── City / Wilayat Field ── */}
      {showCity && (
        <View style={s.fieldWrapper}>
          <Text style={s.label}>{cityLabelText}</Text>
          <TouchableOpacity
            style={[
              s.inputBox,
              !activeGov && s.inputBoxDisabled,
              activeCity && s.inputBoxActive,
            ]}
            activeOpacity={0.7}
            onPress={() => {
              if (activeGov) setModalType('city')
            }}
            disabled={!activeGov}
          >
            <View style={s.iconWrapStart}>
              {isLoadingWilayas ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={!activeGov ? Colors.border : activeCity ? Colors.primary : Colors.textMuted}
                />
              )}
            </View>
            <View style={s.inputContent}>
              <Text
                style={[
                  s.inputText,
                  !wilayaId && s.placeholder,
                  !activeGov && { color: Colors.textMuted + '80' },
                ]}
              >
                {cityDisplayLabel}
              </Text>
            </View>
            <View style={s.iconWrapEnd}>
              <Ionicons
                name="chevron-down"
                size={18}
                color={!activeGov ? Colors.border : activeCity ? Colors.primary : Colors.textMuted}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Bottom Sheet Modal ── */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setModalType(null)}
      >
        <View style={s.modalOverlay}>
          <SafeAreaView style={s.modalSheet}>
            {/* Handle Bar */}
            <View style={s.handleBar} />

            {/* Header */}
            <View style={s.modalHeader}>
              <View>
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
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={s.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textMuted} style={{ marginEnd: 8 }} />
              <TextInput
                style={s.searchInput}
                placeholder={modalType === 'governorate' ? 'ابحث عن اسم المحافظة...' : 'ابحث عن اسم الولاية...'}
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close" size={18} color={Colors.textMuted} />
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
                        {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
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
                  <Ionicons name="search-outline" size={36} color={Colors.textMuted} />
                  <Text style={s.emptyText}>لم يتم العثور على نتائج مطابقة</Text>
                </View>
              }
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
    gap: 6,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  inputBox: {
    height: 52,
    backgroundColor: Colors.inputBg,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
  },
  inputBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  inputBoxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  iconWrapStart: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapEnd: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContent: {
    flex: 1,
    marginStart: Spacing.space2,
    justifyContent: 'center',
  },
  inputText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholder: {
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
  },

  /* ── Bottom Sheet Styles ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.white,
    borderTopStartRadius: Radius.xl,
    borderTopEndRadius: Radius.xl,
    maxHeight: '85%',
  },
  handleBar: {
    width: 44,
    height: 5,
    backgroundColor: Colors.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBox: {
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space3,
    height: 46,
    borderRadius: Radius.pill,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  listContent: {
    paddingBottom: Spacing.space6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space5,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  listItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  listItemLeft: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    marginStart: Spacing.space2,
  },
  listItemText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 15.5,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  listItemTextSelected: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  listItemSubText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'ltr',
    textAlign: 'left',
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  radioCircleSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.space8,
    gap: Spacing.space2,
  },
  emptyText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
})
