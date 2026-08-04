import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { SlideInDown } from 'react-native-reanimated'
import { usePostStore } from '../../../store/postStore'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import {
  PART_CATEGORIES,
  PART_CONDITIONS,
  PART_ORIGINALITY_OPTIONS,
  POPULAR_PART_MAKES,
} from '../../../constants/parts'

export function PartForm() {
  const { title, description, price, isPriceNegotiable, details, set, setDetail } = usePostStore()

  const {
    partCategory = 'ENGINE',
    condition = 'USED',
    isOriginal = true,
    partNumber = '',
    compatibleMakes = [],
    compatibleModels = '',
    yearFrom = '',
    yearTo = '',
    contactPhone = '',
    whatsapp = '',
  } = details || {}

  const toggleMake = (makeId: string) => {
    let list = Array.isArray(compatibleMakes) ? [...compatibleMakes] : []
    if (makeId === 'all') {
      if (list.includes('all')) {
        list = []
      } else {
        list = ['all']
      }
    } else {
      list = list.filter((m) => m !== 'all')
      const idx = list.indexOf(makeId)
      if (idx > -1) {
        list.splice(idx, 1)
      } else {
        list.push(makeId)
      }
    }
    setDetail('compatibleMakes', list)
  }

  const renderSectionTitle = (t: string) => <Text style={s.sectionTitle}>{t}</Text>

  const renderOptions = (field: string, options: any[], currentValue: any, style?: any) => (
    <View style={[s.optionsRow, style]}>
      {options.map((opt) => {
        const optKey = opt.id ?? opt.value
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
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[s.optionTxt, active && s.optionTxtActive]}>{opt.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  return (
    <Animated.View entering={SlideInDown.duration(400).springify()} style={s.root}>
      {/* ── 1. Part Category ── */}
      {renderSectionTitle('قسم قطعة الغيار *')}
      <View style={s.categoriesGrid}>
        {PART_CATEGORIES.map((cat) => {
          const active = partCategory === cat.id
          return (
            <TouchableOpacity
              key={cat.id}
              style={[s.categoryCard, active && s.categoryCardActive]}
              onPress={() => setDetail('partCategory', cat.id)}
              activeOpacity={0.7}
            >
              <View style={[s.categoryIconBox, active && s.categoryIconBoxActive]}>
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={active ? Colors.primary : Colors.textMuted}
                />
              </View>
              <Text style={[s.categoryLabel, active && s.categoryLabelActive]} numberOfLines={1}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── 2. Condition & Originality ── */}
      {renderSectionTitle('حالة ونوع القطعة *')}
      <View style={s.cardGroup}>
        <Text style={s.subLabel}>حالة القطعة</Text>
        {renderOptions('condition', PART_CONDITIONS, condition)}

        <View style={s.divider} />

        <Text style={s.subLabel}>الأصالة</Text>
        {renderOptions('isOriginal', PART_ORIGINALITY_OPTIONS, isOriginal)}

        <View style={s.divider} />

        <Text style={s.subLabel}>رقم القطعة / Part Number (اختياري)</Text>
        <TextInput
          style={s.input}
          placeholder="مثال: OEM-90919-02244"
          value={partNumber}
          onChangeText={(t) => setDetail('partNumber', t)}
          autoCapitalize="characters"
        />
      </View>

      {/* ── 3. Compatibility (Vehicle Fitment) ── */}
      {renderSectionTitle('التوافق مع السيارات')}
      <View style={s.cardGroup}>
        <Text style={s.subLabel}>الماركات المتوافقة</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.makesScroll}
          contentContainerStyle={s.makesContent}
        >
          {POPULAR_PART_MAKES.map((m) => {
            const active = Array.isArray(compatibleMakes) && compatibleMakes.includes(m.id)
            return (
              <TouchableOpacity
                key={m.id}
                style={[s.makeBtn, active && s.makeBtnActive]}
                onPress={() => toggleMake(m.id)}
                activeOpacity={0.7}
              >
                <Text style={[s.makeTxt, active && s.makeTxtActive]}>{m.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <View style={{ marginTop: Spacing.space3 }}>
          <Text style={s.subLabel}>الموديلات المتوافقة</Text>
          <TextInput
            style={s.input}
            placeholder="مثال: لاندكروزر، برادو، كامري"
            value={typeof compatibleModels === 'string' ? compatibleModels : (compatibleModels || []).join(', ')}
            onChangeText={(t) => setDetail('compatibleModels', t)}
          />
        </View>

        <View style={[s.row, { marginTop: Spacing.space3 }]}>
          <View style={s.flex1}>
            <Text style={s.subLabel}>من سنة</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 2015"
              keyboardType="number-pad"
              maxLength={4}
              value={String(yearFrom || '')}
              onChangeText={(t) => setDetail('yearFrom', t)}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={s.flex1}>
            <Text style={s.subLabel}>إلى سنة</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 2023"
              keyboardType="number-pad"
              maxLength={4}
              value={String(yearTo || '')}
              onChangeText={(t) => setDetail('yearTo', t)}
            />
          </View>
        </View>
      </View>

      {/* ── 4. Price & Details ── */}
      {renderSectionTitle('السعر والتفاصيل المالية')}
      <View style={s.cardGroup}>
        <View style={s.inputGroup}>
          <Text style={s.subLabel}>السعر (ر.ع) *</Text>
          <TextInput
            style={[s.input, s.priceInput]}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={price != null ? String(price) : ''}
            onChangeText={(t) => set({ price: t })}
          />
        </View>

        <TouchableOpacity
          style={s.toggleRow}
          onPress={() => set({ isPriceNegotiable: !isPriceNegotiable })}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPriceNegotiable ? 'checkbox' : 'square-outline'}
            size={22}
            color={isPriceNegotiable ? Colors.primary : Colors.border}
          />
          <Text style={s.toggleTxt}>السعر قابل للتفاوض</Text>
        </TouchableOpacity>
      </View>

      {/* ── 5. Contact Options ── */}
      {renderSectionTitle('أرقام التواصل (اختياري)')}
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
      </View>

      {/* ── 6. Title and Description ── */}
      {renderSectionTitle('عنوان الإعلان والوصف *')}
      <View style={s.inputGroup}>
        <Text style={s.subLabel}>عنوان الإعلان *</Text>
        <TextInput
          style={[s.input, s.inputTitle]}
          placeholder="مثال: كمبريسور مكيف وكالة أصلي لكزس ES350"
          value={title}
          onChangeText={(t) => set({ title: t })}
        />
      </View>

      <View style={s.inputGroup}>
        <Text style={s.subLabel}>الوصف وملاحظات إضافية *</Text>
        <TextInput
          style={[s.input, s.inputDesc]}
          placeholder="اكتب تفاصيل إضافية مثل: حالة القطعة، فترة الضمان إن وجدت، موقع الاستلام..."
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
    fontSize: 16,
    color: Colors.text,
    marginBottom: Spacing.space3,
    marginTop: Spacing.space4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.text,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.space2,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  categoryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  categoryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryIconBoxActive: {
    backgroundColor: '#DBEAFE',
  },
  categoryLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  categoryLabelActive: {
    color: Colors.primary,
  },
  cardGroup: {
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: Spacing.space3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: Spacing.space3,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  optionChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  optionTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.textMuted,
  },
  optionTxtActive: {
    color: Colors.primary,
  },
  makesScroll: {
    flexDirection: 'row',
  },
  makesContent: {
    gap: 8,
    paddingVertical: 4,
  },
  makeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  makeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  makeTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
  },
  makeTxtActive: {
    color: Colors.white,
  },
  inputGroup: {
    marginBottom: Spacing.space3,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  priceInput: {
    fontSize: 16,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
  },
  inputTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    backgroundColor: Colors.white,
  },
  inputDesc: {
    minHeight: 110,
    paddingTop: 12,
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
    marginTop: Spacing.space2,
    paddingVertical: 4,
  },
  toggleTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.text,
    writingDirection: 'rtl',
  },
})
