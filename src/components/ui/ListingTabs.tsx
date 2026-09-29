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
    marginTop: Spacing.space2,
    marginBottom: 2,
    backgroundColor: 'rgba(218, 241, 222, 0.4)', // Glass pale mint
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(142, 182, 155, 0.35)',
    padding: 3,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  typeTabActive: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: { shadowColor: Colors.primaryDark, shadowOffset: { width: 0, height: 1.5 }, shadowOpacity: 0.12, shadowRadius: 3 },
      android: { elevation: 2 },
    })
  },
  typeTabTxt: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 11.5,
    lineHeight: 15.5,
    color: Colors.accent,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  typeTabTxtActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  }
});
