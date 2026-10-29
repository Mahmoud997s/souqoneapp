import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TransportRequestStatus } from '../../types/transport.types';
import { getRequestStatusLabel } from '../../constants/transport';

interface BadgeProps {
  status: TransportRequestStatus;
}

const STATUS_CONFIG: Record<TransportRequestStatus, { label: string; color: string; bg: string }> = {
  OPEN: { label: 'مفتوح', color: Colors.primary, bg: Colors.primary + '15' },
  QUOTED: { label: 'وصلت عروض', color: '#b45309', bg: '#fef3c7' }, // Amber
  ACCEPTED: { label: 'مقبول', color: '#15803d', bg: '#dcfce7' }, // Green
  IN_PROGRESS: { label: 'جارٍ التنفيذ', color: '#1d4ed8', bg: '#dbeafe' }, // Blue
  COMPLETED: { label: 'مكتمل', color: '#4338ca', bg: '#e0e7ff' }, // Indigo
  CANCELLED: { label: 'ملغى', color: Colors.error, bg: Colors.error + '15' },
  EXPIRED: { label: 'منتهي', color: Colors.textMuted, bg: Colors.surface },
};

export function TransportStatusBadge({ status }: BadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.OPEN;
  const label = getRequestStatusLabel(status);

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontFamily: 'Almarai_700Bold',
    paddingTop: 4,
    paddingBottom: 4,
  },
});
