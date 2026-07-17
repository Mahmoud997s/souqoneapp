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
import { GOVERNORATE_OPTIONS, WILAYAT_BY_GOVERNORATE } from '../../constants/filters';
import { SORT_OPTIONS } from '../../constants/jobs';

export interface JobFilterState {
  jobType?: string
  employmentType?: string
  minSalary?: string
  maxSalary?: string
  location?: string
  city?: string
  experience?: string
  licenseType?: string
  sort?: string
}

interface JobsFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: JobFilterState;
  onApplyFilters: (filters: JobFilterState) => void;
}

const JOB_TYPES = [{ id: '', label: 'الكل' }, { id: 'HIRING', label: 'طلب سائق' }, { id: 'OFFERING', label: 'عرض خدمة' }]
const EMPLOYMENT_TYPES = [{ id: 'FULL_TIME', label: 'دوام كامل' }, { id: 'PART_TIME', label: 'دوام جزئي' }, { id: 'CONTRACT', label: 'عقد' }, { id: 'TEMPORARY', label: 'مؤقت' }]
const EXPERIENCES = [{ id: '', label: 'الكل' }, { id: '1', label: 'سنة+' }, { id: '3', label: '3 سنوات+' }, { id: '5', label: '5 سنوات+' }]
const LICENSE_TYPES = [{ id: 'LIGHT', label: 'خفيفة' }, { id: 'HEAVY', label: 'ثقيلة' }, { id: 'TRANSPORT', label: 'نقل' }, { id: 'BUS', label: 'حافلات' }, { id: 'MOTORCYCLE', label: 'دراجة' }]

export function JobsFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
}: JobsFilterBottomSheetProps) {
  const [filters, setFilters] = useState<JobFilterState>({ ...initialFilters });
  const [govOpen, setGovOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters });
      setGovOpen(false);
      setCityOpen(false);
    }
  }, [visible, initialFilters]);

  const updateFilter = (key: keyof JobFilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const cleared: JobFilterState = {};
    setFilters(cleared);
    onApplyFilters(cleared);
    onClose();
  };

  const selectedGov = GOVERNORATE_OPTIONS.find((g) => g.value === filters.location);

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
                <View style={s.dragHandle} />

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
                    {/* ترتيب النتائج */}
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>ترتيب النتائج</Text>
                      <View style={s.row}>
                        {SORT_OPTIONS.map((sort) => {
                          const isActive = filters.sort === sort.value || (!filters.sort && sort.value === 'createdAt_desc');
                          return (
                            <TouchableOpacity
                              key={sort.value}
                              style={[s.chip, isActive && s.activeChip]}
                              onPress={() => updateFilter('sort', sort.value)}
                            >
                              <Text style={[s.chipText, isActive && s.activeChipText]}>
                                {sort.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* نوع الإعلان */}
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>نوع الإعلان</Text>
                      <View style={s.row}>
                        {JOB_TYPES.map((type) => {
                          const isActive = filters.jobType === type.id || (!filters.jobType && type.id === '');
                          return (
                            <TouchableOpacity
                              key={type.id}
                              style={[s.chip, isActive && s.activeChip]}
                              onPress={() => updateFilter('jobType', type.id)}
                            >
                              <Text style={[s.chipText, isActive && s.activeChipText]}>
                                {type.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* المحافظة */}
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>المحافظة</Text>
                      <View style={s.locationRow}>
                        <TouchableOpacity
                          style={[s.locationDropdown, filters.location && s.locationDropdownActive, { flex: 1, borderTopRightRadius: Radius.lg, borderBottomRightRadius: Radius.lg }]}
                          onPress={() => { setGovOpen(!govOpen); setCityOpen(false); }}
                        >
                          <Ionicons name="location-outline" size={16} color={filters.location ? Colors.primary : Colors.textMuted} />
                          <Text style={[s.locationDropdownText, !filters.location && s.dropdownPlaceholder]} numberOfLines={1}>
                            {selectedGov ? selectedGov.labelAr : 'المحافظة'}
                          </Text>
                          <Ionicons name={govOpen ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={filters.location ? Colors.primary : Colors.textMuted} />
                        </TouchableOpacity>

                        <View style={s.inputSeparator} />

                        <TouchableOpacity
                          style={[s.locationDropdown, filters.city && s.locationDropdownActive, { flex: 1, borderTopLeftRadius: Radius.lg, borderBottomLeftRadius: Radius.lg }]}
                          onPress={() => {
                            if (filters.location) {
                              setCityOpen(!cityOpen);
                              setGovOpen(false);
                            }
                          }}
                          activeOpacity={filters.location ? 0.7 : 1}
                        >
                          <Text style={[s.locationDropdownText, !filters.city && s.dropdownPlaceholder, !filters.location && { color: Colors.textMuted }]} numberOfLines={1}>
                            {filters.city || 'الولاية'}
                          </Text>
                          <Ionicons name={cityOpen ? "chevron-up-outline" : "chevron-down-outline"} size={14} color={filters.city ? Colors.primary : Colors.textMuted} />
                        </TouchableOpacity>
                      </View>

                      {govOpen && (
                        <View style={s.dropdownList}>
                          <ScrollView style={s.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            <TouchableOpacity
                              style={[s.dropdownItem, !filters.location && s.activeDropdownItem]}
                              onPress={() => { setFilters(prev => ({ ...prev, location: '', city: '' })); setGovOpen(false); }}
                            >
                              <Text style={[s.dropdownItemText, !filters.location && s.activeDropdownItemText]}>
                                الكل
                              </Text>
                            </TouchableOpacity>
                            {GOVERNORATE_OPTIONS.map((g) => (
                              <TouchableOpacity
                                key={g.value}
                                style={[s.dropdownItem, filters.location === g.value && s.activeDropdownItem]}
                                onPress={() => { setFilters(prev => ({ ...prev, location: g.value, city: '' })); setGovOpen(false); }}
                              >
                                <Text style={[s.dropdownItemText, filters.location === g.value && s.activeDropdownItemText]}>
                                  {g.labelAr}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {cityOpen && (
                        <View style={s.dropdownList}>
                          <ScrollView style={s.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                            <TouchableOpacity
                              style={[s.dropdownItem, !filters.city && s.activeDropdownItem]}
                              onPress={() => { updateFilter('city', ''); setCityOpen(false); }}
                            >
                              <Text style={[s.dropdownItemText, !filters.city && s.activeDropdownItemText]}>
                                الكل
                              </Text>
                            </TouchableOpacity>
                            {(filters.location && WILAYAT_BY_GOVERNORATE[filters.location] ? WILAYAT_BY_GOVERNORATE[filters.location] : []).map((w) => (
                              <TouchableOpacity
                                key={w.value}
                                style={[s.dropdownItem, filters.city === w.value && s.activeDropdownItem]}
                                onPress={() => { updateFilter('city', w.value); setCityOpen(false); }}
                              >
                                <Text style={[s.dropdownItemText, filters.city === w.value && s.activeDropdownItemText]}>
                                  {w.labelAr}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    {/* نظام العمل */}
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>نظام العمل</Text>
                      <View style={s.row}>
                        {EMPLOYMENT_TYPES.map((e) => (
                          <TouchableOpacity
                            key={e.id}
                            style={[s.chip, filters.employmentType === e.id && s.activeChip]}
                            onPress={() => updateFilter('employmentType', filters.employmentType === e.id ? '' : e.id)}
                          >
                            <Text style={[s.chipText, filters.employmentType === e.id && s.activeChipText]}>
                              {e.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* الرخصة المطلوبة */}
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>الرخصة المطلوبة</Text>
                      <View style={s.row}>
                        {LICENSE_TYPES.map((e) => (
                          <TouchableOpacity
                            key={e.id}
                            style={[s.chip, filters.licenseType === e.id && s.activeChip]}
                            onPress={() => updateFilter('licenseType', filters.licenseType === e.id ? '' : e.id)}
                          >
                            <Text style={[s.chipText, filters.licenseType === e.id && s.activeChipText]}>
                              {e.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* نطاق الراتب */}
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>نطاق الراتب (ر.ع)</Text>
                      <View style={s.inputRow}>
                        <View style={s.inputContainer}>
                          <Text style={s.inputLabel}>من</Text>
                          <TextInput
                            placeholder="الحد الأدنى"
                            keyboardType="numeric"
                            style={s.input}
                            value={filters.minSalary}
                            onChangeText={(val) => updateFilter('minSalary', val.replace(/[^0-9]/g, ''))}
                          />
                        </View>
                        <View style={s.inputSeparator} />
                        <View style={s.inputContainer}>
                          <Text style={s.inputLabel}>إلى</Text>
                          <TextInput
                            placeholder="الحد الأقصى"
                            keyboardType="numeric"
                            style={s.input}
                            value={filters.maxSalary}
                            onChangeText={(val) => updateFilter('maxSalary', val.replace(/[^0-9]/g, ''))}
                          />
                        </View>
                      </View>
                    </View>

                    {/* الخبرة */}
                    <View style={s.section}>
                      <Text style={s.sectionTitle}>سنوات الخبرة</Text>
                      <View style={s.row}>
                        {EXPERIENCES.map((e) => {
                          const isActive = filters.experience === e.id || (!filters.experience && e.id === '');
                          return (
                            <TouchableOpacity
                              key={e.id}
                              style={[s.chip, isActive && s.activeChip]}
                              onPress={() => updateFilter('experience', e.id)}
                            >
                              <Text style={[s.chipText, isActive && s.activeChipText]}>
                                {e.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

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
  locationDropdownActive: {
    backgroundColor: Colors.primary + '08',
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
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space3,
    height: 48,
  },
  inputLabel: {
    fontFamily: 'Almarai_400Regular',  fontSize: 13,
    color: Colors.textMuted,
    marginEnd: Spacing.space2,
    writingDirection: 'rtl',
  },
  input: {
    flex: 1,
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    color: Colors.text,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  inputSeparator: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  footer: {
    padding: Spacing.space4,
    paddingBottom: Platform.OS === 'ios' ? Spacing.space6 : Spacing.space4,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontFamily: 'Almarai_700Bold',  fontSize: 16,
    color: Colors.white,
  },
});
