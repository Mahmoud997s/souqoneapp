import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { GovernorateRef, WilayaRef } from '../../types/location.types'

interface LocationPickerModalProps {
  visible: boolean
  modalType: 'governorate' | 'wilaya' | null
  governorateName: string
  searchQuery: string
  onSearchChange: (value: string) => void
  loading: boolean
  data: Array<GovernorateRef | WilayaRef>
  selectedId: number | null
  onClose: () => void
  onSelectGovernorate: (item: GovernorateRef) => void
  onSelectWilaya: (item: WilayaRef) => void
}

export function LocationPickerModal({
  visible,
  modalType,
  governorateName,
  searchQuery,
  onSearchChange,
  loading,
  data,
  selectedId,
  onClose,
  onSelectGovernorate,
  onSelectWilaya,
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[s.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={s.handleBar} />

          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalTitle}>
                {modalType === 'governorate' ? 'اختر المحافظة' : `اختر الولاية (${governorateName})`}
              </Text>
              <Text style={s.modalSubtitle}>
                {modalType === 'governorate'
                  ? 'حدد المحافظة لعرض الولايات التابعة لها'
                  : 'اختر ولايتك الحالية'}
              </Text>
            </View>
            <TouchableOpacity
              style={s.modalCloseBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={s.searchBox}>
            <Ionicons name="search" size={17} color="#94A3B8" style={{ marginEnd: 8 }} />
            <TextInput
              style={s.searchInput}
              placeholder={modalType === 'governorate' ? 'ابحث عن المحافظة...' : 'ابحث عن الولاية...'}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={onSearchChange}
              textAlign="right"
              clearButtonMode="while-editing"
            />
          </View>

          {/* List or Loading */}
          {loading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={s.loadingText}>جاري تحميل المواقع...</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.listContent}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedId
                return (
                  <TouchableOpacity
                    style={[s.listItem, isSelected && s.listItemSelected]}
                    activeOpacity={0.7}
                    onPress={() =>
                      modalType === 'governorate'
                        ? onSelectGovernorate(item as GovernorateRef)
                        : onSelectWilaya(item as WilayaRef)
                    }
                  >
                    <View style={s.listItemLeft}>
                      <View
                        style={[s.radioCircle, isSelected && s.radioCircleSelected]}
                      >
                        {isSelected && (
                          <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                        )}
                      </View>
                    </View>
                    <View style={s.listItemContent}>
                      <Text
                        style={[
                          s.listItemText,
                          isSelected && s.listItemTextSelected,
                        ]}
                      >
                        {item.nameAr}
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
                  <Ionicons name="search-outline" size={32} color="#CBD5E1" />
                  <Text style={s.emptyText}>لا توجد نتائج مطابقة</Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopStartRadius: 22,
    borderTopEndRadius: 22,
    maxHeight: '80%',
  },
  handleBar: {
    width: 36,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15.5,
    lineHeight: 21,
    color: '#1E293B',
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  modalSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#94A3B8',
    writingDirection: 'rtl',
    textAlign: 'left',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBox: {
    marginHorizontal: 14,
    marginVertical: 10,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: '#1E293B',
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
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    marginStart: 8,
  },
  listItemText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 20,
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
    fontSize: 11,
    lineHeight: 15,
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
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 18,
    color: '#94A3B8',
    writingDirection: 'rtl',
  },
})
