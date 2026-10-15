import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';
import { AppHeader } from '../ui/AppHeader';
import { PROFILE_PHONE_REQUIRED_MESSAGE } from '../../utils/profilePhoneGuard';

interface Props {
  title?: string;
  onBack?: () => void;
}

export function ProfilePhoneGuardView({ title = 'إضافة إعلان', onBack }: Props) {
  const handleAddPhone = () => {
    router.push('/profile/edit-profile' as any);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={s.container} testID="profile-phone-guard-view">
      <AppHeader title={title} showBack onLeftPress={handleBack} />

      <View style={s.content}>
        <View style={s.card}>
          <View style={s.iconWrap}>
            <Ionicons name="call" size={32} color={Colors.primary} />
          </View>

          <Text style={s.cardTitle}>إضافة رقم الهاتف مطلوبة</Text>
          <Text style={s.cardMessage}>{PROFILE_PHONE_REQUIRED_MESSAGE}</Text>

          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleAddPhone}
            activeOpacity={0.8}
            testID="guard-add-phone-btn"
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={s.primaryBtnText}>أضف رقمك</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={handleBack}
            activeOpacity={0.7}
            testID="guard-back-btn"
          >
            <Text style={s.secondaryBtnText}>الرجوع</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space5,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.space6,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.space4,
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 18,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: Spacing.space2,
  },
  cardMessage: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: Spacing.space6,
  },
  primaryBtn: {
    width: '100%',
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.space3,
  },
  primaryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#94A3B8',
  },
});
