import React from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { TopBarTokens } from '../../constants/topBarTokens'
import { TopBarGlassSurface } from '../ui/TopBarGlassSurface'
import { type GlassSupport } from '../navigation/glassSupport'
import { ChatFilterTabs, type ChatFilterTabType } from './ChatFilterTabs'

export interface ChatListHeaderProps {
  searchText: string
  onSearchChange: (text: string) => void
  unreadCount?: number
  onNotificationsPress?: () => void
  activeTab: ChatFilterTabType
  onTabChange: (tab: ChatFilterTabType) => void
  counts?: Partial<Record<ChatFilterTabType, number>>
  onLayout?: (event: LayoutChangeEvent) => void
  support?: GlassSupport
  testID?: string
}

export const ChatListHeader: React.FC<ChatListHeaderProps> = ({
  searchText,
  onSearchChange,
  unreadCount = 0,
  onNotificationsPress,
  activeTab,
  onTabChange,
  counts = {},
  onLayout,
  support,
  testID = 'chat-list-header',
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[s.container, { paddingTop: insets.top + TopBarTokens.topPadOffset }]}
    >
      <TopBarGlassSurface
        testID={`${testID}-background`}
        kind="background"
        support={support}
      />

      {/* Title Row */}
      <View style={s.titleRow}>
        <View style={s.titleGroup}>
          <Text style={s.title}>الرسائل</Text>
          {unreadCount > 0 ? (
            <Text style={s.unreadLabel} testID="chat-header-unread-label">
              {unreadCount} جديدة
            </Text>
          ) : null}
        </View>

        <TouchableOpacity
          testID="chat-notifications-btn"
          style={s.bellBtn}
          hitSlop={TopBarTokens.buttonHitSlop}
          activeOpacity={0.75}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel="الإشعارات"
        >
          <TopBarGlassSurface
            testID={`${testID}-bell-glass`}
            kind="ice-control"
            borderRadius={TopBarTokens.buttonRadius}
            support={support}
          />
          <Ionicons
            name="notifications-outline"
            size={TopBarTokens.buttonIconSize}
            color={TopBarTokens.buttonIconColor}
          />
          {unreadCount > 0 ? <View style={s.bellDot} testID="chat-bell-dot" /> : null}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <TopBarGlassSurface
            testID={`${testID}-search-glass`}
            kind="ice-control"
            borderRadius={TopBarTokens.searchRadius}
            support={support}
          />
          <Ionicons
            name="search-outline"
            size={TopBarTokens.searchIconSize}
            color={TopBarTokens.searchIconColor}
          />
          <TextInput
            testID="chat-search-input"
            style={s.searchInput}
            value={searchText}
            onChangeText={onSearchChange}
            placeholder="ابحث في المحادثات"
            placeholderTextColor={TopBarTokens.searchPlaceholderColor}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity
              testID="chat-search-clear"
              onPress={() => onSearchChange('')}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              accessibilityRole="button"
              accessibilityLabel="مسح البحث"
              style={s.clearBtn}
            >
              <Ionicons
                name="close-circle"
                size={TopBarTokens.clearIconSize}
                color={TopBarTokens.clearIconColor}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Underline Filter Tabs */}
      <ChatFilterTabs
        activeTab={activeTab}
        onTabChange={onTabChange}
        counts={counts}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    borderBottomWidth: TopBarTokens.borderBottomWidth,
    borderBottomColor: TopBarTokens.borderBottomColor,
    ...TopBarTokens.shadow,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space2,
    minHeight: TopBarTokens.rowHeight,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.space2,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    lineHeight: 28,
    color: Colors.slateDark,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  unreadLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.primaryStrong,
    writingDirection: 'rtl',
    textAlign: 'left',
  },
  bellBtn: {
    width: TopBarTokens.buttonSize,
    height: TopBarTokens.buttonSize,
    borderRadius: TopBarTokens.buttonRadius,
    backgroundColor: TopBarTokens.iceGlass,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
    ...TopBarTokens.buttonShadow,
  },
  bellDot: {
    position: 'absolute',
    top: 7,
    end: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },
  searchRow: {
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TopBarTokens.searchHeight,
    borderRadius: TopBarTokens.searchRadius,
    backgroundColor: TopBarTokens.iceGlass,
    borderWidth: TopBarTokens.searchBorderWidth,
    borderColor: TopBarTokens.searchBorderColor,
    paddingHorizontal: TopBarTokens.searchPaddingHorizontal,
    gap: TopBarTokens.searchGap,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    fontFamily: TopBarTokens.searchFontFamily,
    fontSize: TopBarTokens.searchFontSize,
    lineHeight: TopBarTokens.searchLineHeight,
    color: Colors.slateDark,
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingVertical: 0,
  },
  clearBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
