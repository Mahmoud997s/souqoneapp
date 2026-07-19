import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transportApi } from '../../../../src/api/transport';
import { AppHeader } from '../../../../src/components/ui/AppHeader';
import { Colors } from '../../../../src/constants/colors';
import { Radius } from '../../../../src/constants/radius';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../../src/store/authStore';

export default function EditTransportRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: request, isLoading } = useQuery({
    queryKey: ['transport-request', id],
    queryFn: async () => {
      const res = await transportApi.getById(id as string);
      return res.data;
    },
    enabled: !!id,
  });

  const [cargoDescription, setCargoDescription] = useState('');
  const [weightTons, setWeightTons] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (request) {
      setCargoDescription(request.cargoDescription || '');
      setWeightTons(request.weightTons ? request.weightTons.toString() : '');
      setBudgetMin(request.budgetMin ? request.budgetMin.toString() : '');
      setBudgetMax(request.budgetMax ? request.budgetMax.toString() : '');
      setNotes(request.notes || '');
    }
  }, [request]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await transportApi.update(id as string, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transport-request', id] });
      queryClient.invalidateQueries({ queryKey: ['my-transport-requests'] });
      Alert.alert('نجاح', 'تم تحديث الطلب بنجاح', [
        { text: 'موافق', onPress: () => router.back() }
      ]);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'حدث خطأ أثناء التحديث';
      Alert.alert('خطأ', Array.isArray(msg) ? msg.join('\n') : String(msg));
    }
  });

  if (!user) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.errorTxt}>يجب تسجيل الدخول</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.loadingTxt}>جاري التحميل...</Text>
      </View>
    );
  }

  if (!request) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Text style={s.errorTxt}>الطلب غير موجود</Text>
      </View>
    );
  }

  if (request.userId !== user.id) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Ionicons name="lock-closed" size={48} color={Colors.error} />
        <Text style={s.errorTxt}>غير مصرح لك بتعديل هذا الطلب</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnTxt}>عودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (request.status !== 'OPEN') {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Ionicons name="warning" size={48} color={Colors.warning} />
        <Text style={s.errorTxt}>لا يمكن تعديل الطلب لأنه ليس في حالة مفتوح</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backBtnTxt}>عودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = () => {
    if (!cargoDescription.trim()) {
      Alert.alert('تنبيه', 'وصف الحمولة مطلوب');
      return;
    }
    
    updateMutation.mutate({
      cargoDescription,
      weightTons: weightTons ? parseFloat(weightTons) : undefined,
      budgetMin: budgetMin ? parseFloat(budgetMin) : undefined,
      budgetMax: budgetMax ? parseFloat(budgetMax) : undefined,
      notes,
    });
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title="تعديل الطلب" showBack />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        
        <View style={s.field}>
          <Text style={s.label}>وصف الحمولة</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={cargoDescription}
            onChangeText={setCargoDescription}
            multiline
            numberOfLines={4}
            textAlign="right"
            textAlignVertical="top"
          />
        </View>

        <View style={s.field}>
          <Text style={s.label}>الوزن التقريبي (بالطن)</Text>
          <TextInput
            style={s.input}
            value={weightTons}
            onChangeText={setWeightTons}
            keyboardType="numeric"
            textAlign="right"
          />
        </View>

        <View style={s.row}>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={s.label}>الحد الأدنى للسعر (ر.ع)</Text>
            <TextInput
              style={s.input}
              value={budgetMin}
              onChangeText={setBudgetMin}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>
          <View style={[s.field, { flex: 1 }]}>
            <Text style={s.label}>الحد الأعلى للسعر (ر.ع)</Text>
            <TextInput
              style={s.input}
              value={budgetMax}
              onChangeText={setBudgetMax}
              keyboardType="numeric"
              textAlign="right"
            />
          </View>
        </View>

        <View style={s.field}>
          <Text style={s.label}>ملاحظات إضافية</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            textAlign="right"
            textAlignVertical="top"
          />
        </View>

      </ScrollView>

      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity 
          style={[s.saveBtn, updateMutation.isPending && s.disabledBtn]} 
          onPress={handleSave}
          disabled={updateMutation.isPending}
        >
          <Text style={s.saveTxt}>{updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التعديلات'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  loadingTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#64748b' },
  errorTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#0f172a', textAlign: 'center' },
  backBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.md, marginTop: 12 },
  backBtnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, color: '#fff' },

  content: { padding: 16 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: '#475569', marginBottom: 8, textAlign: 'right' },
  input: {
    backgroundColor: '#fff',
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
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  disabledBtn: { opacity: 0.7 },
  saveTxt: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: '#fff' },
});
