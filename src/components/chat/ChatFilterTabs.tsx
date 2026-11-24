import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

export type ChatFilterTabType = 'all' | 'unread' | 'buying' | 'selling' | 'archived'

export interface ChatFilterTabsProps {
  activeTab: ChatFilterTabType
  onTabChange: (tab: ChatFilterTabType) => void
  counts?: Partial<Record<ChatFilterTabType, number>>
}

interface TabDef {
  key: ChatFilterTabType
  label: string
}

const TABS: TabDef[] = [
  { key: 'all', label: 'الكل' },
  { key: 'unread', label: 'غير مقروءة' },
  { key: 'buying', label: 'مشتريات' },
  { key: 'selling', label: 'مبيعات' },
  { key: 'archived', label: 'الأرشيف' },
]

export const ChatFilterTabs: React.FC<ChatFilterTabsProps> = ({
  activeTab,
  onTabChange,
  counts = {},
}) => {
  const handleTabPress = (tab: ChatFilterTabType) => {
    if (tab !== activeTab) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onTabChange(tab)
    }
  }

  return (
    <View style={styles.container} testID="chat-filter-tabs">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = counts[tab.key] ?? 0
          const showCount = count > 0 || tab.key === 'all'

          return (
            <TouchableOpacity
              key={tab.key}
              testID={`chat-filter-tab-${tab.key}`}
              style={[
                styles.tabItem,
                isActive && styles.tabItemActive,
              ]}
              activeOpacity={0.75}
              onPress={() => handleTabPress(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>

              {showCount ? (
                <Text
                  style={[
                    styles.countText,
                    isActive && styles.countTextActive,
                  ]}
                >
                  {count}
                </Text>
              ) : null}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    gap: Spacing.space5,
    alignItems: 'center',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: Colors.transparent,
    gap: 4,
  },
  tabItemActive: {
    borderBottomColor: Colors.primaryStrong,
  },
  tabText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  tabTextActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primaryStrong,
  },
  countText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  countTextActive: {
    fontFamily: 'Almarai_700Bold',
    color: Colors.primaryStrong,
  },
})
