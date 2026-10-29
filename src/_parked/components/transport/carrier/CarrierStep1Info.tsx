import React from 'react';
import { View, Text, StyleSheet, TextInput, Platform } from 'react-native';
import { useCarrierWizardStore } from '../../../store/carrierWizardStore';
import { Colors } from '../../../constants/colors';
import { Radius } from '../../../constants/radius';
import { InlineError } from '../../ui/InlineError';
import { WhatsappToggle } from '../../ui/WhatsappToggle';

export default function CarrierStep1Info() {
  const { companyName, bio, whatsappEnabled, setField, errors } = useCarrierWizardStore();

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

        <WhatsappToggle
          value={whatsappEnabled}
          onValueChange={(val) => setField('whatsappEnabled', val)}
          variant="card"
        />

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
    color: Colors.text,
    marginBottom: 4,
    textAlign: 'left',
    paddingVertical: 4,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
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
    color: Colors.text,
    textAlign: 'left',
    paddingVertical: 4,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    height: 52,
    paddingHorizontal: 16,
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    color: Colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    height: 100,
    paddingTop: 16,
  },
});
