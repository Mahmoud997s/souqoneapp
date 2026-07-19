import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { CarrierProfile } from '../../types/transport.types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../../api/transport';
import { LocationPicker } from '../ui/LocationPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  profile: CarrierProfile;
}

export function EditCarrierProfileModal({ visible, onClose, profile }: Props) {
  const queryClient = useQueryClient();
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [governorate, setGovernorate] = useState('');

  useEffect(() => {
    if (visible && profile) {
      setCompanyName(profile.companyName || '');
      setBio(profile.bio || '');
      setContactPhone(profile.contactPhone || '');
      setGovernorate(profile.governorate || '');
    }
  }, [visible, profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<CarrierProfile>) => {
      const res = await transportApi.updateCarrierProfile(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-carrier-profile'] });
      Alert.alert('نجاح', 'تم تحديث الملف الشخصي بنجاح');
      onClose();
    },
    onError: (err: any) => {
      Alert.alert('خطأ', err?.response?.data?.message || 'تعذر تحديث الملف الشخصي');
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      companyName,
      bio,
      contactPhone,
      governorate,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.content}>
          <View style={s.header}>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text style={s.title}>تعديل بيانات الناقل</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
            <View style={s.field}>
              <Text style={s.label}>اسم الشركة / الناقل</Text>
              <TextInput
                style={s.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="أدخل اسم الشركة"
                textAlign="right"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>نبذة عنك</Text>
              <TextInput
                style={[s.input, s.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="اكتب نبذة تظهر للعملاء (خبراتك، أوقات عملك، إلخ)"
                multiline
                numberOfLines={3}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>

            <View style={[s.field, { zIndex: 50 }]}>
              <Text style={s.label}>المحافظة الأساسية</Text>
              <LocationPicker
                governorate={governorate}
                onGovernorateChange={setGovernorate}
                city=""
                onCityChange={() => {}}
                govLabelText="اختر المحافظة"
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>رقم التواصل</Text>
              <TextInput
                style={s.input}
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="رقم الهاتف"
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={s.footer}>
            <TouchableOpacity 
              style={[s.saveBtn, updateMutation.isPending && s.saveBtnDisabled]} 
              onPress={handleSave}
              disabled={updateMutation.isPending}
            >
              <Text style={s.saveTxt}>{updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 10 },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: 18, color: '#0f172a' },
  closeBtn: { padding: 4 },
  
  scroll: { padding: 16 },
  field: { marginBottom: 16 },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#475569', marginBottom: 8, textAlign: 'right' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: Radius.md,
    minHeight: 48,
    paddingHorizontal: 12,
    fontFamily: 'Almarai_400Regular', fontSize: 15, color: '#0f172a',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },

  footer: {
    padding: 16,
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.7,
  },
  saveTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#fff' },
});
