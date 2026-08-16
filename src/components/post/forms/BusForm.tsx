import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { SlideInDown } from 'react-native-reanimated'
import { usePostStore } from '../../../store/postStore'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import { BUS_LISTING_TYPES, BUS_TYPES, BUS_MAKES, BUS_FEATURES, BUS_CONTRACT_TYPES } from '../../../constants/buses'
import { CONDITION_TYPES } from '../../../constants/cars'

export function BusForm() {
  const { title, description, price, isPriceNegotiable, details, set, setDetail } = usePostStore()

  const {
    busListingType = 'BUS_SALE',
    busType = 'MINI_BUS',
    make = '',
    model = '',
    year = '',
    capacity = '',
    condition = 'USED',
    transmission = 'MANUAL',
    fuelType = 'DIESEL',
    mileage = '',
    plateNumber = '',
    features = [],
    dailyPrice = '',
    monthlyPrice = '',
    withDriver = false,
    minRentalDays = '',
    contractType = 'COMPANY',
    contractClient = '',
    contractMonthly = '',
    contractDuration = '',
    requestPassengers = '',
    requestRoute = '',
    requestSchedule = ''
  } = details

  const toggleFeature = (key: string) => {
    const list = Array.isArray(features) ? [...features] : []
    const idx = list.indexOf(key)
    if (idx > -1) list.splice(idx, 1)
    else list.push(key)
    setDetail('features', list)
  }

  const renderSectionTitle = (t: string) => (
    <Text style={s.sectionTitle}>{t}</Text>
  )

  const renderOptions = (field: string, options: any[], currentValue: string, style?: any) => (
    <View style={[s.optionsRow, style]}>
      {options.map((opt) => {
        const optKey = opt.id || opt.value
        const active = currentValue === optKey
        return (
          <TouchableOpacity
            key={optKey}
            style={[s.optionChip, active && s.optionChipActive]}
            onPress={() => setDetail(field, optKey)}
          >
            <Text style={[s.optionTxt, active && s.optionTxtActive]}>{opt.label}</Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )

  return (
    <Animated.View entering={SlideInDown.duration(400).springify()} style={s.root}>
      
      {/* ── Type ── */}
      {renderSectionTitle('نوع الإعلان')}
      {renderOptions('busListingType', BUS_LISTING_TYPES, busListingType)}

      {/* ── Bus Info ── */}
      {renderSectionTitle('تفاصيل الحافلة الأساسية')}
      <View style={s.inputGroup}>
        <Text style={s.label}>الماركة *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginBottom: 12 }}>
           {BUS_MAKES.map(m => (
             <TouchableOpacity key={m.id} style={[s.makeBtn, make === m.id && s.makeBtnActive]} onPress={() => setDetail('make', m.id)}>
               <Text style={[s.makeTxt, make === m.id && s.makeTxtActive]}>{m.label}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.label}>الموديل *</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: كوستر، هايس"
              value={model}
              onChangeText={(t) => setDetail('model', t)}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={s.flex1}>
            <Text style={s.label}>سنة الصنع *</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 2020"
              keyboardType="number-pad"
              maxLength={4}
              value={year}
              onChangeText={(t) => setDetail('year', t)}
            />
          </View>
        </View>


        <View style={s.row}>
          <View style={s.flex1}>
            <Text style={s.label}>الممشى (كم) *</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 120000"
              keyboardType="number-pad"
              value={mileage}
              onChangeText={(t) => setDetail('mileage', t)}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={s.flex1}>
            <Text style={s.label}>عدد المقاعد *</Text>
            <TextInput
              style={s.input}
              placeholder="مثال: 30"
              keyboardType="number-pad"
              value={capacity}
              onChangeText={(t) => setDetail('capacity', t)}
            />
          </View>
        </View>
        
        <View style={{ marginTop: Spacing.space4 }}>
          <Text style={s.label}>رقم اللوحة</Text>
          <TextInput
            style={s.input}
            placeholder="مثال: 1234 ص ب"
            value={plateNumber}
            onChangeText={(t) => setDetail('plateNumber', t)}
          />
        </View>
        
        <View style={{ marginTop: Spacing.space4 }}>
          <Text style={s.label}>ناقل الحركة</Text>
          {renderOptions('transmission', [
            { id: 'AUTOMATIC', label: 'أوتوماتيك' },
            { id: 'MANUAL', label: 'يدوي' }
          ], transmission, { flexWrap: 'wrap' })}
        </View>
        
        <View style={{ marginTop: Spacing.space3 }}>
          <Text style={s.label}>نوع الوقود</Text>
          {renderOptions('fuelType', [
            { id: 'DIESEL', label: 'ديزل' },
            { id: 'PETROL', label: 'بنزين' },
            { id: 'HYBRID', label: 'هجين' },
            { id: 'ELECTRIC', label: 'كهربائي' }
          ], fuelType, { flexWrap: 'wrap' })}
        </View>
      </View>

      {/* ── Bus Type ── */}
      {renderSectionTitle('فئة الحافلة')}
      {renderOptions('busType', BUS_TYPES, busType)}

      {/* ── CONDITIONAL FIELDS ── */}

      {(busListingType === 'BUS_SALE' || busListingType === 'BUS_SALE_WITH_CONTRACT') && (
        <View style={s.cardGroup}>
          {renderSectionTitle('تفاصيل البيع')}
          <View style={s.inputGroup}>
            <Text style={s.label}>حالة الحافلة</Text>
            {renderOptions('condition', CONDITION_TYPES, condition, { flexWrap: 'wrap' })}
          </View>
          <View style={s.inputGroup}>
            <Text style={s.label}>سعر البيع (ر.ع.) *</Text>
            <TextInput
              style={s.input}
              placeholder="0"
              keyboardType="numeric"
              value={price}
              onChangeText={(t) => set({ price: t })}
            />
          </View>
          <TouchableOpacity
            style={s.toggleBtn}
            onPress={() => set({ isPriceNegotiable: !isPriceNegotiable })}
          >
            <Ionicons
              name={isPriceNegotiable ? 'checkbox' : 'square-outline'}
              size={20}
              color={isPriceNegotiable ? Colors.primary : Colors.textMuted}
            />
            <Text style={s.toggleTxt}>السعر قابل للتفاوض</Text>
          </TouchableOpacity>
        </View>
      )}

      {busListingType === 'BUS_RENT' && (
        <View style={s.cardGroup}>
          {renderSectionTitle('تفاصيل الإيجار')}
          <View style={s.row}>
            <View style={s.flex1}>
              <Text style={s.label}>الإيجار اليومي</Text>
              <TextInput style={s.input} placeholder="0" keyboardType="numeric" value={dailyPrice} onChangeText={(t) => setDetail('dailyPrice', t)} />
            </View>
            <View style={{ width: 12 }} />
            <View style={s.flex1}>
              <Text style={s.label}>الإيجار الشهري</Text>
              <TextInput style={s.input} placeholder="0" keyboardType="numeric" value={monthlyPrice} onChangeText={(t) => setDetail('monthlyPrice', t)} />
            </View>
          </View>
          <TouchableOpacity style={s.toggleBtn} onPress={() => setDetail('withDriver', !withDriver)}>
            <Ionicons name={withDriver ? 'checkbox' : 'square-outline'} size={20} color={withDriver ? Colors.primary : Colors.textMuted} />
            <Text style={s.toggleTxt}>التأجير شامل السائق</Text>
          </TouchableOpacity>
        </View>
      )}

      {busListingType === 'BUS_SALE_WITH_CONTRACT' && (
        <View style={s.cardGroup}>
          {renderSectionTitle('عقد تشغيل')}
          <Text style={s.label}>نوع العقد</Text>
          {renderOptions('contractType', BUS_CONTRACT_TYPES, contractType, { flexWrap: 'wrap' })}
          
          <View style={[s.inputGroup, { marginTop: Spacing.space4 }]}>
             <Text style={s.label}>الجهة المتعاقد معها</Text>
             <TextInput style={s.input} placeholder="مثال: مدرسة مسقط الدولية" value={contractClient} onChangeText={(t) => setDetail('contractClient', t)} />
          </View>
          
          <View style={s.inputGroup}>
             <Text style={s.label}>القيمة الشهرية للعقد (ر.ع.)</Text>
             <TextInput style={s.input} placeholder="مثال: 500" keyboardType="numeric" value={contractMonthly} onChangeText={(t) => setDetail('contractMonthly', t)} />
          </View>
          <View style={s.inputGroup}>
             <Text style={s.label}>مدة العقد (بالأشهر)</Text>
             <TextInput style={s.input} placeholder="مثال: 12" keyboardType="numeric" value={contractDuration} onChangeText={(t) => setDetail('contractDuration', t)} />
          </View>
        </View>
      )}



      {/* ── Features ── */}
      {renderSectionTitle('المميزات والإضافات')}
      <View style={s.featuresGrid}>
        {BUS_FEATURES.map((feat) => {
          const isActive = features.includes(feat.id)
          return (
            <TouchableOpacity
              key={feat.id}
              style={[s.featItem, isActive && s.featItemActive]}
              onPress={() => toggleFeature(feat.id)}
            >
              <Ionicons
                name={isActive ? 'checkmark-circle' : 'ellipse-outline'}
                size={18}
                color={isActive ? Colors.primary : Colors.border}
              />
              <Text style={[s.featTxt, isActive && s.featTxtActive]}>{feat.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Basic Ad Info ── */}
      {renderSectionTitle('عنوان الإعلان والوصف')}
      <View style={s.inputGroup}>
        <TextInput
          style={[s.input, s.inputTitle]}
          placeholder="مثال: باص تويوتا كوستر 30 راكب بحالة ممتازة"
          value={title}
          onChangeText={(t) => set({ title: t })}
        />
      </View>
      <View style={s.inputGroup}>
        <TextInput
          style={[s.input, s.inputDesc]}
          placeholder="تفاصيل إضافية عن الحافلة..."
          multiline
          textAlignVertical="top"
          value={description}
          onChangeText={(t) => set({ description: t })}
        />
      </View>

      <View style={{ height: 100 }} />
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: { padding: 0 },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold', fontSize: 13.5, lineHeight: 18, color: Colors.text,
    marginBottom: 6, marginTop: 10, textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  optionChip: {
    paddingHorizontal: 12, paddingVertical: 6, minHeight: 36, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.inputBg,
    alignItems: 'center', justifyContent: 'center',
  },
  optionChipActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  optionTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, lineHeight: 16, color: Colors.text2, writingDirection: 'rtl' },
  optionTxtActive: { color: Colors.primary },
  inputGroup: { marginBottom: 8 },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 12, lineHeight: 16, color: Colors.text2, marginBottom: 4, textAlign: 'left', writingDirection: 'rtl' },
  input: {
    backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, paddingHorizontal: 10, paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontFamily: 'Almarai_400Regular', fontSize: 13, lineHeight: 18, color: Colors.text, textAlign: 'right',
    writingDirection: 'rtl', minHeight: 44,
  },
  inputTitle: { fontFamily: 'Almarai_700Bold', fontSize: 13 },
  inputDesc: { minHeight: 85, paddingTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  flex1: { flex: 1 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  toggleTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, lineHeight: 16, color: Colors.text, writingDirection: 'rtl' },
  cardGroup: {
    backgroundColor: Colors.white, padding: Spacing.space3,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: '#EEF2F6',
    marginTop: 6, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md,
    backgroundColor: Colors.inputBg, borderWidth: 1.5, borderColor: Colors.border,
  },
  featItemActive: { borderColor: Colors.primary, backgroundColor: '#EFF6FF' },
  featTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, lineHeight: 15, color: Colors.text2, writingDirection: 'rtl' },
  featTxtActive: { color: Colors.primary },
  makeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.inputBg },
  makeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  makeTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.text, writingDirection: 'rtl' },
  makeTxtActive: { color: Colors.white },
})