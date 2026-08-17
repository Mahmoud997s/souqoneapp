import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { JobCardChipItem } from './jobCard.types'

export interface JobCardChipsProps {
  chips: JobCardChipItem[]
  maxChips?: number
}

export function JobCardChips({ chips, maxChips = 3 }: JobCardChipsProps) {
  if (!chips || chips.length === 0) return null

  const visibleChips = chips.slice(0, maxChips)
  const remainingCount = chips.length - maxChips

  return (
    <View style={s.chipsRow}>
      {visibleChips.map((chip) => {
        const styleMap = {
          neutral: s.pillNeutral,
          blue: s.pillBlue,
          amber: s.pillAmber,
          green: s.pillGreen,
        }
        const pillStyle = styleMap[chip.styleType] || s.pillNeutral

        return (
          <View key={chip.key} style={[s.detailPill, pillStyle]}>
            {chip.iconType === 'mci' ? (
              <MaterialCommunityIcons name={chip.icon} size={12} color="#475569" />
            ) : (
              <Ionicons name={chip.icon} size={12} color="#475569" />
            )}
            <Text style={s.pillText} numberOfLines={1} ellipsizeMode="tail">
              {chip.label}
            </Text>
          </View>
        )
      })}

      {remainingCount > 0 && (
        <View style={[s.detailPill, s.pillNeutral, s.extraPill]}>
          <Text style={s.extraPillText}>+{remainingCount}</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 3.5,
    marginBottom: 8,
    overflow: 'hidden',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2.5,
    borderRadius: 6,
    flexShrink: 1,
  },
  pillNeutral: {
    backgroundColor: '#f8fafc',
  },
  pillBlue: {
    backgroundColor: '#eff6ff',
  },
  pillAmber: {
    backgroundColor: '#fffbeb',
  },
  pillGreen: {
    backgroundColor: '#ecfdf5',
  },
  pillText: {
    fontSize: 10,
    fontFamily: 'Almarai_700Bold',
    color: '#475569',
    lineHeight: 14,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  extraPill: {
    paddingHorizontal: 4.5,
    flexShrink: 0,
    backgroundColor: '#f1f5f9',
  },
  extraPillText: {
    fontSize: 9.5,
    fontFamily: 'Almarai_700Bold',
    color: '#64748b',
    lineHeight: 13,
  },
})
