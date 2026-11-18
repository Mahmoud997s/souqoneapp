import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GlassSurface, type GlassSupport } from '../../navigation/glassSupport'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
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
      <View testID="public-profile-tabs-row" style={s.row}>
        {TABS.map((tab) => {
          const isSelected = selected === tab.key
          const count = counts[tab.countKey]
          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelect(tab.key)}
              style={[s.tab, isSelected && s.tabSelected]}
              hitSlop={{ top: 4, bottom: 4 }}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${tab.label}، ${count}`}
            >
              <Text
                style={[s.label, isSelected && s.labelSelected]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {tab.label}
              </Text>
              <Text style={[s.count, isSelected && s.countSelected]}>{count}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  track: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: PublicProfileTokens.topBarRadius,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 2 },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: PublicProfileTokens.tabsMinHeight,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: Radius.pill,
  },
  tabSelected: { backgroundColor: Colors.primary },
  label: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  labelSelected: { color: Colors.white },
  count: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    color: Colors.textMuted,
  },
  countSelected: { color: Colors.white },
})
