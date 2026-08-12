import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { SERVICE_TYPES } from '../../constants/services';

export interface ServicesVisualFiltersProps {
  onSelectFilter: (type: 'serviceType', valueId: string, valueName?: string) => void;
  selectedServiceType?: string;
}

// Enhance service types with colors for UI
const ENHANCED_SERVICE_TYPES = SERVICE_TYPES.map(type => {
  let color = '#3b82f6';
  let bg = '#eff6ff';
  
  if (type.id === 'MAINTENANCE') { color = '#ea580c'; bg = '#ffedd5'; }
  else if (type.id === 'CLEANING') { color = '#0891b2'; bg = '#cffafe'; }
  else if (type.id === 'MODIFICATION') { color = '#dc2626'; bg = '#fee2e2'; }
  else if (type.id === 'INSPECTION') { color = '#eab308'; bg = '#fef9c3'; }
  else if (type.id === 'BODYWORK') { color = '#9333ea'; bg = '#f3e8ff'; }
  
  return { ...type, color, bg };
});

export function ServicesVisualFilters({
  onSelectFilter,
  selectedServiceType,
}: ServicesVisualFiltersProps) {

  const renderHorizontalGrid = () => {
    const columns = [];
    for (let i = 0; i < ENHANCED_SERVICE_TYPES.length; i += 2) {
      columns.push(ENHANCED_SERVICE_TYPES.slice(i, i + 2));
    }

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {columns.map((col, colIdx) => (
          <View key={colIdx} style={styles.column}>
            {col.map((item) => {
              const isSelected = selectedServiceType === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isSelected) {
                      onSelectFilter('serviceType', '');
                    } else {
                      onSelectFilter('serviceType', item.id, item.label);
                    }
                  }}
                >
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: isSelected ? Colors.primary : item.bg },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any || 'construct-outline'}
                      size={14}
                      color={isSelected ? Colors.white : item.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.itemLabel,
                      isSelected && styles.itemLabelSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── CONTENT AREA ── */}
      <View style={styles.contentArea}>
        {renderHorizontalGrid()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  contentArea: {
    minHeight: 70,
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
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
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
});
