import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { PublicProfileCounts } from '../../../types/profile.types'
import { PublicProfileListingVertical } from '../../../hooks/public-profile/publicProfileKeys'

interface TabConfig {
  key: PublicProfileListingVertical
  label: string
  countKey: keyof Pick<PublicProfileCounts, 'listings' | 'busListings' | 'equipmentListings' | 'spareParts' | 'carServices'>
}

const TABS: TabConfig[] = [
  { key: 'car', label: 'السيارات', countKey: 'listings' },
  { key: 'bus', label: 'الحافلات', countKey: 'busListings' },
  { key: 'equipment', label: 'المعدات', countKey: 'equipmentListings' },
  { key: 'part', label: 'قطع الغيار', countKey: 'spareParts' },
  { key: 'service', label: 'الخدمات', countKey: 'carServices' },
]

export interface PublicProfileTabsProps {
  counts: PublicProfileCounts
  selected: PublicProfileListingVertical
  onSelect: (vertical: PublicProfileListingVertical) => void
}

export function PublicProfileTabs({ counts, selected, onSelect }: PublicProfileTabsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
      {TABS.map((tab) => {
        const isSelected = selected === tab.key
        const count = counts[tab.countKey]
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={[s.tab, isSelected && s.tabSelected]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${tab.label}، ${count}`}
          >
            <Text style={[s.label, isSelected && s.labelSelected]}>{tab.label}</Text>
            <Text style={[s.count, isSelected && s.countSelected]}>{count}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.space2, paddingVertical: Spacing.space2 },
  tab: { minHeight: Spacing.touch, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, paddingHorizontal: Spacing.space3, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  tabSelected: { backgroundColor: Colors.paleMint, borderColor: Colors.primary },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 13, lineHeight: 20, color: Colors.textMuted },
  labelSelected: { color: Colors.primaryDeep },
  count: { minWidth: Spacing.space4, textAlign: 'center', fontFamily: 'Almarai_700Bold', fontSize: 12, lineHeight: 18, color: Colors.textMuted },
  countSelected: { color: Colors.primaryDeep },
})
