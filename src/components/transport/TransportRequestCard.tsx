import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TransportRequest } from '../../types/transport.types';
import { TransportStatusBadge } from './TransportStatusBadge';

interface Props {
  request: TransportRequest;
  onPress?: () => void;
  showStatus?: boolean;
}

const SERVICE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  GOODS: { icon: 'cube-outline', color: '#0ea5e9', bg: '#e0f2fe' },
  FURNITURE: { icon: 'bed-outline', color: '#8b5cf6', bg: '#ede9fe' },
  CONSTRUCTION: { icon: 'construct-outline', color: '#f59e0b', bg: '#fef3c7' },
  HEAVY: { icon: 'barbell-outline', color: '#ef4444', bg: '#fee2e2' },
  BACKLOAD: { icon: 'refresh-circle-outline', color: '#10b981', bg: '#d1fae5' },
  EQUIPMENT: { icon: 'hardware-chip-outline', color: '#f97316', bg: '#ffedd5' },
};

const SERVICE_LABELS: Record<string, string> = {
  GOODS: 'بضائع عامة',
  FURNITURE: 'أثاث ومنزليات',
  CONSTRUCTION: 'مواد بناء',
  HEAVY: 'شحن ثقيل',
  BACKLOAD: 'عودة فارغة',
  EQUIPMENT: 'معدات وآليات',
};

function formatRelativeTime(dateString?: string) {
  if (!dateString) return 'الآن';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'منذ لحظات';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `منذ ${diffInDays} يوم`;
  return date.toLocaleDateString('ar-OM', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateShort(dateString?: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric' });
}

export function TransportRequestCard({ request, onPress, showStatus = true }: Props) {
  const config = SERVICE_CONFIG[request.serviceType] || { icon: 'car-outline', color: Colors.primary, bg: Colors.primary + '15' };
  const serviceLabel = SERVICE_LABELS[request.serviceType] || request.serviceType;
  
  const fromLoc = request.fromCity ? `${request.fromGovernorate}، ${request.fromCity}` : request.fromGovernorate;
  const toLoc = request.toCity ? `${request.toGovernorate}، ${request.toCity}` : request.toGovernorate;

  // Format Budget
  let budgetText = 'تواصل للسعر';
  let isNegotiable = true;
  if (request.budgetMin && request.budgetMax) {
    budgetText = `${request.budgetMin} - ${request.budgetMax} ر.ع.`;
    isNegotiable = false;
  } else if (request.budgetMin) {
    budgetText = `من ${request.budgetMin} ر.ع.`;
    isNegotiable = false;
  } else if (request.budgetMax) {
    budgetText = `حتى ${request.budgetMax} ر.ع.`;
    isNegotiable = false;
  }

  const hasQuotes = request.quotesCount != null && request.quotesCount > 0;
  const viewCount = request.viewCount || 0;

  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.serviceTypeRow}>
          <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
            <Ionicons name={config.icon} size={20} color={config.color} />
          </View>
          <View>
            <Text style={styles.serviceTitle}>{serviceLabel}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(request.createdAt)}</Text>
          </View>
        </View>
        {showStatus && <TransportStatusBadge status={request.status} />}
      </View>

      {/* Locations */}
      <View style={styles.locationsContainer}>
        <View style={styles.locationNode}>
          <View style={styles.dotFrom} />
          <Text style={styles.locationText} numberOfLines={1}>{fromLoc}</Text>
        </View>
        <View style={styles.locationLine} />
        <View style={styles.locationNode}>
          <View style={styles.dotTo} />
          <Text style={styles.locationText} numberOfLines={1}>{toLoc}</Text>
        </View>
        
        {/* Subtle background icon for aesthetic */}
        <Ionicons name="map-outline" size={60} color="#f1f5f9" style={styles.bgMapIcon} />
      </View>

      {/* Cargo Description (If any) */}
      {request.cargoDescription ? (
        <View style={styles.cargoBox}>
          <Text style={styles.cargoText} numberOfLines={2}>
            {request.cargoDescription}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {/* Details Row (Info Pills) */}
      <View style={styles.detailsList}>
        {request.scheduledAt ? (
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.infoText}>{formatDateShort(request.scheduledAt)}</Text>
          </View>
        ) : null}

        {viewCount > 0 ? (
          <View style={styles.infoItem}>
            <Ionicons name="eye-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.infoText}>{viewCount}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer Row (Weight, Budget and Quotes) */}
      <View style={styles.footerRow}>
        {request.weightTons ? (
          <View style={[styles.detailPill, styles.pillNeutral]}>
            <Ionicons name="scale-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.detailText}>{request.weightTons} طن</Text>
          </View>
        ) : <View style={{ flex: 1 }} />}

        <View style={[styles.detailPill, isNegotiable ? styles.pillNeutral : styles.pillPrimary]}>
          <Ionicons name="wallet-outline" size={16} color={isNegotiable ? Colors.textMuted : Colors.primary} />
          <Text style={[styles.detailText, !isNegotiable && { color: Colors.primary, fontFamily: 'Almarai_700Bold' }]}>{budgetText}</Text>
        </View>
        
        {request.quotesCount != null && (
          <View style={[styles.detailPill, hasQuotes ? styles.pillActive : styles.pillNeutral]}>
            <Ionicons name={hasQuotes ? "chatbubbles" : "chatbubbles-outline"} size={14} color={hasQuotes ? '#ea580c' : Colors.textMuted} />
            <Text style={[styles.detailText, hasQuotes && { color: '#ea580c', fontFamily: 'Almarai_700Bold' }]}>
              {request.quotesCount} {request.quotesCount === 1 ? 'عرض' : 'عروض'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const softShadow = Platform.select({
  ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...softShadow,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    fontSize: 15,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#0f172a',
    writingDirection: 'rtl',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
    writingDirection: 'rtl',
  },
  locationsContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  bgMapIcon: {
    position: 'absolute',
    left: -10,
    bottom: -10,
    opacity: 0.4,
    transform: [{ rotate: '-15deg' }]
  },
  locationNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 2,
  },
  dotFrom: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  dotTo: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accent,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Almarai_700Bold',
    color: '#334155',
    writingDirection: 'rtl',
    flex: 1,
  },
  locationLine: {
    width: 2,
    height: 12,
    backgroundColor: '#cbd5e1',
    marginVertical: 4,
    marginLeft: 4, // RTL alignment with smaller dot
    borderStyle: 'dashed',
    zIndex: 1,
  },
  cargoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  cargoText: {
    fontSize: 12,
    fontFamily: 'Almarai_400Regular',
    color: '#475569',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  detailsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  cargoPill: {
    flex: 1,
  },
  cargoPillText: {
    fontSize: 12,
    fontFamily: 'Almarai_400Regular',
    color: '#475569',
    flex: 1,
    writingDirection: 'rtl',
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pillNeutral: {
    backgroundColor: '#f8fafc',
  },
  pillPrimary: {
    backgroundColor: Colors.primary + '10',
  },
  pillActive: {
    backgroundColor: '#fff7ed', // orange-50
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Almarai_700Bold',
    color: '#475569',
  },
});

