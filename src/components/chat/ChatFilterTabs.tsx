import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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
  icon: keyof typeof Ionicons.glyphMap
}

const TABS: TabDef[] = [
  { key: 'all', label: 'الكل', icon: 'chatbubbles-outline' },
  { key: 'unread', label: 'غير مقروءة', icon: 'mail-unread-outline' },
  { key: 'buying', label: 'مشتريات', icon: 'cart-outline' },
  { key: 'selling', label: 'مبيعات', icon: 'pricetag-outline' },
  { key: 'archived', label: 'مؤرشفة', icon: 'archive-outline' },
]

export const ChatFilterTabs: React.FC<ChatFilterTabsProps> = ({
  activeTab,
  onTabChange,
  counts = {},
}) => {
  const handleTabPress = (tab: ChatFilterTabType) => {
    if (tab !== activeTab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onTabChange(tab)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key
          const count = counts[tab.key] ?? 0
          const showBadge = count > 0 || tab.key === 'all'
          const isUnreadTab = tab.key === 'unread'

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabChip,
                isActive && styles.tabChipActive,
              ]}
              activeOpacity={0.75}
              onPress={() => handleTabPress(tab.key)}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={isActive ? Colors.white : Colors.text2}
                style={styles.tabIcon}
              />
              <Text
                style={[
                  styles.tabText,
                  isActive && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>

              {showBadge && (
                <View
                  style={[
                    styles.badge,
                    isActive && styles.badgeActive,
                    isUnreadTab && count > 0 && !isActive && styles.badgeUnreadAlert,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      isActive && styles.badgeTextActive,
                      isUnreadTab && count > 0 && !isActive && styles.badgeTextUnreadAlert,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.space4,
    gap: 7,
    alignItems: 'center',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 33,
    paddingHorizontal: 11,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1.1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  tabChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  tabIcon: {
    marginEnd: 4,
  },
  tabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 15,
    color: Colors.text2,
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  tabTextActive: {
    color: Colors.white,
  },
  badge: {
    paddingHorizontal: 4.5,
    height: 17,
    minWidth: 17,
    borderRadius: 8.5,
    backgroundColor: '#EDF2F7',
    marginStart: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  badgeUnreadAlert: {
    backgroundColor: 'rgba(254, 94, 0, 0.12)',
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10,
    lineHeight: 12,
    color: Colors.text2,
    includeFontPadding: false,
  },
  badgeTextActive: {
    color: Colors.white,
  },
  badgeTextUnreadAlert: {
    color: Colors.brandOrange,
  },
})
