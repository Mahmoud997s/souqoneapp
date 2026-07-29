import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius } from '../../../constants/radius';
import { Spacing } from '../../../constants/spacing';

export function BusPromoBanner() {
  return (
    <View style={s.promoBanner}>
      <LinearGradient colors={['#193D66', '#0B1B2D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]} />
      <View style={s.promoContent}>
        <Text style={s.promoTitle}>عروض حصرية!</Text>
        <Text style={s.promoDesc}>احصل على خصومات للترويج لحافلتك بأسعار تنافسية.</Text>
        <TouchableOpacity style={s.promoBtn}>
          <Text style={s.promoBtnTxt}>اكتشف العروض</Text>
        </TouchableOpacity>
      </View>
      <Ionicons name="bus" size={100} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', left: -10, bottom: -20, transform: [{ rotate: '-15deg' }] }} />
    </View>
  );
}

const s = StyleSheet.create({
  promoBanner: { 
    height: 130, 
    borderRadius: Radius.xl, 
    overflow: 'hidden', 
    justifyContent: 'center',
    marginHorizontal: Spacing.space5,
    marginBottom: Spacing.space6
  },
  promoContent: { 
    padding: Spacing.space4, 
    zIndex: 2 
  },
  promoTitle: { 
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 18, 
    color: '#F59E0B', 
    marginBottom: 4, 
    writingDirection: 'rtl', 
    textAlign: 'left' 
  },
  promoDesc: { 
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.8)', 
    marginBottom: 12, 
    writingDirection: 'rtl', 
    textAlign: 'left' 
  },
  promoBtn: { 
    backgroundColor: '#F59E0B', 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    alignSelf: 'flex-start' 
  },
  promoBtnTxt: { 
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 12, 
    color: '#FFFFFF' 
  },
});
