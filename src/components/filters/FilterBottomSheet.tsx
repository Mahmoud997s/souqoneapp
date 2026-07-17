import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import {
  GOVERNORATE_OPTIONS,
  WILAYAT_BY_GOVERNORATE,
  BODY_TYPES,
  TRANSMISSION_TYPES,
  CONDITIONS,
  FUEL_TYPES,
  LISTING_TYPES,
  SORT_OPTIONS,
  FilterOption,
} from '../../constants/filters';
import { useBrands, useCarModels, useCarTrims } from '../../hooks/useCars';

interface FilterState {
  listingType?: string;
  governorate?: string;
  city?: string;
  priceMin?: string;
  priceMax?: string;
  bodyType?: string;
  transmission?: string;
  condition?: string;
  fuelType?: string;
  yearMin?: string;
  yearMax?: string;
  sortBy?: string;
  sortOrder?: string;
  makeId?: string;
  make?: string;
  modelId?: string;
  model?: string;
  trim?: string;
}

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

export function FilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
}: FilterBottomSheetProps) {
  const [filters, setFilters] = useState<FilterState>({ ...initialFilters });
  const [govOpen, setGovOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [makeOpen, setMakeOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [trimOpen, setTrimOpen] = useState(false);

  const { data: brands } = useBrands();
  const { data: models } = useCarModels(filters.makeId || '');
  const { data: trims } = useCarTrims(filters.modelId || '');

  // Sync state when initialFilters change or modal becomes visible
  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters });
    }
  }, [visible, initialFilters]);

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'governorate') next.city = undefined;
      if (key === 'makeId' || key === 'make') {
        next.modelId = undefined;
        next.model = undefined;
        next.trim = undefined;
      }
      if (key === 'modelId' || key === 'model') next.trim = undefined;
      return next;
    });
  };

  // Batch-update multiple keys atomically (avoids double-setState race)
  const updateFilters = (updates: Partial<FilterState>) => {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      if ('governorate' in updates) next.city = undefined;
      if ('makeId' in updates || 'make' in updates) {
        next.modelId = undefined;
        next.model = undefined;
        next.trim = undefined;
      }
      if ('modelId' in updates || 'model' in updates) next.trim = undefined;
      return next;
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const cleared: FilterState = {};
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={s.overlay}>
            <TouchableWithoutFeedback>
              <View style={s.sheet}>
              {/* Drag Handle Indicator */}
              <View style={s.dragHandle} />

              {/* Header */}
              <View style={s.header}>
                <TouchableOpacity onPress={handleClear} style={s.clearBtn}>
                  <Text style={s.clearText}>إعادة تعيين</Text>
                </TouchableOpacity>
                <Text style={s.title}>تصفية النتائج</Text>
                <TouchableOpacity onPress={onClose} style={s.closeBtn}>
                  <Ionicons name="close-outline" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <ScrollView 
                  showsVerticalScrollIndicator={false} 
                  contentContainerStyle={s.scrollContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* نوع الإعلان */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>نوع الإعلان</Text>
                    <View style={s.row}>
                      {LISTING_TYPES.map((type) => (
                        <TouchableOpacity
                          key={type.value}
                          style={[s.chip, filters.listingType === type.value && s.activeChip]}
                          onPress={() => updateFilter('listingType', type.value)}
                        >
                          <Text style={[s.chipText, filters.listingType === type.value && s.activeChipText]}>
                            {type.labelAr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* الترتيب */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>ترتيب النتائج</Text>
                    <View style={s.row}>
                    {/* Sort - batch update */}
                      {SORT_OPTIONS.map((sort) => {
                        const [sBy, sOrder] = sort.value.split('_');
                        const isActive = filters.sortBy === sBy && filters.sortOrder === sOrder;
                        return (
                          <TouchableOpacity
                            key={sort.value}
                            style={[s.chip, isActive && s.activeChip]}
                            onPress={() => updateFilters({ sortBy: sBy, sortOrder: sOrder })}
                          >
                            <Text style={[s.chipText, isActive && s.activeChipText]}>
                              {sort.labelAr}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* السيارة: الماركة + النوع */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>السيارة</Text>

                    {/* Row 1: الماركة | النوع */}
                    <View style={s.locationRow}>
                      <TouchableOpacity
                        style={[s.locationDropdown, s.locationDropdownLeft, filters.make && s.locationDropdownActive]}
                        onPress={() => { setMakeOpen(!makeOpen); setModelOpen(false); setTrimOpen(false); }}
                      >
                        <Ionicons name="car-outline" size={16} color={filters.make ? Colors.primary : Colors.textMuted} />
                        <Text style={[s.locationDropdownText, !filters.make && s.dropdownPlaceholder]} numberOfLines={1}>
                          {filters.make || 'الماركة'}
                        </Text>
                        <Ionicons name={makeOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={filters.make ? Colors.primary : Colors.textMuted} />
                      </TouchableOpacity>

                      <View style={s.locationSeparator} />

                      <TouchableOpacity
                        style={[s.locationDropdown, s.locationDropdownRight, filters.model && s.locationDropdownActive]}
                        onPress={() => { setModelOpen(!modelOpen); setMakeOpen(false); setTrimOpen(false); }}
                      >
                        <Ionicons name="car-sport-outline" size={16} color={filters.model ? Colors.primary : Colors.textMuted} />
                        <Text style={[s.locationDropdownText, !filters.model && s.dropdownPlaceholder]} numberOfLines={1}>
                          {filters.model || 'النوع'}
                        </Text>
                        <Ionicons name={modelOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={14} color={filters.model ? Colors.primary : Colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    {/* Make list - rendered outside locationRow to avoid clipping */}
                    {makeOpen && brands && brands.length > 0 && (
                      <View style={s.dropdownList}>
                        <ScrollView style={s.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {brands.map((b) => (
                            <TouchableOpacity
                              key={b.id}
                              style={[s.dropdownItem, filters.makeId === b.id && s.activeDropdownItem]}
                              onPress={() => { updateFilters({ makeId: b.id, make: b.nameAr || b.name }); setMakeOpen(false); }}
                            >
                              <Text style={[s.dropdownItemText, filters.makeId === b.id && s.activeDropdownItemText]}>
                                {b.nameAr || b.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {makeOpen && brands && brands.length === 0 && (
                      <View style={s.dropdownList}>
                        <Text style={s.dropdownEmpty}>لا توجد ماركات</Text>
                      </View>
                    )}

                    {/* Model list - rendered outside locationRow to avoid clipping */}
                    {modelOpen && !filters.makeId && (
                      <View style={s.dropdownList}>
                        <Text style={s.dropdownEmpty}>اختر الماركة أولاً</Text>
                      </View>
                    )}
                    {modelOpen && filters.makeId && models && models.length > 0 && (
                      <View style={s.dropdownList}>
                        <ScrollView style={s.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {models.map((m) => (
                            <TouchableOpacity
                              key={m.id}
                              style={[s.dropdownItem, filters.modelId === m.id && s.activeDropdownItem]}
                              onPress={() => { updateFilters({ modelId: m.id, model: m.nameAr || m.name }); setModelOpen(false); }}
                            >
                              <Text style={[s.dropdownItemText, filters.modelId === m.id && s.activeDropdownItemText]}>
                                {m.nameAr || m.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                    {modelOpen && filters.makeId && models && models.length === 0 && (
                      <View style={s.dropdownList}>
                        <Text style={s.dropdownEmpty}>لا توجد موديلات لهذه الماركة</Text>
                      </View>
                    )}

                    {/* Row 2: الفئة | السنة — always visible */}
                    <View style={[s.locationRow, { marginTop: Spacing.space2 }]}>
                      {/* الفئة */}
                      <TouchableOpacity
                        style={[
                          s.locationDropdown,
                          s.locationDropdownLeft,
                          filters.trim && s.locationDropdownActive,
                          !filters.modelId && s.locationDropdownDisabled,
                        ]}
                        onPress={() => {
                          if (!filters.modelId) return;
                          setTrimOpen(!trimOpen);
                          setMakeOpen(false);
                          setModelOpen(false);
                        }}
                      >
                        <Ionicons
                          name="list-outline"
                          size={16}
                          color={filters.trim ? Colors.primary : Colors.textMuted}
                        />
                        <Text
                          style={[
                            s.locationDropdownText,
                            !filters.trim && s.dropdownPlaceholder,
                          ]}
                          numberOfLines={1}
                        >
                          {filters.trim
                            ? filters.trim
                            : filters.modelId
                            ? (trims && trims.length > 0 ? 'الفئة' : 'لا توجد فئات')
                            : 'اختر النوع أولاً'}
                        </Text>
                        {filters.modelId && trims && trims.length > 0 && (
                          <Ionicons
                            name={trimOpen ? 'chevron-up-outline' : 'chevron-down-outline'}
                            size={14}
                            color={filters.trim ? Colors.primary : Colors.textMuted}
                          />
                        )}
                      </TouchableOpacity>

                      <View style={s.locationSeparator} />

                      {/* السنة: من - إلى */}
                      <View style={[s.locationDropdown, s.locationDropdownRight, { gap: 4 }]}>
                        <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
                        <TextInput
                          placeholder="من"
                          keyboardType="numeric"
                          maxLength={4}
                          style={s.yearInput}
                          value={filters.yearMin}
                          onChangeText={(val) => updateFilter('yearMin', val)}
                        />
                        <Text style={s.yearDash}>-</Text>
                        <TextInput
                          placeholder="إلى"
                          keyboardType="numeric"
                          maxLength={4}
                          style={s.yearInput}
                          value={filters.yearMax}
                          onChangeText={(val) => updateFilter('yearMax', val)}
                        />
                      </View>
                    </View>

                    {/* Trim list */}
                    {trimOpen && trims && trims.length > 0 && (
                      <View style={s.dropdownList}>
                        <ScrollView style={s.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {trims.map((t) => (
                            <TouchableOpacity
                              key={t.id}
                              style={[s.dropdownItem, filters.trim === (t.nameAr || t.name) && s.activeDropdownItem]}
                              onPress={() => { updateFilter('trim', t.nameAr || t.name); setTrimOpen(false); }}
                            >
                              <Text style={[s.dropdownItemText, filters.trim === (t.nameAr || t.name) && s.activeDropdownItemText]}>
                                {t.nameAr || t.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                  </View>

                  {/* الموقع */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>الموقع</Text>

                    <View style={s.locationRow}>
                      {/* المدينة */}
                      <TouchableOpacity
                        style={[s.locationDropdown, filters.governorate && s.locationDropdownActive]}
                        onPress={() => { setGovOpen(!govOpen); setCityOpen(false); }}
                      >
                        <Ionicons name="location-outline" size={16} color={filters.governorate ? Colors.primary : Colors.textMuted} />
                        <Text style={[s.locationDropdownText, !filters.governorate && s.dropdownPlaceholder]} numberOfLines={1}>
                          {selectedGov ? selectedGov.labelAr : 'المدينة'}
                        </Text>
                        <Ionicons name="chevron-down-outline" size={14} color={filters.governorate ? Colors.primary : Colors.textMuted} />
                      </TouchableOpacity>

                      <View style={s.locationSeparator} />

                      {/* الولاية */}
                      <TouchableOpacity
                        style={[s.locationDropdown, filters.city && s.locationDropdownActive]}
                        onPress={() => { setCityOpen(!cityOpen); setGovOpen(false); }}
                      >
                        <Ionicons name="map-outline" size={16} color={filters.city ? Colors.primary : Colors.textMuted} />
                        <Text style={[s.locationDropdownText, !filters.city && s.dropdownPlaceholder]} numberOfLines={1}>
                          {filters.city || 'الولاية'}
                        </Text>
                        <Ionicons name="chevron-down-outline" size={14} color={filters.city ? Colors.primary : Colors.textMuted} />
                      </TouchableOpacity>
                    </View>

                    {/* City list */}
                    {govOpen && (
                      <View style={s.dropdownList}>
                        <ScrollView style={s.dropdownScroll} nestedScrollEnabled>
                          {GOVERNORATE_OPTIONS.map((g) => (
                            <TouchableOpacity
                              key={g.value}
                              style={[s.dropdownItem, filters.governorate === g.value && s.activeDropdownItem]}
                              onPress={() => { updateFilter('governorate', g.value); setGovOpen(false); }}
                            >
                              <Text style={[s.dropdownItemText, filters.governorate === g.value && s.activeDropdownItemText]}>
                                {g.labelAr}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}

                    {/* Wilayat list */}
                    {cityOpen && (
                      <View style={s.dropdownList}>
                        <ScrollView style={s.dropdownScroll} nestedScrollEnabled>
                          {(filters.governorate
                            ? WILAYAT_BY_GOVERNORATE[filters.governorate] || []
                            : Object.values(WILAYAT_BY_GOVERNORATE).flat()
                          ).map((c) => (
                            <TouchableOpacity
                              key={c.value}
                              style={[s.dropdownItem, filters.city === c.value && s.activeDropdownItem]}
                              onPress={() => { updateFilter('city', c.value); setCityOpen(false); }}
                            >
                              <Text style={[s.dropdownItemText, filters.city === c.value && s.activeDropdownItemText]}>
                                {c.labelAr}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>



                  {/* نطاق السعر */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>نطاق السعر (ر.ع)</Text>
                    <View style={s.inputRow}>
                      <View style={s.inputContainer}>
                        <Text style={s.inputLabel}>من</Text>
                        <TextInput
                          placeholder="الحد الأدنى"
                          keyboardType="numeric"
                          style={s.input}
                          value={filters.priceMin}
                          onChangeText={(val) => updateFilter('priceMin', val.replace(/[^0-9]/g, ''))}
                        />
                      </View>
                      <View style={s.inputSeparator} />
                      <View style={s.inputContainer}>
                        <Text style={s.inputLabel}>إلى</Text>
                        <TextInput
                          placeholder="الحد الأقصى"
                          keyboardType="numeric"
                          style={s.input}
                          value={filters.priceMax}
                          onChangeText={(val) => updateFilter('priceMax', val.replace(/[^0-9]/g, ''))}
                        />
                      </View>
                    </View>
                  </View>

                  {/* نوع الهيكل */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>نوع الهيكل</Text>
                    <View style={[s.row, { flexWrap: 'wrap' }]}>
                      {BODY_TYPES.map((body) => (
                        <TouchableOpacity
                          key={body.value}
                          style={[s.chip, filters.bodyType === body.value && s.activeChip]}
                          onPress={() => updateFilter('bodyType', body.value)}
                        >
                          <Text style={[s.chipText, filters.bodyType === body.value && s.activeChipText]}>
                            {body.labelAr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* ناقل الحركة */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>ناقل الحركة</Text>
                    <View style={s.row}>
                      {TRANSMISSION_TYPES.map((trans) => (
                        <TouchableOpacity
                          key={trans.value}
                          style={[s.chip, filters.transmission === trans.value && s.activeChip]}
                          onPress={() => updateFilter('transmission', trans.value)}
                        >
                          <Text style={[s.chipText, filters.transmission === trans.value && s.activeChipText]}>
                            {trans.labelAr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* حالة السيارة */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>حالة السيارة</Text>
                    <View style={s.row}>
                      {CONDITIONS.map((cond) => (
                        <TouchableOpacity
                          key={cond.value}
                          style={[s.chip, filters.condition === cond.value && s.activeChip]}
                          onPress={() => updateFilter('condition', cond.value)}
                        >
                          <Text style={[s.chipText, filters.condition === cond.value && s.activeChipText]}>
                            {cond.labelAr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* نوع الوقود */}
                  <View style={s.section}>
                    <Text style={s.sectionTitle}>نوع الوقود</Text>
                    <View style={[s.row, { flexWrap: 'wrap' }]}>
                      {FUEL_TYPES.map((fuel) => (
                        <TouchableOpacity
                          key={fuel.value}
                          style={[s.chip, filters.fuelType === fuel.value && s.activeChip]}
                          onPress={() => updateFilter('fuelType', fuel.value)}
                        >
                          <Text style={[s.chipText, filters.fuelType === fuel.value && s.activeChipText]}>
                            {fuel.labelAr}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* سنة الصنع (when no makeId - standalone) */}
                  {!filters.makeId && (
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>سنة الصنع</Text>
                      <View style={s.locationRow}>
                        <View style={[s.locationDropdown, { gap: 4 }]}>
                          <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
                          <Text style={s.inputLabel}>من</Text>
                          <TextInput
                            placeholder="2010"
                            keyboardType="numeric"
                            maxLength={4}
                            style={s.yearInput}
                            value={filters.yearMin}
                            onChangeText={(val) => updateFilter('yearMin', val.replace(/[^0-9]/g, ''))}
                          />
                        </View>
                        <View style={s.locationSeparator} />
                        <View style={[s.locationDropdown, { gap: 4 }]}>
                          <Ionicons name="calendar-outline" size={16} color={Colors.textMuted} />
                          <Text style={s.inputLabel}>إلى</Text>
                          <TextInput
                            placeholder="2025"
                            keyboardType="numeric"
                            maxLength={4}
                            style={s.yearInput}
                            value={filters.yearMax}
                            onChangeText={(val) => updateFilter('yearMax', val.replace(/[^0-9]/g, ''))}
                          />
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>

              {/* Action Buttons */}
              <View style={s.footer}>
                <TouchableOpacity style={s.applyBtn} onPress={handleApply}>
                  <Text style={s.applyBtnText}>تطبيق الفلاتر</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '85%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.space2,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    alignSelf: 'center',
    marginBottom: Spacing.space2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontFamily: 'Almarai_700Bold',  fontSize: 18,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  clearBtn: {
    padding: Spacing.space1,
  },
  clearText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.error || '#d9534f',
    writingDirection: 'rtl',
  },
  closeBtn: {
    padding: Spacing.space1,
  },
  scrollContent: {
    padding: Spacing.space4,
    paddingBottom: 40,
  },
  section: {
    marginBottom: Spacing.space4,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 14,
    color: Colors.text,
    marginBottom: Spacing.space2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.space2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    // NO overflow:hidden — it clips the dropdown list
  },
  locationDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space3,
    backgroundColor: Colors.white,
  },
  locationDropdownLeft: {
    borderTopStartRadius: Radius.lg,
    borderBottomStartRadius: Radius.lg,
  },
  locationDropdownRight: {
    borderTopEndRadius: Radius.lg,
    borderBottomEndRadius: Radius.lg,
  },
  locationDropdownActive: {
    backgroundColor: Colors.primary + '08',
  },
  locationDropdownDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  dropdownEmpty: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.space3,
    writingDirection: 'rtl',
  },
  locationDropdownText: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  locationSeparator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  chip: {
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space2,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space1,
  },
  activeChip: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  chipText: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
  activeChipText: {
    fontFamily: 'Almarai_700Bold',  color: Colors.primary,
    writingDirection: 'rtl',
  },
  dropdown: {
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space3,
    backgroundColor: Colors.white,
  },
  dropdownText: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    flex: 1,
    marginStart: Spacing.space2,
  },
  dropdownPlaceholder: {
    color: Colors.textMuted,
  },
  dropdownList: {
    maxHeight: 180,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginTop: Spacing.space1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownScroll: {
    paddingVertical: Spacing.space1,
  },
  dropdownItem: {
    paddingVertical: Spacing.space2,
    paddingHorizontal: Spacing.space4,
  },
  activeDropdownItem: {
    backgroundColor: Colors.surface,
  },
  dropdownItemText: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  activeDropdownItemText: {
    fontFamily: 'Almarai_700Bold',  color: Colors.primary,
    writingDirection: 'rtl',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space3,
    backgroundColor: Colors.white,
    gap: Spacing.space1,
  },
  inputLabel: {
    fontFamily: 'Almarai_700Bold',  fontSize: 12,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  inputSeparator: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
  },
  yearInput: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.text,
    textAlign: 'center',
    minWidth: 36,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  yearDash: {
    fontFamily: 'Almarai_700Bold',  fontSize: 13,
    color: Colors.textMuted,
  },
  footer: {
    padding: Spacing.space4,
    borderTopWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.space4,
  },
  applyBtn: {
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 16,
    color: Colors.white,
  },
});
