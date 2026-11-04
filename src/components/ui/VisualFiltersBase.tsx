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
import { FilterGlassTokens } from '../../constants/filterGlassTokens';
import { PhysicalHorizontalTrack } from './PhysicalHorizontalTrack';
import { FilterGlassSurface } from './FilterGlassSurface';
import { type GlassSupport } from '../navigation/glassSupport';

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

export interface VisualFilterItemLike {
  id: string | number;
  label?: string;
  name?: string;
  nameAr?: string | null;
  isSelected?: boolean;
  onPress?: () => void;
}

export interface VisualFilterItem<T = object> extends VisualFilterItemLike {
  id: string;
  payload?: T;
}

export interface VisualFilterTab<TTabId extends string = string, TItem extends VisualFilterItemLike = VisualFilterItemLike> {
  id: TTabId;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  items?: readonly TItem[];
  rows?: 1 | 2;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  hideViewAll?: boolean;
  viewAllLabel?: string;
  /**
   * Method signature syntax (bivariance) is required here by TypeScript design specification:
   * under strictFunctionTypes: true, function property syntax forces parameter contravariance,
   * which prohibits storing tabs with heterogeneous domain item types (e.g. BusManufacturer,
   * CarBrand, EquipmentCategoryItem) in a single tabs array without resorting to `any`.
   * Method signatures enable bivariance, preserving strict type safety within each adapter.
   */
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
  glassSupport?: GlassSupport;
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
  glassSupport,
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
          const colKey = firstItem?.id != null ? String(firstItem.id) : `col-${colIdx}`;

          return (
            <View key={colKey} style={rows === 2 ? s.column : undefined}>
              {col.map((item) => {
                if (currentTab.renderItem) {
                  return currentTab.renderItem(item, Boolean(item.isSelected));
                }

                const config: VisualFilterItemConfig = currentTab.getItemProps
                  ? currentTab.getItemProps(item)
                  : {
                      id: String(item.id),
                      label: item.label || item.name || String(item.id),
                      isSelected: Boolean(item.isSelected),
                      onPress: item.onPress || (() => {}),
                    };

                return (
                  <View
                    key={config.id}
                    style={[
                      s.itemCard,
                      config.isSelected && s.itemCardSelected,
                      config.isSelected && { borderColor: activeColor },
                    ]}
                  >
                    {!config.isSelected && (
                      <FilterGlassSurface
                        testID={`visual-filter-item-glass-${config.id}`}
                        borderRadius={FilterGlassTokens.card.borderRadius}
                        support={glassSupport}
                      />
                    )}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={config.label}
                      accessibilityState={{ selected: Boolean(config.isSelected) }}
                      // Effective itemCard target: visible height is 28pt (text-only) to 39pt (icon box).
                      // hitSlop 8 top/bottom reaches 44pt to 55pt within PhysicalHorizontalTrack (minHeight 42/86pt).
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      style={s.itemCardInner}
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
                  </View>
                );
              })}
            </View>
          );
        })}

        {onViewAll && currentTab && !currentTab.hideViewAll && (
          <View style={rows === 2 ? s.column : undefined}>
            <View
              style={[s.itemCard, s.viewAllCard, rows === 1 && { height: 38 }]}
            >
              <FilterGlassSurface
                testID="visual-filter-view-all-glass"
                borderRadius={FilterGlassTokens.card.borderRadius}
                support={glassSupport}
              />
              <TouchableOpacity
                style={s.viewAllInner}
                onPress={() => onViewAll(currentTab.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={currentTab.viewAllLabel || 'عرض الكل'}
                // Effective viewAll target: visible height is 35pt (double-row) or 38pt (single-row).
                // hitSlop 8 top/bottom reaches 51pt to 54pt within PhysicalHorizontalTrack bounds.
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              >
                <View style={s.viewAllIconBox}>
                  <Ionicons name="apps-outline" size={15} color={activeColor} />
                </View>
                <Text style={[s.viewAllText, { color: activeColor }]}>
                  {currentTab.viewAllLabel || 'عرض الكل'}
                </Text>
              </TouchableOpacity>
            </View>
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
        // Effective tab target: visible height is 27.5pt (paddingVertical 6*2 + lineHeight 15.5).
        // hitSlop 9 top/bottom is bounded by parent segmentedWrapper (minHeight ~34pt), giving effective height ~34pt.
        hitSlop={{ top: 9, bottom: 9, left: 4, right: 4 }}
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
            color={isActive ? activeColor : FilterGlassTokens.tab.inactiveTextColor}
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
        <FilterGlassSurface
          testID="visual-filters-track-glass"
          borderRadius={FilterGlassTokens.tab.trackRadius}
          support={glassSupport}
        />
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
    borderBottomColor: FilterGlassTokens.borderColor,
    paddingBottom: Spacing.space2,
  },
  segmentedWrapper: {
    marginHorizontal: Spacing.space4,
    marginBottom: Spacing.space2,
    marginTop: Spacing.space2,
    backgroundColor: FilterGlassTokens.tab.trackBg,
    borderRadius: FilterGlassTokens.tab.trackRadius,
    borderWidth: FilterGlassTokens.tab.trackBorderWidth,
    borderColor: FilterGlassTokens.tab.trackBorderColor,
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
    backgroundColor: FilterGlassTokens.tab.activeBg,
    ...FilterGlassTokens.tab.activeShadow,
  },
  tabIcon: {
    marginEnd: 2,
  },
  segmentTabText: {
    fontFamily: FilterGlassTokens.tab.inactiveFontFamily,
    fontSize: FilterGlassTokens.tab.fontSize,
    lineHeight: FilterGlassTokens.tab.lineHeight,
    color: FilterGlassTokens.tab.inactiveTextColor,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  segmentTabTextActive: {
    color: FilterGlassTokens.tab.activeTextColor,
    fontFamily: FilterGlassTokens.tab.activeFontFamily,
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
    backgroundColor: FilterGlassTokens.card.bg,
    borderRadius: FilterGlassTokens.card.borderRadius,
    borderWidth: FilterGlassTokens.card.borderWidth,
    borderColor: FilterGlassTokens.card.borderColor,
    ...FilterGlassTokens.card.shadow,
    minWidth: 95,
  },
  itemCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    gap: 6,
  },
  itemCardSelected: {
    backgroundColor: FilterGlassTokens.card.selectedBg,
    borderColor: FilterGlassTokens.card.selectedBorderColor,
  },
  itemLabel: {
    fontFamily: FilterGlassTokens.card.fontFamily,
    fontSize: FilterGlassTokens.card.fontSize,
    lineHeight: FilterGlassTokens.card.lineHeight,
    color: FilterGlassTokens.card.textColor,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  itemLabelSelected: {
    color: FilterGlassTokens.card.selectedTextColor,
  },
  viewAllCard: {
    backgroundColor: FilterGlassTokens.card.viewAllBg,
    borderColor: FilterGlassTokens.card.borderColor,
    borderStyle: 'dashed',
    minWidth: 75,
  },
  viewAllInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5.5,
    gap: 6,
    height: '100%',
  },
  viewAllIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: FilterGlassTokens.card.viewAllIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllText: {
    fontFamily: FilterGlassTokens.card.fontFamily,
    fontSize: FilterGlassTokens.card.fontSize,
    lineHeight: FilterGlassTokens.card.lineHeight,
    color: FilterGlassTokens.card.viewAllTextColor,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  skeletonPill: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: FilterGlassTokens.card.borderColor,
    minWidth: 95,
  },
});
