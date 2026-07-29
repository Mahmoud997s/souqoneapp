import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export interface TabItem {
  id: string;
  label: string;
}

export interface ListingTabsProps {
  tabs: TabItem[];
  activeTabId?: string;
  onChangeTab: (id: string) => void;
  onClearTab?: () => void;
}

export function ListingTabs({ tabs, activeTabId, onChangeTab, onClearTab }: ListingTabsProps) {
  if (!tabs || tabs.length === 0) return null;
  
  return (
    <View style={s.listingTypeTabs}>
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
    marginTop: Spacing.space2, // Reduced margin
    backgroundColor: '#F1F5F9', // slightly lighter inner bg
    borderRadius: 8, // slightly smaller border radius
    padding: 2, // reduced padding
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6, // Reduced padding
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  typeTabActive: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 },
    })
  },
  typeTabTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11, // Reduced font size
    lineHeight: 14, // Adjusted line height
    color: '#64748B',
  },
  typeTabTxtActive: {
    color: Colors.primary,
  }
});
