import React from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { useCarrierWizardStore } from '../../../store/carrierWizardStore';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { InlineError } from '../../ui/InlineError';

export default function CarrierStep1Info() {
  const { companyName, bio, contactPhone, whatsapp, setField, errors } = useCarrierWizardStore();

  return (
    <View style={s.container}>
        
        <View style={s.header}>
          <Text style={s.subtitle}>أدخل بياناتك الأساسية لنتمكن من توثيق حسابك وربطك بالعملاء.</Text>
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>اسم الشركة / الشخص *</Text>
          <TextInput
            style={[s.input, errors.companyName ? s.inputError : null]}
            placeholder="مثال: شركة النقل السريع"
            placeholderTextColor="#94a3b8"
            value={companyName}
            onChangeText={(v) => {
              setField('companyName', v);
              useCarrierWizardStore.getState().setErrors({ ...errors, companyName: '' });
            }}
          />
          <InlineError message={errors.companyName} />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>نبذة تعريفية *</Text>
          <TextInput
            style={[s.input, s.textArea, errors.bio ? s.inputError : null]}
            placeholder="اكتب نبذة عن خدماتك وخبرتك في مجال النقل..."
            placeholderTextColor="#94a3b8"
            value={bio}
            onChangeText={(v) => {
              setField('bio', v);
              useCarrierWizardStore.getState().setErrors({ ...errors, bio: '' });
            }}
            multiline
            textAlignVertical="top"
          />
          <InlineError message={errors.bio} />
        </View>

        <View style={s.header}>
          <Text style={s.title}>معلومات التواصل</Text>
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>رقم الهاتف الرئيسي *</Text>
          <TextInput
            style={[s.input, errors.contactPhone ? s.inputError : null]}
            placeholder="مثال: 96890000000"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={contactPhone}
            onChangeText={(v) => {
              setField('contactPhone', v);
              useCarrierWizardStore.getState().setErrors({ ...errors, contactPhone: '' });
            }}
          />
          <InlineError message={errors.contactPhone} />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>رقم الواتساب *</Text>
          <TextInput
            style={[s.input, errors.whatsapp ? s.inputError : null]}
            placeholder="رقم الواتساب لسهولة التواصل"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={whatsapp}
            onChangeText={(v) => {
              setField('whatsapp', v);
              useCarrierWizardStore.getState().setErrors({ ...errors, whatsapp: '' });
            }}
          />
          <InlineError message={errors.whatsapp} />
        </View>

      </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 8,
    marginTop: 8,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'left',
    paddingVertical: 4,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: 4,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#334155',
    textAlign: 'left',
    paddingVertical: 4,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: 16,
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    color: '#0f172a',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
});
