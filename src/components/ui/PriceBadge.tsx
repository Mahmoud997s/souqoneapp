import { View, Text, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '../../constants/colors'

interface PriceBadgeProps {
  price: number | string
  currency?: string
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
}

export function PriceBadge({
  price,
  currency = 'ر.ع',
  size = 'md',
  style,
}: PriceBadgeProps) {
  const priceStyle =
    size === 'lg' ? s.priceLg : size === 'sm' ? s.priceSm : s.priceMd
  const currencyStyle =
    size === 'lg' ? s.currLg : size === 'sm' ? s.currSm : s.currMd

  return (
    <View style={[s.row, style]}>
      <Text style={priceStyle}>
        {typeof price === 'number' ? price.toLocaleString() : price}
      </Text>
      <Text style={currencyStyle}> {currency}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline' },
  // size=lg → display-lg-mobile
  priceLg: {
    fontFamily: 'Almarai_800ExtraBold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 28,
    lineHeight: 36,
    color: Colors.primary,
  },
  currLg: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 16,
    lineHeight: 24,
    color: Colors.text2,
  },
  // size=md → headline-sm
  priceMd: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 20,
    lineHeight: 28,
    color: Colors.primary,
  },
  currMd: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    lineHeight: 20,
    color: Colors.text2,
  },
  // size=sm → title-md
  priceSm: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 18,
    lineHeight: 26,
    color: Colors.primary,
  },
  currSm: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4, includeFontPadding: false, fontSize: 14,
    lineHeight: 20,
    color: Colors.text2,
  },
})
