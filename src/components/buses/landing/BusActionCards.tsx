import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Spacing } from '../../../constants/spacing';
import { Radius } from '../../../constants/radius';

const { width: SW } = Dimensions.get('window');

function ActionCard({
  icon, label, desc, color, bg, onPress, iconFamily = 'Ionicons'
}: {
  icon: string; label: string; desc: string
  color: string; bg: string; onPress: () => void; iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'
}) {
  return (
    <TouchableOpacity style={[s.card, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.iconBox, { backgroundColor: color + '20' }]}>
        {iconFamily === 'MaterialCommunityIcons' ? (
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        ) : (
          <Ionicons name={icon as any} size={24} color={color} />
        )}
      </View>
      <View style={s.textBox}>
        <Text style={[s.label, { color: Colors.text }]} numberOfLines={1}>{label}</Text>
        <Text style={s.desc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function BusActionCards() {
  const router = useRouter();

  return (
    <View style={s.ctaRow}>
      <ActionCard
        icon="bus-outline" label="تصفح الحافلات"
        desc="استكشف جميع الحافلات المتاحة"
        color="#3b82f6" bg="#EFF6FF"
        onPress={() => router.push('/buses/browse' as any)}
      />
      <ActionCard
        icon="add-circle-outline" label="أضف حافلة"
        desc="اعرض حافلتك للبيع أو للإيجار"
        color="#10b981" bg="#ECFDF5"
        onPress={() => router.push('/buses/new' as any)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  ctaRow: {
    flexDirection: 'row', 
    gap: Spacing.space3, 
    paddingHorizontal: Spacing.space5, 
    marginTop: 0, 
    alignSelf: 'stretch', 
    marginBottom: Spacing.space6
  },
  card: {
    width: (SW - Spacing.space5 * 2 - Spacing.space4) / 2,
    padding: Spacing.space3 + 2,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
    shadowColor: Colors.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8, 
    elevation: 1,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  textBox: { 
    flex: 1 
  },
  label: { 
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 14, 
    textAlign: 'left', 
    marginBottom: 2 
  },
  desc: { 
    fontFamily: 'Almarai_400Regular', 
    fontSize: 12, 
    color: Colors.textMuted, 
    textAlign: 'left', 
    paddingBottom: 4 
  },
});
