import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Radius } from '../../../constants/radius';

export function CarrierCTABanner() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name="shield-checkmark" size={28} color={Colors.white} />
        </View>
        <Text style={s.title}>هل تملك مركبة نقل؟</Text>
        <Text style={s.desc}>
          انضم لشبكة ناقلي سوق وان الآن. تصفح الطلبات، قدم عروضك، وضاعف أرباحك بكل سهولة وأمان.
        </Text>
        
        <TouchableOpacity 
          style={s.button}
          activeOpacity={0.85}
          onPress={() => router.push('/transport/carrier-register' as any)}
        >
          <Text style={s.buttonText}>سجل كناقل الآن</Text>
          <Ionicons name="arrow-back-outline" size={18} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  content: {
    padding: Spacing.space4,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.space2,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.white,
    marginBottom: Spacing.space1,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  desc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: Spacing.space4,
    writingDirection: 'rtl',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.pill,
    gap: 8,
    width: '100%',
  },
  buttonText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 20,
    color: '#0f172a',
    writingDirection: 'rtl',
  },
});

