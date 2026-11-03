import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { FilterGlassTokens } from '../../constants/filterGlassTokens';
import { FilterGlassSurface } from '../ui/FilterGlassSurface';
import { quickFilterModalStyles } from './quickFilterModalStyles';

export interface QuickFilterOption {
  id: string;
  label: string;
}

export interface QuickFilterModalProps {
  visible: boolean;
  title: string;
  options: QuickFilterOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  accentColor?: string;
}

export function QuickFilterModal({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
  accentColor = Colors.primary,
}: QuickFilterModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
        testID="quick-filter-modal-overlay"
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <FilterGlassSurface
            testID="quick-filter-modal-glass"
            borderRadius={FilterGlassTokens.sheet.cardRadius}
          />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="quick-filter-modal-close"
            >
              <Ionicons name="close" size={24} color={FilterGlassTokens.sheet.closeIconColor} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedId === item.id;
              return (
                <TouchableOpacity
                  style={styles.modalOptionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                  testID={`quick-filter-option-${item.id}`}
                >
                  <Text
                    style={[
                      styles.modalOptionTxt,
                      isSelected && { color: accentColor },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={20} color={accentColor} testID="checkmark-icon" />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = quickFilterModalStyles;
