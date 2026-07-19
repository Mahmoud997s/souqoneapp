import React, { useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Typography } from '../../constants/typography'

interface Props {
  sheetRef: React.RefObject<BottomSheet>
  offerPrice: number
  listingPrice: number
  currency?: string
  isCounter: boolean
  onAccept: () => void
  onCounterOffer: () => void
}

export function NegotiationBottomSheet({ sheetRef, offerPrice, listingPrice, currency = 'ر.ع', isCounter, onAccept, onCounterOffer }: Props) {
  const snapPoints = useMemo(() => ['50%'], [])

  const renderBackdrop = (props: any) => (
    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
  )

  const diff = offerPrice - listingPrice

  return (
    <BottomSheet
      ref={sheetRef as any}
      index={-1}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      backgroundStyle={{ borderRadius: 24 }}
    >
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.title}>{isCounter ? 'عرض سعر مضاد' : 'عرض سعر جديد'}</Text>
          <TouchableOpacity onPress={() => sheetRef.current?.close()} style={s.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={s.priceBox}>
          <Text style={s.priceBoxTitle}>السعر المعروض</Text>
          <Text style={s.priceBoxValue}>{offerPrice} {currency}</Text>
          
          <View style={s.diffRow}>
            <Text style={s.diffTxt}>السعر الأصلي: {listingPrice} {currency}</Text>
            <View style={[s.diffBadge, diff > 0 ? s.bgGreen : s.bgRed]}>
              <Text style={[s.diffBadgeTxt, diff > 0 ? s.txtGreen : s.txtRed]}>
                {diff > 0 ? '+' : ''}{diff} {currency}
              </Text>
            </View>
          </View>
        </View>

        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, s.btnPrimary]} onPress={onAccept}>
            <Text style={s.btnPrimaryTxt}>قبول العرض</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnSecondary]} onPress={onCounterOffer}>
            <Text style={s.btnSecondaryTxt}>تقديم عرض مضاد</Text>
          </TouchableOpacity>
        </View>

        <View style={s.trustBanner}>
          <Ionicons name="shield-checkmark" size={16} color="#059669" />
          <Text style={s.trustTxt}>عملية تفاوض آمنة عبر منصة سوق ون</Text>
        </View>
      </View>
    </BottomSheet>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: Spacing.space4, backgroundColor: Colors.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: 'Almarai_800ExtraBold', fontSize: Typography.titleMd.fontSize, color: Colors.text },
  closeBtn: { width: 32, height: 32, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  
  priceBox: {
    backgroundColor: '#F8F9FB',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)'
  },
  priceBoxTitle: { fontFamily: 'Almarai_700Bold', fontSize: 14, color: Colors.textMuted, marginBottom: 8 },
  priceBoxValue: { fontFamily: 'Almarai_800ExtraBold', fontSize: 32, color: Colors.primary, marginBottom: 16 },
  
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  diffTxt: { fontFamily: 'Almarai_400Regular', fontSize: 13, color: Colors.textMuted },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bgGreen: { backgroundColor: '#E5F6E5' },
  bgRed: { backgroundColor: '#FFE5E5' },
  diffBadgeTxt: { fontFamily: 'Almarai_700Bold', fontSize: 12, direction: 'ltr' },
  txtGreen: { color: '#2E7D32' },
  txtRed: { color: '#FF4D4D' },

  actions: { gap: 12, marginBottom: 24 },
  btn: { width: '100%', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: Colors.primary },
  btnPrimaryTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.white },
  btnSecondary: { backgroundColor: 'rgba(0, 74, 198, 0.08)' },
  btnSecondaryTxt: { fontFamily: 'Almarai_700Bold', fontSize: 15, color: Colors.primary },

  trustBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 'auto', marginBottom: 12 },
  trustTxt: { fontFamily: 'Almarai_400Regular', fontSize: 12, color: '#059669' },
})
