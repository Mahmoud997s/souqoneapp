import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { formatNumberWestern } from '../../utils/numberFormat'

export interface DetailViewCountItemProps {
  viewCount: number
  testID?: string
  maxFontSizeMultiplier?: number
}

/**
 * Shared detail-header view counter matching ServicePriceHeader's exact meta-row item:
 * `eye-outline` (size 14, Colors.textMuted) + Western en-US formatted count + " مشاهدة".
 */
export function DetailViewCountItem({
  viewCount,
  testID = 'detail-view-count',
  maxFontSizeMultiplier,
}: DetailViewCountItemProps) {
  const safeCount =
    typeof viewCount === 'number' && Number.isFinite(viewCount) && viewCount >= 0
      ? viewCount
      : 0

  return (
    <View style={s.metaItem} testID={testID}>
      <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
      <Text style={s.metaText} maxFontSizeMultiplier={maxFontSizeMultiplier}>
        {formatNumberWestern(safeCount)} مشاهدة
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
