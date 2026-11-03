import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="quick-filter-modal-close"
            >
              <Ionicons name="close" size={24} color={Colors.textMuted} />
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '65%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: Spacing.space4,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
      android: { elevation: 10 },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space3,
    paddingBottom: Spacing.space3,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.03)',
  },
  modalOptionTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
});
