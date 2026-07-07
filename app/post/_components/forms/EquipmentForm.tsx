import React, { useState, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Modal, FlatList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { usePostStore } from '../../../../src/store/postStore'
import { Colors } from '../../../../src/constants/colors'
import { Spacing } from '../../../../src/constants/spacing'
import { Radius } from '../../../../src/constants/radius'

// Equipment constants
const EQUIPMENT_LISTING_TYPES = [
  { value: 'EQUIPMENT_SALE', label: 'للبيع' },
  { value: 'EQUIPMENT_RENT', label: 'للإيجار' },
]

const EQUIPMENT_CONDITIONS = [
  { value: 'NEW', label: 'جديدة' },
  { value: 'USED', label: 'مستعملة' },
  { value: 'LIKE_NEW', label: 'شبه جديدة' },
  { value: 'REFURBISHED', label: 'مجددة' },
]

const EQUIPMENT_CATEGORIES = [
  { value: 'EXCAVATOR', label: 'حفار', icon: 'construct' },
  { value: 'BULLDOZER', label: 'جرافة', icon: 'layers' },
  { value: 'CRANE', label: 'رافعة', icon: 'arrow-up' },
  { value: 'LOADER', label: 'لودر', icon: 'cube' },
  { value: 'BACKHOE', label: 'حفار خلفي', icon: 'git-merge' },
  { value: 'GRADER', label: 'ممهدة', icon: 'remove' },
  { value: 'COMPACTOR', label: 'مدحلة', icon: 'disc' },
  { value: 'TRACTOR', label: 'جرار', icon: 'car' },
  { value: 'DUMP_TRUCK', label: 'شاحنة تفريغ', icon: 'bus' },
  { value: 'FORKLIFT', label: 'رافعة شوكية', icon: 'arrow-up-circle' },
  { value: 'CONCRETE_MIXER', label: 'خلاطة خرسانة', icon: 'sync' },
  { value: 'PAVER', label: 'رصافة', icon: 'grid' },
  { value: 'TRENCHER', label: 'حفار خنادق', icon: 'git-branch' },
  { value: 'SKID_STEER', label: 'جرافة صغيرة', icon: 'resize' },
  { value: 'OTHER', label: 'أخرى', icon: 'ellipsis-horizontal' },
]

export function EquipmentForm() {
  const { title, description, price, isPriceNegotiable, details, set, setDetail } = usePostStore()

  // Details extraction
  const {
    listingType = 'EQUIPMENT_SALE',
    equipmentType = '',
    condition = '',
    make = '',
    year = '',
    hoursUsed = '',
    dailyPrice = '',
    monthlyPrice = '',
    budgetMax = '',
    rentalDuration = '',
    withOperator = false,
    deliveryAvailable = false,
  } = details

  const [focusedField, setFocusedField] = useState('')
  
  const [selectModal, setSelectModal] = useState<{
    visible: boolean;
    title: string;
    items: { label: string; value: string; icon?: string }[];
    onSelect: (val: string) => void;
  }>({ visible: false, title: '', items: [], onSelect: () => {} })

  const [modalSearch, setModalSearch] = useState('')

  const filteredModalItems = useMemo(() => {
    if (!modalSearch) return selectModal.items
    return selectModal.items.filter(i => i.label.toLowerCase().includes(modalSearch.toLowerCase()))
  }, [modalSearch, selectModal.items])

  React.useEffect(() => {
    if (!selectModal.visible) setModalSearch('')
  }, [selectModal.visible])

  const yearOptions = useMemo(() => {
    const years = []
    for (let y = 2026; y >= 1990; y--) years.push({ label: String(y), value: String(y) })
    return years
  }, [])

  const openEquipmentTypeModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'اختر نوع المعدة',
      items: EQUIPMENT_CATEGORIES,
      onSelect: (val) => setDetail('equipmentType', val)
    })
  }

  const openYearModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectModal({
      visible: true,
      title: 'سنة الصنع',
      items: yearOptions,
      onSelect: (val) => setDetail('year', val)
    })
  }

  const equipmentTypeLabel = EQUIPMENT_CATEGORIES.find(c => c.value === equipmentType)?.label || ''

  return (
    <View style={s.container}>
      {/* Basic Info */}
      <View style={s.card}>
        <Text style={s.cardTitle}>المعلومات الأساسية</Text>

        <Text style={s.label}>نوع الإعلان *</Text>
        <View style={s.chipRow}>
          {EQUIPMENT_LISTING_TYPES.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.chip, listingType === opt.value && s.chipActive]}
              onPress={() => setDetail('listingType', opt.value)}
            >
              <Text style={[s.chipTxt, listingType === opt.value && s.chipTxtActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>عنوان الإعلان</Text>
        <TextInput
          style={[s.textInput, focusedField === 'title' && s.textInputFocused]}
          placeholder="مثال: حفار كاتربيلر 320 موديل 2022"
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={(v) => set({ title: v })}
          textAlign="right"
          onFocus={() => setFocusedField('title')}
          onBlur={() => setFocusedField('')}
        />

        <Text style={s.label}>الوصف</Text>
        <TextInput
          style={[s.textInput, s.textArea, focusedField === 'desc' && s.textInputFocused]}
          placeholder="اكتب تفاصيل إضافية عن حالة المعدة وتاريخ الصيانة..."
          placeholderTextColor={Colors.textMuted}
          value={description}
          onChangeText={(v) => set({ description: v })}
          textAlign="right"
          multiline
          textAlignVertical="top"
          onFocus={() => setFocusedField('desc')}
          onBlur={() => setFocusedField('')}
        />

        <Text style={s.label}>الحالة *</Text>
        <View style={s.chipRow}>
          {EQUIPMENT_CONDITIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.chip, condition === opt.value && s.chipActive]}
              onPress={() => setDetail('condition', opt.value)}
            >
              <Text style={[s.chipTxt, condition === opt.value && s.chipTxtActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>فئة المعدة *</Text>
        <TouchableOpacity style={s.selectWrap} onPress={openEquipmentTypeModal}>
          <Text style={[s.selectText, !equipmentType && s.placeholder]} numberOfLines={1}>
            {equipmentTypeLabel || 'اختر نوع المعدة'}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Technical Specs */}
      <View style={s.card}>
        <Text style={s.cardTitle}>المواصفات الفنية</Text>

        <Text style={s.label}>الماركة (اختياري)</Text>
        <TextInput
          style={[s.textInput, focusedField === 'make' && s.textInputFocused]}
          placeholder="مثال: كاتربيلر، كوماتسو"
          placeholderTextColor={Colors.textMuted}
          value={make != null ? String(make) : ''}
          onChangeText={v => setDetail('make', v)}
          textAlign="right"
          onFocus={() => setFocusedField('make')}
          onBlur={() => setFocusedField('')}
        />

        <View style={s.rowFields}>
          <View style={s.flex1}>
            <Text style={s.label}>سنة الصنع</Text>
            <TouchableOpacity style={s.selectWrap} onPress={openYearModal}>
              <Text style={[s.selectText, !year && s.placeholder]}>{year || 'اختر السنة'}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={s.flex1}>
            <Text style={s.label}>ساعات العمل</Text>
            <TextInput
              style={[s.textInput, focusedField === 'hoursUsed' && s.textInputFocused]}
              placeholder="مثال: 5000"
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              value={hoursUsed != null ? String(hoursUsed) : ''}
              onChangeText={v => setDetail('hoursUsed', v)}
              textAlign="right"
              onFocus={() => setFocusedField('hoursUsed')}
              onBlur={() => setFocusedField('')}
            />
          </View>
        </View>
      </View>

      {/* Price */}
      <View style={s.card}>
        <Text style={s.cardTitle}>السعر</Text>

        {listingType === 'EQUIPMENT_SALE' ? (
          <>
            <Text style={s.label}>سعر البيع (ر.ع)</Text>
            <View style={[s.priceWrap, focusedField === 'price' && s.textInputFocused]}>
              <TextInput
                style={s.priceInput}
                placeholder="مثال: 25000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                textAlign="right"
                value={price}
                onChangeText={(v) => set({ price: v })}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField('')}
              />
              <Text style={s.currencyTxt}>ر.ع</Text>
            </View>
            <TouchableOpacity style={s.negotiableRow} onPress={() => set({ isPriceNegotiable: !isPriceNegotiable })}>
              <View style={[s.checkbox, isPriceNegotiable && s.checkboxActive]}>
                {isPriceNegotiable && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <Text style={s.negotiableTxt}>السعر قابل للتفاوض</Text>
            </TouchableOpacity>
          </>
        ) : listingType === 'EQUIPMENT_RENT' ? (
          <>
            <View style={s.rowFields}>
              <View style={s.flex1}>
                <Text style={s.label}>الإيجار اليومي</Text>
                <TextInput
                  style={[s.textInput, focusedField === 'dailyPrice' && s.textInputFocused]}
                  placeholder="مثال: 50"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={dailyPrice != null ? String(dailyPrice) : ''}
                  onChangeText={v => setDetail('dailyPrice', v)}
                  textAlign="right"
                  onFocus={() => setFocusedField('dailyPrice')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
              <View style={s.flex1}>
                <Text style={s.label}>الإيجار الشهري</Text>
                <TextInput
                  style={[s.textInput, focusedField === 'monthlyPrice' && s.textInputFocused]}
                  placeholder="مثال: 1200"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={monthlyPrice != null ? String(monthlyPrice) : ''}
                  onChangeText={v => setDetail('monthlyPrice', v)}
                  textAlign="right"
                  onFocus={() => setFocusedField('monthlyPrice')}
                  onBlur={() => setFocusedField('')}
                />
              </View>
            </View>
          </>
        ) : null}
      </View>

      {/* Extra Options */}
      <View style={s.card}>
        <Text style={s.cardTitle}>خيارات إضافية</Text>

        <View style={{ gap: Spacing.space3 }}>
          <TouchableOpacity style={s.negotiableRow} onPress={() => setDetail('withOperator', !withOperator)}>
            <View style={[s.checkbox, withOperator && s.checkboxActive]}>
              {withOperator && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={s.negotiableTxt}>مع مشغل</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.negotiableRow} onPress={() => setDetail('deliveryAvailable', !deliveryAvailable)}>
            <View style={[s.checkbox, deliveryAvailable && s.checkboxActive]}>
              {deliveryAvailable && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <Text style={s.negotiableTxt}>التوصيل متاح</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Select Modal */}
      <Modal visible={selectModal.visible} animationType="slide" transparent onRequestClose={() => setSelectModal({ ...selectModal, visible: false })}>
        <View style={s.modalOverlay}>
          {selectModal.visible && (
            <View style={s.modalSheet}>
              <View style={s.modalHandle} />
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{selectModal.title}</Text>
                <TouchableOpacity onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  setSelectModal({ ...selectModal, visible: false })
                }}>
                  <Ionicons name="close-circle" size={28} color={'#E5E7EB'} />
                </TouchableOpacity>
              </View>

              {selectModal.items.length > 10 && (
                <View style={s.modalSearchWrap}>
                  <Ionicons name="search" size={20} color={Colors.textMuted} />
                  <TextInput
                    style={s.modalSearchInput}
                    placeholder="ابحث هنا..."
                    placeholderTextColor={Colors.textMuted}
                    value={modalSearch}
                    onChangeText={setModalSearch}
                    textAlign="right"
                  />
                </View>
              )}

              <FlatList
                data={filteredModalItems}
                keyExtractor={(item) => item.value}
                contentContainerStyle={{ paddingBottom: Spacing.space6 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[s.selectItem, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 12 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                      selectModal.onSelect(item.value)
                      setSelectModal({ ...selectModal, visible: false })
                    }}
                  >
                    {(item as any).icon && (
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFBEB', alignItems: 'center', justifyContent: 'center', marginLeft: 12 }}>
                        <Ionicons name={(item as any).icon} size={18} color="#D97706" />
                      </View>
                    )}
                    <Text style={s.selectItemTxt}>{item.label}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                  <View style={{ padding: Spacing.space6, alignItems: 'center' }}>
                    <Text style={{ fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, color: Colors.textMuted }}>لا توجد نتائج مطابقة</Text>
                  </View>
                )}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { paddingBottom: Spacing.space8 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.space6,
    marginBottom: Spacing.space6,
    borderWidth: 1, borderColor: '#F3F4F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  cardTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 17, color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space4 },
  label: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text, writingDirection: 'rtl', marginBottom: Spacing.space2, marginTop: Spacing.space4 },
  textInput: { height: 52, borderRadius: 14, paddingHorizontal: Spacing.space4, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text, backgroundColor: '#F8F9FA', textAlign: 'right', borderWidth: 1.5, borderColor: '#E5E7EB' },
  textInputFocused: { borderColor: Colors.primary, backgroundColor: '#FFFFFF', ...Platform.select({ ios: { shadowColor: Colors.primary, shadowOffset: {width:0, height:2}, shadowOpacity:0.1, shadowRadius:4}, android: {elevation: 2} }) },
  textArea: { height: 110, paddingTop: Spacing.space4 },
  rowFields: { flexDirection: 'row', gap: Spacing.space4, marginTop: Spacing.space2 },
  flex1: { flex: 1 },
  chipRow: { flexDirection: 'row', gap: Spacing.space3, marginBottom: Spacing.space3, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, minWidth: 80, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  chipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  chipTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 13, color: Colors.text2 },
  chipTxtActive: { color: Colors.primary },
  selectWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 52, borderRadius: 14, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: Spacing.space4, marginBottom: Spacing.space2 },
  selectText: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 15, color: Colors.text, flex: 1, writingDirection: 'rtl' },
  placeholder: { color: Colors.textMuted },
  priceWrap: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E5E7EB', paddingHorizontal: Spacing.space4, marginBottom: Spacing.space4 },
  priceInput: { flex: 1, fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 20, color: Colors.primary, textAlign: 'right' },
  currencyTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.textMuted, marginStart: Spacing.space2 },
  negotiableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, alignSelf: 'flex-start' },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  negotiableTxt: { fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { width: '100%', backgroundColor: Colors.white, borderTopStartRadius: 28, borderTopEndRadius: 28, paddingHorizontal: Spacing.space5, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 44, height: 5, backgroundColor: '#E5E7EB', borderRadius: 3, alignSelf: 'center', marginTop: Spacing.space3, marginBottom: Spacing.space3 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: Spacing.space3, borderBottomWidth: 1, borderBottomColor: '#F1F3F5', marginBottom: Spacing.space4 },
  modalTitle: { fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18, color: Colors.text },
  modalSearchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 12, paddingHorizontal: Spacing.space4, height: 56, marginBottom: Spacing.space4, borderWidth: 1.5, borderColor: '#E5E7EB' },
  modalSearchInput: { flex: 1, fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14, color: Colors.text, paddingHorizontal: Spacing.space2 },
  selectItem: { paddingVertical: Spacing.space4, borderBottomWidth: 1, borderBottomColor: '#F8F9FA' },
  selectItemTxt: { fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16, color: Colors.text, writingDirection: 'rtl' },
})
export default function Dummy() { return null; }
