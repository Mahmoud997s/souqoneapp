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
  label?: string;
  icon?: React.ReactNode;
  isSelected?: boolean;
  onPress: () => void;
}

export interface VisualFilterItem<T = object> {
  id: string;
  label?: string;
  name?: string;
  nameAr?: string | null;
  slug?: string;
  en?: string;
  icon?: keyof typeof Ionicons.glyphMap | string;
  isSelected?: boolean;
  onPress?: () => void;
  min?: number;
  max?: number | null;
  extraId?: number;
  year?: number;
  value?: number | string;
  color?: string;
  bg?: string;
  payload?: T;
}

export interface VisualFilterTab<TTabId extends string = string, TItem = VisualFilterItem> {
  id: TTabId;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  items?: readonly TItem[];
  rows?: 1 | 2;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  hideViewAll?: boolean;
  viewAllLabel?: string;
  getItemProps?(item: TItem): VisualFilterItemConfig;
  renderItem?(item: TItem, isSelected: boolean): React.ReactNode;
}

export interface VisualFiltersBaseProps<TTabId extends string = string> {
  tabs: readonly VisualFilterTab<TTabId>[];
  activeTab?: TTabId;
  defaultTab?: TTabId;
  activeColor?: string;
  onTabChange?: (tabId: TTabId) => void;
  onViewAll?: (tabId: TTabId) => void;
  renderFooter?: (activeTabId: TTabId) => React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  segmentedWrapperStyle?: StyleProp<ViewStyle>;
  contentAreaStyle?: StyleProp<ViewStyle>;
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
  segmentedWrapperStyle,
  contentAreaStyle,
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
        {columns.map((col, colIdx) => {
          const firstItem = col[0];
          const colKey = (firstItem && typeof firstItem === 'object' && 'id' in firstItem && firstItem.id != null)
            ? String(firstItem.id)
            : `col-${colIdx}`;

          return (
            <View key={colKey} style={rows === 2 ? s.column : undefined}>
              {col.map((item) => {
                if (currentTab.renderItem) {
                  const isSel = Boolean(item && typeof item === 'object' && 'isSelected' in item && item.isSelected);
                  return currentTab.renderItem(item, isSel);
                }

                const config: VisualFilterItemConfig = currentTab.getItemProps
                  ? currentTab.getItemProps(item)
                  : {
                      id: (item && typeof item === 'object' && 'id' in item && item.id != null) ? String(item.id) : String(item),
                      label: (item && typeof item === 'object' && 'label' in item && item.label != null)
                        ? String(item.label)
                        : (item && typeof item === 'object' && 'name' in item && item.name != null)
                        ? String(item.name)
                        : String(item),
                      isSelected: Boolean(item && typeof item === 'object' && 'isSelected' in item && item.isSelected),
                      onPress: (item && typeof item === 'object' && 'onPress' in item && typeof item.onPress === 'function')
                        ? (item.onPress as () => void)
                        : () => {},
                    };

                return (
                  <TouchableOpacity
                    key={config.id}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={config.label}
                    accessibilityState={{ selected: Boolean(config.isSelected) }}
                    hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
          );
        })}

        {onViewAll && currentTab && !currentTab.hideViewAll && (
          <View style={rows === 2 ? s.column : undefined}>
            <TouchableOpacity
              style={[s.itemCard, s.viewAllCard, rows === 1 && { height: 38 }]}
              onPress={() => onViewAll(currentTab.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={currentTab.viewAllLabel || 'عرض الكل'}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
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
        accessibilityRole="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: isActive }}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        style={[
          s.segmentTab,
          isFixedTabs && s.fixedSegmentTab,
          isActive && s.segmentTabActive,
        ]}
        onPress={() => handleTabPress(tab.id)}
      >
        {tab.icon && (
          <Ionicons
            name={tab.icon}
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
    <View
      testID="visual-filters-base"
      style={[s.container, isTransparent && { backgroundColor: 'transparent', borderBottomWidth: 0 }, containerStyle]}
    >
      {/* ── TABS ── */}
      <View
        testID="visual-filters-segmented-wrapper"
        style={[s.segmentedWrapper, segmentedWrapperStyle]}
      >
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
      <View
        testID="visual-filters-content-area"
        style={[s.contentArea, activeRows === 1 ? s.contentAreaSingleRow : s.contentAreaDoubleRow, contentAreaStyle]}
      >
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
    backgroundColor: Colors.paleMint,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
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
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
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
    color: Colors.textMuted,
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
    borderColor: Colors.border,
    minWidth: 95,
    gap: 6,
  },
  itemCardSelected: {
    backgroundColor: Colors.paleMint,
    borderColor: Colors.primary,
  },
  itemLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  itemLabelSelected: {
    color: Colors.primary,
  },
  viewAllCard: {
    backgroundColor: Colors.surfaceAlt,
    borderStyle: 'dashed',
    justifyContent: 'center',
    minWidth: 75,
  },
  viewAllIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.paleMint,
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
