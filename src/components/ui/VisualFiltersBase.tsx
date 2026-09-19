import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { PhysicalHorizontalTrack } from './PhysicalHorizontalTrack';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface VisualFilterItemConfig {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress: () => void;
}

export interface VisualFilterTab<TTabId extends string = string> {
  id: TTabId;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap | string;
  items?: any[];
  rows?: 1 | 2;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  hideViewAll?: boolean;
  viewAllLabel?: string;
  getItemProps?: (item: any) => VisualFilterItemConfig;
  renderItem?: (item: any, isSelected: boolean) => React.ReactNode;
}

export interface VisualFiltersBaseProps<TTabId extends string = string> {
  tabs: VisualFilterTab<TTabId>[];
  activeTab?: TTabId;
  defaultTab?: TTabId;
  activeColor?: string;
  onTabChange?: (tabId: TTabId) => void;
  onViewAll?: (tabId: TTabId) => void;
  renderFooter?: (activeTabId: TTabId) => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  isTransparent?: boolean;
}

/**
 * Pure function to determine whether segmented tabs should be fixed equal width
 * (tabs count <= 3) or horizontally scrollable (tabs count >= 4).
 */
export function isSegmentedTabsFixed(tabsCount: number): boolean {
  return tabsCount <= 3;
}

export function VisualFiltersBase<TTabId extends string = string>({
  tabs,
  activeTab: controlledActiveTab,
  defaultTab,
  activeColor = Colors.primary,
  onTabChange,
  onViewAll,
  renderFooter,
  containerStyle,
  isTransparent = false,
}: VisualFiltersBaseProps<TTabId>) {
  const [internalActiveTab, setInternalActiveTab] = useState<TTabId>(
    defaultTab || tabs[0]?.id
  );

  const activeTabId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const currentTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const currentItems = currentTab?.items || [];
  const activeRows = currentTab?.rows ?? (currentItems.length >= 10 ? 2 : 1);

  const handleTabPress = (tabId: TTabId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  const renderSkeletonGrid = (rows: 1 | 2 = 2) => (
    <PhysicalHorizontalTrack minHeight={rows === 1 ? 42 : 86} contentContainerStyle={s.scrollContainer}>
      <View style={rows === 2 ? s.column : undefined}>
        <View style={[s.itemCard, s.skeletonPill, { width: 110 }]} />
        {rows === 2 && <View style={[s.itemCard, s.skeletonPill, { width: 130 }]} />}
      </View>
      <View style={rows === 2 ? s.column : undefined}>
        <View style={[s.itemCard, s.skeletonPill, { width: 120 }]} />
        {rows === 2 && <View style={[s.itemCard, s.skeletonPill, { width: 95 }]} />}
      </View>
      <View style={rows === 2 ? s.column : undefined}>
        <View style={[s.itemCard, s.skeletonPill, { width: 105 }]} />
        {rows === 2 && <View style={[s.itemCard, s.skeletonPill, { width: 115 }]} />}
      </View>
      <View style={rows === 2 ? s.column : undefined}>
        <View style={[s.itemCard, s.skeletonPill, { width: 100 }]} />
        {rows === 2 && <View style={[s.itemCard, s.skeletonPill, { width: 125 }]} />}
      </View>
    </PhysicalHorizontalTrack>
  );

  const renderActiveGrid = () => {
    if (!currentTab) return null;

    const items = currentTab.items || [];
    const rows = currentTab.rows ?? (items.length >= 10 ? 2 : 1);

    if (currentTab.emptyState) {
      return currentTab.emptyState;
    }

    if (currentTab.isLoading) {
      return renderSkeletonGrid(rows);
    }

    if (items.length === 0) return null;

    const chunkSize = rows === 1 ? 1 : 2;
    const columns = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      columns.push(items.slice(i, i + chunkSize));
    }

    return (
      <PhysicalHorizontalTrack
        resetKey={currentTab.id}
        dataLength={items.length}
        minHeight={rows === 1 ? 42 : 86}
        contentContainerStyle={s.scrollContainer}
      >
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={rows === 2 ? s.column : undefined}>
            {col.map((item: any) => {
              if (currentTab.renderItem) {
                return currentTab.renderItem(item, Boolean(item.isSelected));
              }

              const config: VisualFilterItemConfig = currentTab.getItemProps
                ? currentTab.getItemProps(item)
                : {
                    id: item.id || String(item),
                    label: item.label || item.name || String(item),
                    isSelected: Boolean(item.isSelected),
                    onPress: item.onPress || (() => {}),
                  };

              return (
                <TouchableOpacity
                  key={config.id}
                  activeOpacity={0.7}
                  style={[
                    s.itemCard,
                    config.isSelected && [s.itemCardSelected, { borderColor: activeColor }],
                  ]}
                  onPress={config.onPress}
                >
                  {config.icon}
                  <Text
                    style={[
                      s.itemLabel,
                      config.isSelected && [s.itemLabelSelected, { color: activeColor }],
                    ]}
                    numberOfLines={1}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {onViewAll && !currentTab.hideViewAll && (
          <View style={rows === 2 ? s.column : undefined}>
            <TouchableOpacity
              style={[s.itemCard, s.viewAllCard, rows === 1 && { height: 38 }]}
              onPress={() => onViewAll(currentTab.id)}
              activeOpacity={0.7}
            >
              <View style={s.viewAllIconBox}>
                <Ionicons name="apps-outline" size={15} color={activeColor} />
              </View>
              <Text style={[s.viewAllText, { color: activeColor }]}>
                {currentTab.viewAllLabel || 'عرض الكل'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </PhysicalHorizontalTrack>
    );
  };

  const isFixedTabs = isSegmentedTabsFixed(tabs.length);

  const renderTabItem = (tab: VisualFilterTab<TTabId>) => {
    const isActive = activeTabId === tab.id;
    return (
      <TouchableOpacity
        key={tab.id}
        activeOpacity={0.8}
        style={[
          s.segmentTab,
          isFixedTabs && s.fixedSegmentTab,
          isActive && s.segmentTabActive,
        ]}
        onPress={() => handleTabPress(tab.id)}
      >
        {tab.icon && (
          <Ionicons
            name={tab.icon as any}
            size={14}
            color={isActive ? activeColor : '#64748b'}
            style={s.tabIcon}
          />
        )}
        <Text
          style={[
            s.segmentTabText,
            isActive && [s.segmentTabTextActive, { color: activeColor }],
          ]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, isTransparent && { backgroundColor: 'transparent', borderBottomWidth: 0 }, containerStyle]}>
      {/* ── TABS ── */}
      <View style={s.segmentedWrapper}>
        {isFixedTabs ? (
          <View style={s.fixedSegmentedContainer}>
            {tabs.map(renderTabItem)}
          </View>
        ) : (
          <PhysicalHorizontalTrack
            resetKey={activeTabId}
            minHeight={34}
            contentContainerStyle={s.segmentedContainer}
          >
            {tabs.map(renderTabItem)}
          </PhysicalHorizontalTrack>
        )}
      </View>

      {/* ── GRID AREA ── */}
      <View style={[s.contentArea, activeRows === 1 ? s.contentAreaSingleRow : s.contentAreaDoubleRow]}>
        {renderActiveGrid()}
      </View>

      {/* ── FOOTER (Optional) ── */}
      {renderFooter && renderFooter(activeTabId)}
    </View>
  );
}

export const visualFiltersStyles = StyleSheet.create({
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogo: {
    width: 20,
    height: 20,
  },
});

const s = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: Spacing.space2,
  },
  segmentedWrapper: {
    marginHorizontal: Spacing.space4,
    marginBottom: Spacing.space2,
    marginTop: Spacing.space2,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
  },
  segmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fixedSegmentedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 5,
  },
  fixedSegmentTab: {
    flex: 1,
    paddingHorizontal: 4,
  },
  segmentTabActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  tabIcon: {
    marginEnd: 2,
  },
  segmentTabText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#64748b',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  segmentTabTextActive: {
    color: Colors.primary,
    fontFamily: 'Almarai_800ExtraBold',
  },
  contentArea: {
    paddingTop: Spacing.space2,
  },
  contentAreaDoubleRow: {
    minHeight: 86,
  },
  contentAreaSingleRow: {
    minHeight: 42,
  },
  scrollContainer: {
    paddingHorizontal: Spacing.space4,
    gap: 6,
  },
  column: {
    gap: 6,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 95,
    gap: 6,
  },
  itemCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  itemLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#334155',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  itemLabelSelected: {
    color: Colors.primary,
  },
  viewAllCard: {
    backgroundColor: '#f8fafc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    minWidth: 75,
  },
  viewAllIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  skeletonPill: {
    backgroundColor: '#f1f5f9',
    borderColor: 'transparent',
    minWidth: 95,
  },
});
