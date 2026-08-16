import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';
import { AppButton } from './AppButton';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MapLocationPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  title?: string;
}

const MUSCAT_LAT = 23.5880;
const MUSCAT_LNG = 58.3829;

export function MapLocationPicker({
  isVisible,
  onClose,
  onConfirm,
  initialLat,
  initialLng,
  title = "تحديد الموقع على الخريطة"
}: MapLocationPickerProps) {
  return (
    <Modal visible={isVisible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          <Ionicons name="map-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.mockText}>الخريطة غير مدعومة في إصدار الويب.</Text>
          <Text style={styles.mockText}>في التطبيق الحقيقي سيتم فتح الخريطة هنا.</Text>
        </View>
        <View style={styles.footer}>
          <AppButton 
            title="استخدام الموقع الافتراضي (مسقط)" 
            onPress={() => onConfirm(MUSCAT_LAT, MUSCAT_LNG)} 
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.space4,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.text,
  },
  closeBtn: {
    padding: Spacing.space2,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.space4,
    gap: Spacing.space4,
  },
  mockText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    padding: Spacing.space4,
    borderTopWidth: 1,
    borderColor: Colors.border,
  }
});
