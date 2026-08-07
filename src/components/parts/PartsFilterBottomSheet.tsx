import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import {
  GOVERNORATE_OPTIONS,
  WILAYAT_BY_GOVERNORATE,
} from '../../constants/filters';
import { PART_CATEGORIES, PART_CONDITIONS, POPULAR_PART_MAKES } from '../../constants/parts';
import { useBrands } from '../../hooks/useCars';

export interface PartsFilterState {
  category?: string;
  makeId?: string;
  make?: string;
  modelId?: string;
  model?: string;
  condition?: string;
  isOriginal?: boolean;
  governorate?: string;
  city?: string;
  priceMin?: string;
  priceMax?: string;
  priceId?: string;
  partNumber?: string;
  sortBy?: string;
  sortOrder?: string;
  isScrap?: boolean;
}

interface PartsFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: PartsFilterState;
  onApplyFilters: (filters: PartsFilterState) => void;
}

const SORT_OPTIONS = [
  { id: 'createdAt_desc', label: 'الأحدث أولاً', sortBy: 'createdAt', sortOrder: 'DESC' },
  { id: 'price_asc', label: 'الأقل سعراً', sortBy: 'price', sortOrder: 'ASC' },
  { id: 'price_desc', label: 'الأعلى سعراً', sortBy: 'price', sortOrder: 'DESC' },
];

export function PartsFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
}: PartsFilterBottomSheetProps) {
  const [filters, setFilters] = useState<PartsFilterState>({ ...initialFilters });
  const [govOpen, setGovOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);

  const { data: brands } = useBrands();

  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters });
    }
  }, [visible, initialFilters]);

  const updateFilter = (key: keyof PartsFilterState, value: any) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'governorate') next.city = undefined;
      return next;
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const cleared: PartsFilterState = {};
    setFilters(cleared);
    onApplyFilters(cleared);
    onClose();
  };

  const selectedGov = GOVERNORATE_OPTIONS.find((g) => g.value === filters.governorate);
  const availableCities = filters.governorate ? WILAYAT_BY_GOVERNORATE[filters.governorate] || [] : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={s.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View style={s.sheet}>
            {/* Drag Handle */}
            <View style={s.dragHandle} />

            {/* Header */}
            <View style={s.header}>
              <TouchableOpacity onPress={handleClear} style={s.clearBtn}>
                <Text style={s.clearText}>إعادة تعيين</Text>
              </TouchableOpacity>
              <Text style={s.title}>تصفية قطع الغيار</Text>
              <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                <Ionicons name="close-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={s.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* القسم الرئيسي */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>قسم القطعة</Text>
                <View style={s.wrapRow}>
                  {PART_CATEGORIES.map((cat) => {
                    const isSelected = filters.category === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[s.chip, isSelected && s.activeChip]}
                        onPress={() => updateFilter('category', isSelected ? undefined : cat.id)}
                      >
                        <Text style={[s.chipText, isSelected && s.activeChipText]}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* أصالة القطعة */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>الأصالة والنوع</Text>
                <View style={s.row}>
                  <TouchableOpacity
                    style={[s.chip, filters.isOriginal === true && s.activeChip]}
                    onPress={() => updateFilter('isOriginal', filters.isOriginal === true ? undefined : true)}
                  >
                    <Text style={[s.chipText, filters.isOriginal === true && s.activeChipText]}>
                      أصلي وكالة (OEM)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.chip, filters.isOriginal === false && s.activeChip]}
                    onPress={() => updateFilter('isOriginal', filters.isOriginal === false ? undefined : false)}
                  >
                    <Text style={[s.chipText, filters.isOriginal === false && s.activeChipText]}>
                      تجاري / بديل معتمد
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.chip, filters.isScrap === true && s.activeChip]}
                    onPress={() => updateFilter('isScrap', filters.isScrap === true ? undefined : true)}
                  >
                    <Text style={[s.chipText, filters.isScrap === true && s.activeChipText]}>
                      تشليح وسكراب
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* الحالة */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>حالة القطعة</Text>
                <View style={s.row}>
                  {PART_CONDITIONS.map((cond) => {
                    const isSelected = filters.condition === cond.id;
                    return (
                      <TouchableOpacity
                        key={cond.id}
                        style={[s.chip, isSelected && s.activeChip]}
                        onPress={() => updateFilter('condition', isSelected ? undefined : cond.id)}
                      >
                        <Text style={[s.chipText, isSelected && s.activeChipText]}>
                          {cond.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* الماركة المتوافقة */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>الماركة المتوافقة</Text>
                <TouchableOpacity
                  style={s.dropdownSelector}
                  onPress={() => setMakeOpen(!makeOpen)}
                >
                  <Text style={[s.selectorText, !filters.make && s.placeholderText]}>
                    {filters.make || 'اختر الماركة المتوافقة...'}
                  </Text>
                  <Ionicons name={makeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {makeOpen && (
                  <View style={s.dropdownList}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={s.dropdownScroll}>
                      <TouchableOpacity
                        style={s.dropdownOption}
                        onPress={() => {
                          updateFilter('make', undefined);
                          updateFilter('makeId', undefined);
                          setMakeOpen(false);
                        }}
                      >
                        <Text style={[s.dropdownOptionText, !filters.make && s.selectedOptionText]}>
                          الكل (أي ماركة)
                        </Text>
                      </TouchableOpacity>
                      {(brands && brands.length > 0 ? brands : POPULAR_PART_MAKES).map((b: any) => {
                        const name = b.nameAr || b.name || b.label;
                        const isSelected = filters.make === name || filters.makeId === b.id;
                        return (
                          <TouchableOpacity
                            key={b.id}
                            style={s.dropdownOption}
                            onPress={() => {
                              updateFilter('make', name);
                              updateFilter('makeId', b.id);
                              setMakeOpen(false);
                            }}
                          >
                            <Text style={[s.dropdownOptionText, isSelected && s.selectedOptionText]}>
                              {name}
                            </Text>
                            {isSelected && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* رقم القطعة (Part Number) */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>رقم القطعة (Part Number / OEM)</Text>
                <View style={s.inputContainer}>
                  <Ionicons name="barcode-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={s.input}
                    placeholder="مثال: 90915-YZZD2"
                    placeholderTextColor={Colors.textMuted}
                    value={filters.partNumber || ''}
                    onChangeText={(val) => updateFilter('partNumber', val || undefined)}
                  />
                  {filters.partNumber ? (
                    <TouchableOpacity onPress={() => updateFilter('partNumber', undefined)}>
                      <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              {/* نطاق السعر */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>السعر (ر.ع)</Text>
                <View style={s.priceRangeRow}>
                  <TextInput
                    style={s.priceInput}
                    placeholder="من"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={filters.priceMin || ''}
                    onChangeText={(val) => updateFilter('priceMin', val || undefined)}
                  />
                  <Text style={s.priceDash}>-</Text>
                  <TextInput
                    style={s.priceInput}
                    placeholder="إلى"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={filters.priceMax || ''}
                    onChangeText={(val) => updateFilter('priceMax', val || undefined)}
                  />
                </View>
              </View>

              {/* المحافظة والمدينة */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>الموقع</Text>
                <TouchableOpacity
                  style={s.dropdownSelector}
                  onPress={() => setGovOpen(!govOpen)}
                >
                  <Text style={[s.selectorText, !selectedGov && s.placeholderText]}>
                    {selectedGov ? selectedGov.labelAr : 'اختر المحافظة...'}
                  </Text>
                  <Ionicons name={govOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                </TouchableOpacity>

                {govOpen && (
                  <View style={s.dropdownList}>
                    <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={s.dropdownScroll}>
                      <TouchableOpacity
                        style={s.dropdownOption}
                        onPress={() => {
                          updateFilter('governorate', undefined);
                          setGovOpen(false);
                        }}
                      >
                        <Text style={[s.dropdownOptionText, !filters.governorate && s.selectedOptionText]}>
                          جميع المحافظات
                        </Text>
                      </TouchableOpacity>
                      {GOVERNORATE_OPTIONS.map((g) => (
                        <TouchableOpacity
                          key={g.value}
                          style={s.dropdownOption}
                          onPress={() => {
                            updateFilter('governorate', g.value);
                            setGovOpen(false);
                          }}
                        >
                          <Text style={[s.dropdownOptionText, filters.governorate === g.value && s.selectedOptionText]}>
                            {g.labelAr}
                          </Text>
                          {filters.governorate === g.value && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {filters.governorate && availableCities.length > 0 && (
                  <>
                    <TouchableOpacity
                      style={[s.dropdownSelector, { marginTop: Spacing.space2 }]}
                      onPress={() => setCityOpen(!cityOpen)}
                    >
                      <Text style={[s.selectorText, !filters.city && s.placeholderText]}>
                        {filters.city || 'اختر المدينة / الولاية...'}
                      </Text>
                      <Ionicons name={cityOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
                    </TouchableOpacity>

                    {cityOpen && (
                      <View style={s.dropdownList}>
                        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} style={s.dropdownScroll}>
                          <TouchableOpacity
                            style={s.dropdownOption}
                            onPress={() => {
                              updateFilter('city', undefined);
                              setCityOpen(false);
                            }}
                          >
                            <Text style={[s.dropdownOptionText, !filters.city && s.selectedOptionText]}>
                              جميع المدن
                            </Text>
                          </TouchableOpacity>
                          {availableCities.map((c) => (
                            <TouchableOpacity
                              key={c.value}
                              style={s.dropdownOption}
                              onPress={() => {
                                updateFilter('city', c.labelAr);
                                setCityOpen(false);
                              }}
                            >
                              <Text style={[s.dropdownOptionText, filters.city === c.labelAr && s.selectedOptionText]}>
                                {c.labelAr}
                              </Text>
                              {filters.city === c.labelAr && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* الترتيب */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>ترتيب النتائج</Text>
                <View style={s.wrapRow}>
                  {SORT_OPTIONS.map((sort) => {
                    const isSelected = filters.sortBy === sort.sortBy && filters.sortOrder === sort.sortOrder;
                    return (
                      <TouchableOpacity
                        key={sort.id}
                        style={[s.chip, isSelected && s.activeChip]}
                        onPress={() => {
                          if (isSelected) {
                            updateFilter('sortBy', undefined);
                            updateFilter('sortOrder', undefined);
                          } else {
                            updateFilter('sortBy', sort.sortBy);
                            updateFilter('sortOrder', sort.sortOrder);
                          }
                        }}
                      >
                        <Text style={[s.chipText, isSelected && s.activeChipText]}>
                          {sort.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Footer Apply Button */}
            <View style={s.footer}>
              <TouchableOpacity style={s.applyBtn} onPress={handleApply}>
                <Text style={s.applyBtnText}>تطبيق الفلتر</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  clearBtn: {
    padding: 4,
  },
  clearText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.error,
    writingDirection: 'rtl',
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    paddingVertical: Spacing.space3,
    gap: Spacing.space4,
  },
  section: {
    gap: Spacing.space2,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#475569',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  activeChipText: {
    color: Colors.white,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  selectorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholderText: {
    color: Colors.textMuted,
    fontFamily: 'Almarai_400Regular',
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    marginTop: 4,
    maxHeight: 180,
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownOptionText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  selectedOptionText: {
    color: Colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 10,
    gap: 6,
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    paddingVertical: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  priceRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  priceDash: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.textMuted,
  },
  footer: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.white,
    writingDirection: 'rtl',
  },
});
