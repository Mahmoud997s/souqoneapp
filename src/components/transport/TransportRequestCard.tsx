import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TransportRequest } from '../../types/transport.types';
import { TransportStatusBadge } from './TransportStatusBadge';
import { getServiceLabel } from '../../constants/transport';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence } from 'react-native-reanimated';

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.5, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.pulseContainer}>
      <Animated.View style={[styles.pulseRing, { backgroundColor: color }, animatedStyle]} />
      <View style={[styles.pulseCore, { backgroundColor: color }]} />
    </View>
  );
}

function AnimatedTruck() {
  const translateX = useSharedValue(8);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-6, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scaleX: -1 }],
  }));

  return (
    <View style={styles.truckIconContainer}>
      <Animated.View style={animatedStyle}>
        <MaterialCommunityIcons name="truck-fast" size={20} color="#94a3b8" />
      </Animated.View>
    </View>
  );
}

interface Props {
  request: TransportRequest;
  onPress?: () => void;
  showStatus?: boolean;
  onDelete?: () => void;
}

const SERVICE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  GOODS: { icon: 'package-variant-closed', color: '#10b981', bg: '#ecfdf5' },
  FURNITURE: { icon: 'sofa-outline', color: '#8b5cf6', bg: '#f5f3ff' },
  CONSTRUCTION: { icon: 'crane', color: '#64748b', bg: '#f8fafc' },
  HEAVY: { icon: 'truck-trailer', color: '#ef4444', bg: '#fef2f2' },
  BACKLOAD: { icon: 'truck-check-outline', color: '#d946ef', bg: '#fdf4ff' },
  EQUIPMENT: { icon: 'excavator', color: '#f59e0b', bg: '#fffbeb' },
  CARS: { icon: 'tow-truck', color: '#3b82f6', bg: '#eff6ff' },
  LIVESTOCK: { icon: 'cow', color: '#ec4899', bg: '#fdf2f8' },
};

function formatRelativeTime(dateString?: string) {
  if (!dateString) return 'الآن';
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: ar });
  } catch (e) {
    return 'مؤخراً';
  }
}

function formatDateShort(dateString?: string) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isToday(date)) return `اليوم، ${format(date, 'p', { locale: ar })}`;
    if (isTomorrow(date)) return `غداً، ${format(date, 'p', { locale: ar })}`;
    return format(date, 'd MMM، p', { locale: ar });
  } catch (e) {
    return '';
  }
}

export function TransportRequestCard({ request, onPress, showStatus = true, onDelete }: Props) {
  const config = SERVICE_CONFIG[request.serviceType] || { icon: 'truck-outline', color: Colors.primary, bg: Colors.primary + '15' };
  const serviceLabelText = getServiceLabel(request.serviceType);
  
  const fromLoc = request.fromCity ? `${request.fromGovernorate}، ${request.fromCity}` : request.fromGovernorate;
  const toLoc = request.toCity ? `${request.toGovernorate}، ${request.toCity}` : request.toGovernorate;

  // Format Budget
  let budgetText = 'تواصل للسعر';
  let isNegotiable = true;
  if (request.budgetMin && request.budgetMax) {
    budgetText = `من ${request.budgetMin} إلى ${request.budgetMax} ر.ع.`;
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
            <MaterialCommunityIcons name={config.icon} size={22} color={config.color} />
          </View>
          <View>
            <Text style={styles.serviceTitle}>{serviceLabelText}</Text>
            <Text style={styles.timeText}>{formatRelativeTime(request.createdAt)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {showStatus && <TransportStatusBadge status={request.status} />}
          {onDelete && (
            <Pressable 
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation(); // Prevent triggering card onPress
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={16} color="#ef4444" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Cargo Description (If any) */}
      {request.cargoDescription ? (
        <View style={styles.cargoBox}>
          <Text style={styles.cargoText} numberOfLines={2}>
            {request.cargoDescription}
          </Text>
        </View>
      ) : null}

      {/* Locations - Premium Horizontal Path */}
      <View style={styles.locationsContainerHorizontal}>
        
        {/* From (Right) */}
        <View style={styles.locationCol}>
          <PulsingDot color={Colors.primary} />
          <Text style={styles.locationLabel}>نقطة التحميل</Text>
          <Text style={styles.locationTextHorizontal} numberOfLines={1}>{fromLoc}</Text>
        </View>

        {/* Connecting Line (Middle) */}
        <View style={styles.connectingLineContainer}>
          <View style={styles.horizontalLine} />
          {/* Animated truck pointing Left and moving */}
          <AnimatedTruck />
        </View>

        {/* To (Left) */}
        <View style={styles.locationCol}>
          <View style={styles.destinationPinHorizontal}>
            <MaterialCommunityIcons name="map-marker" size={20} color={Colors.accent} />
          </View>
          <Text style={styles.locationLabel}>الوجهة</Text>
          <Text style={styles.locationTextHorizontal} numberOfLines={1}>{toLoc}</Text>
        </View>

        {/* Subtle background icon for aesthetic */}
        <MaterialCommunityIcons name="map-marker-path" size={80} color="#f8fafc" style={styles.bgMapIcon} />
      </View>

      <View style={styles.divider} />

      {/* Details Row (Info Pills) */}
      <View style={styles.detailsList}>
        {request.scheduledAt ? (
          <View style={[styles.detailPill, styles.pillBlue]}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={14} color="#3b82f6" />
            <Text style={[styles.detailText, { color: '#3b82f6' }]}>{formatDateShort(request.scheduledAt)}</Text>
          </View>
        ) : null}

        {request.weightTons ? (
          <View style={[styles.detailPill, styles.pillNeutral]}>
            <MaterialCommunityIcons name="weight-kilogram" size={14} color="#64748b" />
            <Text style={styles.detailText}>{request.weightTons} طن</Text>
          </View>
        ) : null}

        {request.requiresHelper ? (
          <View style={[styles.detailPill, styles.pillAmber]}>
            <MaterialCommunityIcons name="account-hard-hat" size={14} color="#d97706" />
            <Text style={[styles.detailText, { color: '#d97706' }]}>مع عمال</Text>
          </View>
        ) : null}

        {viewCount > 0 ? (
          <View style={[styles.detailPill, styles.pillNeutral]}>
            <Ionicons name="eye-outline" size={14} color="#64748b" />
            <Text style={styles.detailText}>{viewCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.divider, { marginTop: 4 }]} />

      {/* Footer Row (Budget and Quotes) */}
      <View style={styles.footerRow}>
        <View style={[styles.detailPill, isNegotiable ? styles.pillNeutral : styles.pillGreen, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={18} color={isNegotiable ? '#64748b' : '#059669'} />
          <Text style={[styles.budgetValText, !isNegotiable && { color: '#059669' }]}>{budgetText}</Text>
        </View>
        
        {request.quotesCount != null && (
          <View style={[styles.detailPill, hasQuotes ? styles.pillOrange : styles.pillNeutral]}>
            <Ionicons name={hasQuotes ? "chatbubbles" : "chatbubbles-outline"} size={16} color={hasQuotes ? '#ea580c' : '#64748b'} />
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
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 22,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  locationsContainerHorizontal: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  bgMapIcon: {
    position: 'absolute',
    left: -15,
    top: -10,
    opacity: 0.8,
    transform: [{ rotate: '-10deg' }]
  },
  pulseContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  pulseCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  locationCol: {
    flex: 1,
    alignItems: 'center',
    zIndex: 2,
  },
  destinationPinHorizontal: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 10,
    fontFamily: 'Almarai_400Regular',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: 16,
  },
  locationTextHorizontal: {
    fontSize: 13,
    fontFamily: 'Almarai_700Bold',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 20,
  },
  connectingLineContainer: {
    flex: 1,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginHorizontal: 4,
  },
  horizontalLine: {
    position: 'absolute',
    width: '100%',
    height: 1.5,
    backgroundColor: '#e2e8f0',
    top: '50%',
  },
  truckIconContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    lineHeight: 20,
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
    gap: 8,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    lineHeight: 18,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pillNeutral: {
    backgroundColor: '#f8fafc', // slate-50
  },
  pillBlue: {
    backgroundColor: '#eff6ff', // blue-50
  },
  pillAmber: {
    backgroundColor: '#fffbeb', // amber-50
  },
  pillGreen: {
    backgroundColor: '#ecfdf5', // emerald-50
  },
  pillOrange: {
    backgroundColor: '#fff7ed', // orange-50
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'Almarai_700Bold',
    color: '#475569',
    lineHeight: 18,
  },
  budgetValText: {
    fontSize: 13,
    fontFamily: 'Almarai_800ExtraBold',
    color: '#64748b',
    lineHeight: 20,
  },
});

