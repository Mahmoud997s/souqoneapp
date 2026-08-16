import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { SlideInDown } from 'react-native-reanimated'
import { usePostStore } from '../../../store/postStore'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import {
  SERVICE_TYPES,
  PROVIDER_TYPES,
  WORKING_DAYS_OPTIONS,
  COMMON_SPECIALIZATIONS,
} from '../../../constants/services'

export function ServiceForm() {
  const { title, description, price, details, set, setDetail } = usePostStore()

  const {
    serviceType = 'MAINTENANCE',
    providerType = 'WORKSHOP',
    providerName = '',
    isHomeService = false,
    specializations = [],
    priceFrom = '',
    priceTo = '',
    workingHoursOpen = '08:00 ص',
    workingHoursClose = '10:00 م',
    workingDays = 'طوال أيام الأسبوع (يومياً)',
    address = '',
    contactPhone = '',
    whatsapp = '',
    website = '',
  } = details || {}

  const toggleSpecialization = (spec: string) => {
    const list = Array.isArray(specializations) ? [...specializations] : []
    const idx = list.indexOf(spec)
    if (idx > -1) {
      list.splice(idx, 1)
    } else {
      list.push(spec)
    }
    setDetail('specializations', list)
  }

  const renderSectionTitle = (t: string) => <Text style={s.sectionTitle}>{t}</Text>

  const renderOptions = (field: string, options: any[], currentValue: any, style?: any) => (
    <View style={[s.optionsRow, style]}>
      {options.map((opt) => {
        const optKey = opt.id ?? opt.value ?? opt
        const optLabel = opt.label ?? opt
        const active = currentValue === optKey
        return (
          <TouchableOpacity
            key={String(optKey)}
            style={[s.optionChip, active && s.optionChipActive]}
            onPress={() => setDetail(field, optKey)}
            activeOpacity={0.7}
          >
            {opt.icon && (
              <Ionicons
                name={opt.icon}
                size={16}
                color={active ? Colors.primary : Colors.textMuted}
                style={{ marginLeft: 4 }}
              />
            )}
            <Text style={[s.optionTxt, active && s.optionTxtActive]}>{optLabel}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  const currentSuggestedSpecs = COMMON_SPECIALIZATIONS[serviceType] || COMMON_SPECIALIZATIONS.MAINTENANCE

  return (
    <Animated.View entering={SlideInDown.duration(400).springify()} style={s.root}>
      {/* ── 1. Service Type ── */}
      {renderSectionTitle('نوع الخدمة *')}
      <View style={s.typesGrid}>
        {SERVICE_TYPES.map((st) => {
          const active = serviceType === st.id
          return (
            <TouchableOpacity
              key={st.id}
              style={[s.typeCard, active && s.typeCardActive]}
              onPress={() => setDetail('serviceType', st.id)}
              activeOpacity={0.7}
            >
              <View style={[s.typeIconBox, active && s.typeIconBoxActive]}>
                <Ionicons
                  name={st.icon as any}
                  size={20}
                  color={active ? Colors.primary : Colors.textMuted}
                />
              </View>
              <Text style={[s.typeLabel, active && s.typeLabelActive]} numberOfLines={1}>
                {st.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── 2. Provider Info ── */}
      {renderSectionTitle('بيانات مقدم الخدمة *')}
      <View style={s.cardGroup}>
        <Text style={s.subLabel}>صفة مقدم الخدمة</Text>
        {renderOptions('providerType', PROVIDER_TYPES, providerType)}

        <View style={s.divider} />

        <Text style={s.subLabel}>اسم الورشة / المركز / الفني *</Text>
        <TextInput
          style={s.input}
          placeholder="مثال: ورشة الخليج لصيانة المحركات"
          value={providerName}
          onChangeText={(t) => setDetail('providerName', t)}
        />

        <View style={s.divider} />

        <TouchableOpacity
          style={s.toggleRow}
          onPress={() => setDetail('isHomeService', !isHomeService)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isHomeService ? 'checkbox' : 'square-outline'}
            size={22}
            color={isHomeService ? Colors.primary : Colors.border}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.toggleTxt}>تتوفر خدمة متنقلة / في موقع العميل</Text>
            <Text style={s.toggleSubTxt}>تفعيل هذا الخيار يوضح للعملاء إمكانية تقديم الخدمة لديهم</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ── 3. Specializations ── */}
      {renderSectionTitle('الخدمات والتخصصات المشمولة')}
      <View style={s.cardGroup}>
        <Text style={s.subLabel}>اختر الخدمات التي تقدمها</Text>
        <View style={s.specsGrid}>
          {currentSuggestedSpecs.map((spec) => {
            const active = Array.isArray(specializations) && specializations.includes(spec)
            return (
              <TouchableOpacity
                key={spec}
                style={[s.specChip, active && s.specChipActive]}
                onPress={() => toggleSpecialization(spec)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={active ? 'checkmark-circle' : 'add-circle-outline'}
                  size={16}
                  color={active ? Colors.primary : Colors.textMuted}
                />
                <Text style={[s.specTxt, active && s.specTxtActive]}>{spec}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* ── 4. Pricing ── */}
      {renderSectionTitle('الأسعار ونطاق التكلفة')}
      <View style={s.cardGroup}>
        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.subLabel}>السعر يبدأ من (ر.ع)</Text>
            <TextInput
              style={[s.input, s.priceInput]}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={String(priceFrom || price || '')}
              onChangeText={(t) => {
                setDetail('priceFrom', t)
                set({ price: t })
              }}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={s.flex1}>
            <Text style={s.subLabel}>إلى (ر.ع - اختياري)</Text>
            <TextInput
              style={[s.input, s.priceInput]}
              placeholder="اختياري"
              keyboardType="decimal-pad"
              value={String(priceTo || '')}
              onChangeText={(t) => setDetail('priceTo', t)}
            />
          </View>
        </View>
        <Text style={s.hintTxt}>يمكنك ترك خانة "إلى" فارغة في حال كان السعر يبدأ من قيمة محددة أو ثابت.</Text>
      </View>

      {/* ── 5. Working Hours & Days ── */}
      {renderSectionTitle('أوقات وأيام العمل')}
      <View style={s.cardGroup}>
        <Text style={s.subLabel}>أيام العمل</Text>
        {renderOptions(
          'workingDays',
          WORKING_DAYS_OPTIONS.map((d) => ({ id: d, label: d })),
          typeof workingDays === 'string' ? workingDays : (workingDays?.[0] || WORKING_DAYS_OPTIONS[0])
        )}

        <View style={s.divider} />

        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.subLabel}>من الساعة</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 08:00 ص"
              value={workingHoursOpen}
              onChangeText={(t) => setDetail('workingHoursOpen', t)}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={s.flex1}>
            <Text style={s.subLabel}>إلى الساعة</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 10:00 م"
              value={workingHoursClose}
              onChangeText={(t) => setDetail('workingHoursClose', t)}
            />
          </View>
        </View>
      </View>

      {/* ── 6. Contact and Address ── */}
      {renderSectionTitle('بيانات الاتصال والعنوان')}
      <View style={s.cardGroup}>
        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.subLabel}>رقم الاتصال</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 91234567"
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={(t) => setDetail('contactPhone', t)}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={s.flex1}>
            <Text style={s.subLabel}>رقم الواتساب</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 91234567"
              keyboardType="phone-pad"
              value={whatsapp}
              onChangeText={(t) => setDetail('whatsapp', t)}
            />
          </View>
        </View>

        <View style={{ marginTop: Spacing.space3 }}>
          <Text style={s.subLabel}>العنوان أو الشارع (اختياري)</Text>
          <TextInput
            style={s.input}
            placeholder="مثال: المعبيلة الصناعية - شارع رقم 8"
            value={address}
            onChangeText={(t) => setDetail('address', t)}
          />
        </View>

        <View style={{ marginTop: Spacing.space3 }}>
          <Text style={s.subLabel}>الموقع الإلكتروني / إنستغرام (اختياري)</Text>
          <TextInput
            style={s.input}
            placeholder="مثال: @workshop_om"
            value={website}
            onChangeText={(t) => setDetail('website', t)}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* ── 7. Title & Description ── */}
      {renderSectionTitle('عنوان الإعلان والوصف *')}
      <View style={s.inputGroup}>
        <Text style={s.subLabel}>عنوان الإعلان *</Text>
        <TextInput
          style={[s.input, s.inputTitle]}
          placeholder="مثال: فحص وبرمجة كمبيوتر شامل لكافة السيارات الألمانية واليابانية"
          value={title}
          onChangeText={(t) => set({ title: t })}
        />
      </View>

      <View style={s.inputGroup}>
        <Text style={s.subLabel}>الوصف وتفاصيل الخدمة *</Text>
        <TextInput
          style={[s.input, s.inputDesc]}
          placeholder="اشرح بالتفصيل مميزات الخدمة، المعدات المستخدمة، فترات الضمان، وأي عروض خاصة..."
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={(t) => set({ description: t })}
        />
      </View>

      <View style={{ height: 60 }} />
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: { padding: 0 },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 18,
    color: Colors.text,
    marginBottom: 6,
    marginTop: 10,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  subLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
    marginBottom: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  typeCard: {
    width: '31.8%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  typeIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  typeIconBoxActive: {
    backgroundColor: '#DBEAFE',
  },
  typeLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  typeLabelActive: {
    color: Colors.primary,
  },
  cardGroup: {
    backgroundColor: Colors.white,
    padding: Spacing.space3,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  optionChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  optionTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text2,
  },
  optionTxtActive: {
    color: Colors.primary,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 34,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.inputBg,
  },
  specChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  specTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text2,
  },
  specTxtActive: {
    color: Colors.primary,
  },
  inputGroup: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    minHeight: 44,
  },
  priceInput: {
    fontSize: 16,
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.primary,
  },
  hintTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  inputTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    backgroundColor: Colors.white,
  },
  inputDesc: {
    minHeight: 85,
    paddingTop: 8,
    backgroundColor: Colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  toggleTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  toggleSubTxt: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    marginTop: 2,
  },
})
