import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

interface Props {
  offerPrice: number
  currency?: string
  isCounter: boolean
  onOpenNego: () => void
}

export function NegotiationBanner({ offerPrice, currency = 'ر.ع', isCounter, onOpenNego }: Props) {
  return (
    <View style={s.container}>
      <View style={s.row}>
        <View style={s.iconWrap}>
          <Ionicons name="pricetag" size={20} color={Colors.primary} />
        </View>
        <View style={s.info}>
          <Text style={s.title}>{isCounter ? 'عرض سعر مضاد' : 'عرض سعر جديد'}</Text>
          <Text style={s.price}>{offerPrice} {currency}</Text>
        </View>
        <TouchableOpacity style={s.btn} onPress={onOpenNego}>
          <Text style={s.btnTxt}>معاينة والتفاوض</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FB',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    padding: Spacing.space3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.space3,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 74, 198, 0.1)',
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0, 74, 198, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  info: { flex: 1, paddingHorizontal: 12, alignItems: 'flex-start' },
  title: { fontFamily: 'Almarai_700Bold', fontSize: 12, color: Colors.textMuted, writingDirection: 'rtl', marginBottom: 2 },
  price: { fontFamily: 'Almarai_800ExtraBold', fontSize: 16, color: Colors.primary, writingDirection: 'rtl' },
  btn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  btnTxt: { fontFamily: 'Almarai_700Bold', fontSize: 13, color: Colors.white },
})
