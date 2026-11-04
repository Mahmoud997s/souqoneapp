import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Spacing } from '../../constants/spacing';
import { FilterGlassTokens } from '../../constants/filterGlassTokens';
import { FilterGlassSurface } from './FilterGlassSurface';
import { type GlassSupport } from '../navigation/glassSupport';

export interface TabItem {
  id: string;
  label: string;
}

export interface ListingTabsProps {
  tabs: TabItem[];
  activeTabId?: string;
  onChangeTab: (id: string) => void;
  onClearTab?: () => void;
  glassSupport?: GlassSupport;
}

export function ListingTabs({ tabs, activeTabId, onChangeTab, onClearTab, glassSupport }: ListingTabsProps) {
  if (!tabs || tabs.length === 0) return null;
  
  return (
    <View style={s.listingTypeTabs}>
      <FilterGlassSurface
        testID="listing-tabs-track-glass"
        borderRadius={FilterGlassTokens.tab.trackRadius}
        support={glassSupport}
      />
      {tabs.map((type) => {
        const isActive = activeTabId === type.id;
        return (
          <TouchableOpacity
            key={type.id}
            style={[s.typeTab, isActive && s.typeTabActive]}
            activeOpacity={0.8}
            onPress={() => {
              if (isActive && onClearTab) {
                onClearTab();
              } else {
                onChangeTab(type.id);
              }
            }}
          >
            <Text style={[s.typeTabTxt, isActive && s.typeTabTxtActive]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  listingTypeTabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.space4,
    marginTop: Spacing.space2,
    marginBottom: 2,
    backgroundColor: FilterGlassTokens.tab.trackBg,
    borderRadius: FilterGlassTokens.tab.trackRadius,
    borderWidth: FilterGlassTokens.tab.trackBorderWidth,
    borderColor: FilterGlassTokens.tab.trackBorderColor,
    padding: 3,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: FilterGlassTokens.tab.inactiveBg,
  },
  typeTabActive: {
    backgroundColor: FilterGlassTokens.tab.activeBg,
    ...FilterGlassTokens.tab.activeShadow,
  },
  typeTabTxt: {
    fontFamily: FilterGlassTokens.tab.inactiveFontFamily, 
    fontSize: FilterGlassTokens.tab.fontSize,
    lineHeight: FilterGlassTokens.tab.lineHeight,
    color: FilterGlassTokens.tab.inactiveTextColor,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  typeTabTxtActive: {
    color: FilterGlassTokens.tab.activeTextColor,
    fontFamily: FilterGlassTokens.tab.activeFontFamily,
  }
});
