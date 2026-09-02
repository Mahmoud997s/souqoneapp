import React, { useState, useEffect } from 'react';
import { View, Switch, Text, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SERVICE_TYPES, PROVIDER_TYPES, COMMON_SPECIALIZATIONS } from '../../constants/services';
import { FilterSection } from '../ui/FilterSection';
import { DropdownSelector } from '../ui/DropdownSelector';
import { NestedSearchableList } from '../ui/NestedSearchableList';
import { FilterBottomSheetLayout } from '../ui/FilterBottomSheetLayout';
import { ServicesFilterState } from '../../types/filters.types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';
import { FilterChip } from '../ui/FilterChip';
import { AppButton } from '../ui/AppButton';
import { locationsApi } from '../../api/locations';
import { GovernorateRef, WilayaRef } from '../../types/location.types';

interface ServicesFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: ServicesFilterState;
  onApplyFilters: (filters: ServicesFilterState) => void;
  resultsCount?: number;
}

export function ServicesFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
  resultsCount,
}: ServicesFilterBottomSheetProps) {
  const [filters, setFilters] = useState<ServicesFilterState>({ ...initialFilters });
  const [activeSelector, setActiveSelector] = useState<'gov' | 'city' | 'serviceType' | 'providerType' | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [governorates, setGovernorates] = useState<GovernorateRef[]>([]);
  const [wilayas, setWilayas] = useState<WilayaRef[]>([]);

  const hasActiveFilters = Object.keys(filters).length > 0;

  useEffect(() => {
    if (visible) {
      setFilters({ ...initialFilters });
      setActiveSelector(null);
      locationsApi.getGovernorates().then(setGovernorates).catch(console.warn);
    }
  }, [visible, initialFilters]);

  useEffect(() => {
    if (filters.governorateId) {
      locationsApi.getWilayas(filters.governorateId).then(setWilayas).catch(console.warn);
    } else {
      setWilayas([]);
    }
  }, [filters.governorateId]);

  const updateFilter = (key: keyof ServicesFilterState, value: any) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (value === undefined || value === '') {
        delete next[key];
      }
      
      // If changing governorate, clear the city
      if (key === 'governorateId' && prev.governorateId !== value) {
        delete next.wilayaId;
        delete next.city;
        delete next.governorate;
      }

      // If changing service type, clear specializations
      if (key === 'serviceType' && prev.serviceType !== value) {
        delete next.specializations;
      }
      
      return next;
    });
  };

  const toggleSpecialization = (spec: string) => {
    setFilters(prev => {
      const currentSpecs = prev.specializations || [];
      let newSpecs: string[];
      if (currentSpecs.includes(spec)) {
        newSpecs = currentSpecs.filter(s => s !== spec);
      } else {
        newSpecs = [...currentSpecs, spec];
      }
      
      const next: ServicesFilterState = { ...prev, specializations: newSpecs };
      if (newSpecs.length === 0) delete next.specializations;
      return next;
    });
  };

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('صلاحية مفقودة', 'يرجى إعطاء صلاحية الموقع لاستخدام هذه الميزة.');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      updateFilter('latitude', location.coords.latitude);
      updateFilter('longitude', location.coords.longitude);
      // Optional: set radiusKm to default like 10
      updateFilter('radiusKm', 10);
      
      // Clear gov/city since we are using Near Me
      updateFilter('governorateId', undefined);
      updateFilter('wilayaId', undefined);
      updateFilter('governorate', undefined);
      updateFilter('city', undefined);

    } catch (error) {
      Alert.alert('خطأ', 'لم نتمكن من تحديد موقعك الحالي.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  // Build list data
  const govData = governorates.map(g => ({
    id: String(g.id),
    label: g.nameAr,
  }));

  const serviceTypeData = SERVICE_TYPES.map(s => ({
    id: s.id,
    label: s.label,
  }));

  const providerTypeData = PROVIDER_TYPES.map(p => ({
    id: p.id,
    label: p.label,
  }));

  const cityData = wilayas.map(city => ({
    id: String(city.id),
    label: city.nameAr,
  }));

  const currentSpecializations = filters.serviceType ? COMMON_SPECIALIZATIONS[filters.serviceType] || [] : [];

  // Dynamic active view
  let title = "الفلاتر";
  let nestedContent = null;

  if (activeSelector === 'gov') {
    title = "اختر المحافظة";
    nestedContent = (
      <NestedSearchableList
        data={govData}
        selectedValue={filters.governorateId ? String(filters.governorateId) : undefined}
        onSelect={(opt) => { 
          updateFilter('governorateId', opt ? parseInt(opt.id, 10) : undefined);
          updateFilter('governorate', opt?.label);
          setActiveSelector(null); 
        }}
        placeholder="ابحث عن محافظة..."
      />
    );
  } else if (activeSelector === 'city') {
    title = "اختر الولاية";
    nestedContent = (
      <NestedSearchableList
        data={cityData}
        selectedValue={filters.wilayaId ? String(filters.wilayaId) : undefined}
        onSelect={(opt) => { 
          updateFilter('wilayaId', opt ? parseInt(opt.id, 10) : undefined); 
          updateFilter('city', opt?.label);
          setActiveSelector(null); 
        }}
        placeholder="ابحث عن ولاية..."
      />
    );
  } else if (activeSelector === 'serviceType') {
    title = "نوع الخدمة";
    nestedContent = (
      <NestedSearchableList
        data={serviceTypeData}
        selectedValue={filters.serviceType}
        onSelect={(opt) => { updateFilter('serviceType', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  } else if (activeSelector === 'providerType') {
    title = "نوع مزود الخدمة";
    nestedContent = (
      <NestedSearchableList
        data={providerTypeData}
        selectedValue={filters.providerType}
        onSelect={(opt) => { updateFilter('providerType', opt?.id); setActiveSelector(null); }}
        hideSearch
      />
    );
  }

  const mainContent = (
    <>
      <FilterSection title="التصنيف والمزود">
        <View style={{ gap: 12, marginBottom: 8 }}>
          <DropdownSelector
            value={SERVICE_TYPES.find(c => c.id === filters.serviceType)?.label}
            placeholder="نوع الخدمة (صيانة، غسيل...)"
            onPress={() => setActiveSelector('serviceType')}
          />
          
          {currentSpecializations.length > 0 && (
            <View style={{ marginBottom: 4 }}>
              <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.space2, textAlign: 'left', writingDirection: 'rtl' }}>
                التخصصات المطلوبة
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {currentSpecializations.map((spec) => {
                  const isSelected = (filters.specializations || []).includes(spec);
                  return (
                    <FilterChip
                      key={spec}
                      label={spec}
                      isActive={isSelected}
                      onPress={() => toggleSpecialization(spec)}
                    />
                  );
                })}
              </View>
            </View>
          )}

          <DropdownSelector
            value={PROVIDER_TYPES.find(p => p.id === filters.providerType)?.label}
            placeholder="نوع مزود الخدمة (ورشة، متنقلة...)"
            onPress={() => setActiveSelector('providerType')}
          />
        </View>
      </FilterSection>

      <FilterSection title="الموقع">
        {filters.latitude && filters.longitude ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: Spacing.space3, borderRadius: Radius.md, marginBottom: 8 }}>
            <Ionicons name="location" size={20} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.primary, flex: 1, textAlign: 'left', writingDirection: 'rtl' }}>
              بحث في الأقرب لي (نطاق {filters.radiusKm || 10} كم)
            </Text>
            <AppButton 
              title="إلغاء" 
              variant="outline" 
              size="sm" 
              onPress={() => {
                updateFilter('latitude', undefined);
                updateFilter('longitude', undefined);
                updateFilter('radiusKm', undefined);
              }} 
            />
          </View>
        ) : (
          <View style={{ gap: 12, marginBottom: 8 }}>
            <AppButton
              title="البحث في الأقرب لي"
              variant="outline"
              icon={isLoadingLocation ? undefined : "location-outline"}
              onPress={handleGetLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? <ActivityIndicator size="small" color={Colors.primary} /> : null}
            </AppButton>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
              <Text style={{ fontFamily: 'Almarai_400Regular', color: Colors.textMuted, paddingHorizontal: 8 }}>أو</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: Colors.border }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <DropdownSelector
                  value={governorates.find(g => g.id === filters.governorateId)?.nameAr || filters.governorate}
                  placeholder="المحافظة"
                  onPress={() => setActiveSelector('gov')}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DropdownSelector
                  value={wilayas.find(w => w.id === filters.wilayaId)?.nameAr || filters.city}
                  placeholder="الولاية"
                  onPress={() => {
                    if (filters.governorateId || filters.governorate) {
                      setActiveSelector('city');
                    } else {
                      setActiveSelector('gov'); // Force select gov first
                    }
                  }}
                />
              </View>
            </View>
          </View>
        )}
      </FilterSection>

      <FilterSection title="خيارات إضافية">
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.space2 }}>
            <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.textMuted }}>مفتوح الآن</Text>
            <Switch
              value={filters.isOpenNow || false}
              onValueChange={(val) => updateFilter('isOpenNow', val ? true : undefined)}
              trackColor={{ false: '#e2e8f0', true: '#22c55e' }}
              thumbColor={'#ffffff'}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.space2 }}>
            <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.textMuted }}>خدمة متنقلة فقط</Text>
            <Switch
              value={filters.isHomeService || false}
              onValueChange={(val) => updateFilter('isHomeService', val ? true : undefined)}
              trackColor={{ false: '#e2e8f0', true: Colors.primary }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>
      </FilterSection>
    </>
  );

  return (
    <FilterBottomSheetLayout
      visible={visible}
      onClose={() => {
        if (activeSelector) {
          setActiveSelector(null);
        } else {
          onClose();
        }
      }}
      title={title}
      isNested={activeSelector !== null}
      onBack={() => setActiveSelector(null)}
      onApply={handleApply}
      onClear={handleReset}
      hasActiveFilters={hasActiveFilters}
      applyLabel={resultsCount !== undefined ? `عرض ${resultsCount} نتيجة` : 'تطبيق'}
    >
      {activeSelector ? nestedContent : mainContent}
    </FilterBottomSheetLayout>
  );
}
