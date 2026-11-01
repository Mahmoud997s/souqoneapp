import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { GlassSurface, type GlassSupport } from '../../navigation/glassSupport'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { PublicProfileTokens } from '../../../constants/publicProfileTokens'
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
  support?: GlassSupport
}

export function PublicProfileTabs({ counts, selected, onSelect, support }: PublicProfileTabsProps) {
  return (
    <View testID="public-profile-tabs" style={s.track}>
      <GlassSurface
        testID="public-profile-tabs-surface"
        variant="surface"
        borderRadius={PublicProfileTokens.topBarRadius}
        noBorder
        washColor={Colors.white}
        washOpacity={PublicProfileTokens.tabsWashOpacity}
        support={support}
      />
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
    </View>
  )
}

const s = StyleSheet.create({
  track: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: PublicProfileTokens.topBarRadius,
    padding: Spacing.space2 - 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', gap: Spacing.space2 },
  tab: { minHeight: Spacing.touch, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, paddingHorizontal: 14, borderRadius: Radius.pill },
  tabSelected: { backgroundColor: Colors.primary },
  label: { fontFamily: 'Almarai_700Bold', fontSize: 13, lineHeight: 20, color: Colors.text },
  labelSelected: { color: Colors.white },
  count: { minWidth: Spacing.space4, textAlign: 'center', fontFamily: 'Almarai_700Bold', fontSize: 12, lineHeight: 18, color: Colors.textMuted },
  countSelected: { color: Colors.white },
})
