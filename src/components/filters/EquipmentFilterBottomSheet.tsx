import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { Radius } from '../../constants/radius';

interface FilterState {
  listingType?: string;
  governorate?: string;
  city?: string;
  priceMin?: string;
  priceMax?: string;
  condition?: string;
  equipmentType?: string;
}

interface EquipmentFilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: FilterState;
  onApplyFilters: (filters: FilterState) => void;
}

export function EquipmentFilterBottomSheet({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
}: EquipmentFilterBottomSheetProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>تصفية المعدات</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.content}>
            <Text style={styles.placeholder}>سيتم إضافة فلاتر مخصصة للمعدات قريباً هنا (مثل الفئة الدقيقة، قوة المحرك، سعة الرفع، إلخ).</Text>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text style={styles.clearBtnText}>إعادة تعيين</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>تطبيق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: Spacing.space4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.space4,
    paddingBottom: Spacing.space2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold', 
    fontSize: 18,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  placeholder: {
    fontFamily: 'Almarai_400Regular', 
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.space3,
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  clearBtnText: {
    fontFamily: 'Almarai_700Bold', 
    color: Colors.text,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    backgroundColor: Colors.equipmentPrimary,
    alignItems: 'center',
  },
  applyBtnText: {
    fontFamily: 'Almarai_700Bold', 
    color: Colors.white,
  },
});
