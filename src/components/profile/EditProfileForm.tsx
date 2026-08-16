import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  I18nManager,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'

interface EditProfileFormProps {
  displayName: string
  email: string
  phone: string
  bio: string

  focusedField: string | null
  onFocusField: (field: string) => void
  onBlurField: () => void

  governorateId: number | null
  governorateName: string

  wilayaId: number | null
  wilayaName: string

  onDisplayNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onBioChange: (value: string) => void

  onGovernoratePress: () => void
  onWilayaPress: () => void
}

export function EditProfileForm({
  displayName,
  email,
  phone,
  bio,
  focusedField,
  onFocusField,
  onBlurField,
  governorateId,
  governorateName,
  wilayaId,
  wilayaName,
  onDisplayNameChange,
  onPhoneChange,
  onBioChange,
  onGovernoratePress,
  onWilayaPress,
}: EditProfileFormProps) {
  return (
    <>
      {/* ── Section 1: Basic Info ── */}
      <View style={s.sectionWrap}>
        <Text style={s.sectionHeaderTitle}>المعلومات الأساسية</Text>
        <View style={s.cardGroup}>
          {/* Display Name Field */}
          <View style={s.fieldWrapper}>
            <View style={s.fieldLabelRow}>
              <Text style={s.label}>الاسم المستعار</Text>
              <View style={s.badgeRequired}>
                <Text style={s.badgeRequiredText}>مطلوب</Text>
              </View>
            </View>
            <View style={[s.inputBox, focusedField === 'displayName' && s.inputBoxFocused]}>
              <Ionicons
                name="person-outline"
                size={18}
                color={focusedField === 'displayName' ? Colors.primary : '#64748B'}
                style={s.fieldIconStart}
              />
              <TextInput
                style={s.textInput}
                placeholder="اكتب اسمك ليظهر للآخرين"
                placeholderTextColor="#94A3B8"
                value={displayName}
                onChangeText={onDisplayNameChange}
                onFocus={() => onFocusField('displayName')}
                onBlur={onBlurField}
                textAlign="right"
              />
            </View>
          </View>

          {/* Bio Field */}
          <View style={s.fieldWrapper}>
            <View style={s.fieldLabelRow}>
              <Text style={s.label}>نبذة عنك</Text>
              <View style={s.badgeOptional}>
                <Text style={s.badgeOptionalText}>اختياري</Text>
              </View>
            </View>
            <View style={[s.inputBoxMultiline, focusedField === 'bio' && s.inputBoxFocused]}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color={focusedField === 'bio' ? Colors.primary : '#64748B'}
                style={s.fieldIconMultilineStart}
              />
              <TextInput
                style={s.textInputMultiline}
                placeholder="اكتب نبذة مختصرة عن نفسك أو نشاطك التجاري..."
                placeholderTextColor="#94A3B8"
                value={bio}
                onChangeText={onBioChange}
                onFocus={() => onFocusField('bio')}
                onBlur={onBlurField}
                multiline
                textAlign="right"
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── Section 2: Contact Info ── */}
      <View style={s.sectionWrap}>
        <Text style={s.sectionHeaderTitle}>معلومات التواصل</Text>
        <View style={s.cardGroup}>
          {/* Phone Field */}
          <View style={s.fieldWrapper}>
            <View style={s.fieldLabelRow}>
              <Text style={s.label}>رقم الهاتف</Text>
            </View>
            <View style={[s.inputBox, focusedField === 'phone' && s.inputBoxFocused]}>
              <Ionicons
                name="call-outline"
                size={18}
                color={focusedField === 'phone' ? Colors.primary : '#64748B'}
                style={[s.fieldIconStart, I18nManager.isRTL && { transform: [{ scaleX: -1 }] }]}
              />
              <TextInput
                style={[s.textInput, s.textInputLtr]}
                placeholder="مثال: 98765432"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={onPhoneChange}
                onFocus={() => onFocusField('phone')}
                onBlur={onBlurField}
                textAlign="left"
              />
            </View>
          </View>

          {/* Email Field (Read Only) */}
          <View style={s.fieldWrapper}>
            <View style={s.fieldLabelRow}>
              <Text style={s.label}>البريد الإلكتروني</Text>
              <View style={s.badgeLocked}>
                <Ionicons name="lock-closed" size={10} color="#64748B" style={{ marginEnd: 3 }} />
                <Text style={s.badgeLockedText}>ثابت</Text>
              </View>
            </View>
            <View style={[s.inputBox, s.inputBoxDisabled]}>
              <Ionicons name="mail-outline" size={18} color="#94A3B8" style={[s.fieldIconStart, I18nManager.isRTL && { transform: [{ scaleX: -1 }] }]} />
              <TextInput
                style={[s.textInput, s.textInputLtr, { color: '#64748B' }]}
                placeholder="بريدك الإلكتروني"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                value={email}
                editable={false}
                textAlign="left"
              />
            </View>
          </View>
        </View>
      </View>

      {/* ── Section 3: Location ── */}
      <View style={s.sectionWrap}>
        <Text style={s.sectionHeaderTitle}>الموقع الجغرافي</Text>
        <View style={s.cardGroup}>
          {/* Governorate Field */}
          <View style={s.fieldWrapper}>
            <View style={s.fieldLabelRow}>
              <Text style={s.label}>المحافظة</Text>
            </View>
            <TouchableOpacity
              style={[s.inputBox, governorateId !== null && s.inputBoxActive]}
              activeOpacity={0.75}
              onPress={onGovernoratePress}
            >
              <Ionicons
                name="location-outline"
                size={18}
                color={governorateId ? Colors.primary : '#64748B'}
                style={s.fieldIconStart}
              />
              <Text
                style={[s.inputTextDisplay, !governorateName && s.placeholderText]}
                numberOfLines={1}
              >
                {governorateName || 'اختر المحافظة'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={governorateId ? Colors.primary : '#94A3B8'}
                style={s.fieldIconEnd}
              />
            </TouchableOpacity>
          </View>

          {/* Wilaya Field */}
          <View style={s.fieldWrapper}>
            <View style={s.fieldLabelRow}>
              <Text style={s.label}>الولاية / المدينة</Text>
            </View>
            <TouchableOpacity
              style={[
                s.inputBox,
                !governorateId && s.inputBoxDisabled,
                wilayaId !== null && s.inputBoxActive,
              ]}
              activeOpacity={0.75}
              onPress={onWilayaPress}
              disabled={!governorateId}
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={!governorateId ? '#CBD5E1' : wilayaId ? Colors.primary : '#64748B'}
                style={s.fieldIconStart}
              />
              <Text
                style={[
                  s.inputTextDisplay,
                  !wilayaName && s.placeholderText,
                  !governorateId && { color: '#94A3B8' },
                ]}
                numberOfLines={1}
              >
                {wilayaName || 'اختر الولاية'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={!governorateId ? '#CBD5E1' : wilayaId ? Colors.primary : '#94A3B8'}
                style={s.fieldIconEnd}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  )
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

const s = StyleSheet.create({
  /* Sections & Cards */
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
    marginBottom: 7,
    paddingHorizontal: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...softShadow,
  },

  /* Form Fields */
  fieldWrapper: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  badgeRequired: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeRequiredText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: '#DC2626',
    writingDirection: 'rtl',
  },
  badgeOptional: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeOptionalText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    lineHeight: 13,
    color: '#64748B',
    writingDirection: 'rtl',
  },
  badgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLockedText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 13,
    color: '#64748B',
    writingDirection: 'rtl',
  },

  /* Input Boxes */
  inputBox: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputBoxMultiline: {
    minHeight: 88,
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputBoxFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputBoxActive: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  inputBoxDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },

  /* Field Icons */
  fieldIconStart: {
    marginEnd: 10,
  },
  fieldIconMultilineStart: {
    marginEnd: 10,
    marginTop: 2,
  },
  fieldIconEnd: {
    marginStart: 8,
  },

  /* Text Inputs */
  textInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: 0,
  },
  textInputLtr: {
    fontFamily: 'Almarai_700Bold',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  textInputMultiline: {
    flex: 1,
    minHeight: 68,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  inputTextDisplay: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  placeholderText: {
    fontFamily: 'Almarai_400Regular',
    color: '#94A3B8',
  },
})
