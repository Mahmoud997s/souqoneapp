import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { CardSystem } from '../../constants/cardSystem';
import { TransportRequest } from '../../types/transport.types';
import { TransportStatusBadge } from './TransportStatusBadge';
import { getServiceLabel } from '../../constants/transport';
import { format, formatDistanceToNow, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';

function PulsingDot({ color }: { color: string }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.2, { duration: 1500, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1500, easing: Easing.out(Easing.ease) }),
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
  const translateX = useSharedValue(12);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-12, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
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
        <MaterialCommunityIcons name="truck-fast" size={15} color={Colors.primary} />
      </Animated.View>
    </View>
  );
}

interface Props {
  request: TransportRequest;
  onPress?: () => void;
  showStatus?: boolean;
  onDelete?: () => void;
  maxPills?: number;
}

const SERVICE_CONFIG: Record<string, { icon: any }> = {
  GOODS: { icon: 'package-variant-closed' },
  FURNITURE: { icon: 'sofa-outline' },
  CONSTRUCTION: { icon: 'crane' },
  HEAVY: { icon: 'truck-trailer' },
  BACKLOAD: { icon: 'truck-check-outline' },
  EQUIPMENT: { icon: 'excavator' },
  CARS: { icon: 'tow-truck' },
  LIVESTOCK: { icon: 'cow' },
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

export function TransportRequestCard({
  request,
  onPress,
  showStatus = true,
  onDelete,
  maxPills = 3,
}: Props) {
  const config = SERVICE_CONFIG[request.serviceType] || { icon: 'truck-outline' };
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

  // Prioritized pills system (Configurable maxPills with +N remainder for landing)
  const detailPills: React.ReactNode[] = [];
  if (request.timingType === 'asap') {
    detailPills.push(
      <View key="asap" style={[styles.detailPill, styles.pillOrange]}>
        <MaterialCommunityIcons name="lightning-bolt" size={12} color="#ea580c" />
        <Text style={[styles.detailText, { color: '#ea580c' }]} numberOfLines={1}>فوري</Text>
      </View>
    );
  }
  if (request.scheduledAt || request.scheduledDate) {
    detailPills.push(
      <View key="sched" style={[styles.detailPill, styles.pillBlue]}>
        <MaterialCommunityIcons name="calendar-clock-outline" size={12} color="#3b82f6" />
        <Text style={[styles.detailText, { color: '#3b82f6' }]} numberOfLines={1}>
          {formatDateShort(request.scheduledAt || request.scheduledDate)}
        </Text>
      </View>
    );
  }
  if (request.weightTons) {
    detailPills.push(
      <View key="weight" style={[styles.detailPill, styles.pillNeutral]}>
        <MaterialCommunityIcons name="weight-kilogram" size={12} color="#64748b" />
        <Text style={styles.detailText} numberOfLines={1}>{request.weightTons} طن</Text>
      </View>
    );
  }
  if (request.requiresHelper) {
    detailPills.push(
      <View key="helper" style={[styles.detailPill, styles.pillAmber]}>
        <MaterialCommunityIcons name="account-hard-hat" size={12} color="#d97706" />
        <Text style={[styles.detailText, { color: '#d97706' }]} numberOfLines={1}>مع عمال</Text>
      </View>
    );
  }
  if (request.isFlexible) {
    detailPills.push(
      <View key="flex" style={[styles.detailPill, styles.pillGreen]}>
        <Ionicons name="time-outline" size={12} color="#059669" />
        <Text style={[styles.detailText, { color: '#059669' }]} numberOfLines={1}>مرن</Text>
      </View>
    );
  }

  // Fallback pills if no specific details are set (guarantees identical card height across all cards)
  if (detailPills.length === 0) {
    detailPills.push(
      <View key="direct" style={[styles.detailPill, styles.pillNeutral]}>
        <MaterialCommunityIcons name="cube-send" size={12} color="#64748b" />
        <Text style={styles.detailText} numberOfLines={1}>طلب مباشر</Text>
      </View>
    );
    detailPills.push(
      <View key="ready" style={[styles.detailPill, styles.pillGreen]}>
        <Ionicons name="checkmark-circle-outline" size={12} color="#059669" />
        <Text style={[styles.detailText, { color: '#059669' }]} numberOfLines={1}>متاح للشحن</Text>
      </View>
    );
  }

  const visiblePills = detailPills.slice(0, maxPills);
  const extraCount = detailPills.length > maxPills ? detailPills.length - maxPills : 0;

  return (
    <Pressable 
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.serviceTypeRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name={config.icon} size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.serviceTitle} numberOfLines={1}>{serviceLabelText}</Text>
            <Text style={styles.timeText} numberOfLines={1}>{formatRelativeTime(request.createdAt)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {showStatus && <TransportStatusBadge status={request.status} />}
          {onDelete && (
            <Pressable 
              style={styles.deleteBtn}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#ef4444" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Cargo Description (Single line strictly) */}
      {request.cargoDescription ? (
        <View style={styles.cargoBox}>
          <Text style={styles.cargoText} numberOfLines={1}>
            {request.cargoDescription}
          </Text>
        </View>
      ) : null}

      {/* Locations - Compact Route Path */}
      <View style={styles.locationsContainerHorizontal}>
        {/* From (Right in RTL) */}
        <View style={styles.locationCol}>
          <PulsingDot color={Colors.primary} />
          <Text style={styles.locationLabel}>التحميل</Text>
          <Text style={styles.locationTextHorizontal} numberOfLines={1}>{fromLoc}</Text>
        </View>

        {/* Connecting Line (Middle) */}
        <View style={styles.connectingLineContainer}>
          <View style={styles.horizontalLine} />
          <AnimatedTruck />
        </View>

        {/* To (Left in RTL) */}
        <View style={styles.locationCol}>
          <View style={styles.destinationPinHorizontal}>
            <MaterialCommunityIcons name="map-marker" size={12} color={Colors.accent} />
          </View>
          <Text style={styles.locationLabel}>الوجهة</Text>
          <Text style={styles.locationTextHorizontal} numberOfLines={1}>{toLoc}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Details Row (Always rendered to guarantee identical card height) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.detailsList}
        style={styles.detailsScroll}
      >
        {visiblePills}
        {extraCount > 0 && (
          <View style={[styles.detailPill, styles.pillNeutral]}>
            <Text style={styles.detailText}>+{extraCount}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.divider} />

      {/* Footer Row (Budget, Quotes, and Views) */}
      <View style={styles.footerRow}>
        <View style={[styles.detailPill, isNegotiable ? styles.pillNeutral : styles.pillGreen, { flex: 1 }]}>
          <Ionicons name="wallet-outline" size={14} color={isNegotiable ? Colors.textMuted : Colors.primary} />
          <Text style={[styles.budgetValText, !isNegotiable && { color: Colors.primary }]} numberOfLines={1}>{budgetText}</Text>
        </View>
        
        {request.quotesCount != null && request.quotesCount > 0 && (
          <View style={[styles.detailPill, styles.pillOrange]}>
            <Ionicons name="chatbubbles" size={13} color="#ea580c" />
            <Text style={[styles.detailText, { color: '#ea580c', fontFamily: 'Almarai_700Bold' }]} numberOfLines={1}>
              {request.quotesCount} {request.quotesCount === 1 ? 'عرض' : 'عروض'}
            </Text>
          </View>
        )}

        {request.viewCount != null && request.viewCount > 0 && (
          <View style={[styles.detailPill, styles.pillNeutral]}>
            <Ionicons name="eye-outline" size={13} color="#64748b" />
            <Text style={styles.detailText} numberOfLines={1}>
              {request.viewCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    padding: CardSystem.padding.dense,
    minHeight: 215,
    justifyContent: 'space-between',
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: {
    ...CardSystem.typography.title,
    fontSize: 13.5,
    color: Colors.text,
    writingDirection: 'rtl',
    lineHeight: 19,
  },
  timeText: {
    ...CardSystem.typography.subtitle,
    color: Colors.textMuted,
    marginTop: 1,
    writingDirection: 'rtl',
  },
  locationsContainerHorizontal: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    marginBottom: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  pulseContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pulseCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1,
    borderColor: '#fff',
  },
  locationCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  destinationPinHorizontal: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationLabel: {
    fontSize: 9.5,
    fontFamily: 'Almarai_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 1,
    textAlign: 'center',
    lineHeight: 13,
  },
  locationTextHorizontal: {
    fontSize: 11.5,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
  connectingLineContainer: {
    flex: 1,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    marginHorizontal: 2,
  },
  horizontalLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: Colors.border,
    top: '50%',
  },
  truckIconContainer: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cargoBox: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    height: 26,
    justifyContent: 'center',
    marginBottom: 8,
  },
  cargoText: {
    fontSize: 11,
    fontFamily: 'Almarai_400Regular',
    color: Colors.text,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },
  detailsScroll: {
    marginVertical: 2,
  },
  detailsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: CardSystem.gap.secondary,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: CardSystem.radius.inner,
  },
  pillNeutral: CardSystem.styles.pillNeutral,
  pillBlue: CardSystem.styles.pillBlue,
  pillAmber: CardSystem.styles.pillAmber,
  pillGreen: CardSystem.styles.pillGreen,
  pillOrange: CardSystem.styles.pillOrange,
  detailText: {
    ...CardSystem.typography.pillText,
    color: Colors.text,
    writingDirection: 'rtl',
  },
  budgetValText: {
    fontSize: 11.5,
    fontFamily: 'Almarai_800ExtraBold',
    color: Colors.text,
    lineHeight: 16,
    writingDirection: 'rtl',
  },
});


