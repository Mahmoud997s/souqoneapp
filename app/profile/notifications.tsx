import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, RefreshControl, Pressable, SectionList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  useReducedMotion,
  Easing
} from 'react-native-reanimated'
import { Swipeable } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { TopBarGlassSurface } from '../../src/components/ui/TopBarGlassSurface'
import { GlassSurface, useGlassSupport, type GlassSupport } from '../../src/components/navigation/glassSupport'
import { CardSystem } from '../../src/constants/cardSystem'
import { TopBarTokens } from '../../src/constants/topBarTokens'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Typography } from '../../src/constants/typography'
import { useNotifications, useMarkAllRead, useMarkNotificationRead, useDeleteNotification } from '../../src/hooks/useProfile'
import { navigateFromNotification } from '../../src/utils/notificationRouter'
import { StaleDataBanner } from '../../src/components/listing-detail/StaleDataBanner'
import { getListErrorProps } from '../../src/utils/getListErrorProps'
import { FEATURES } from '../../src/constants/features'

export const NOTIFICATIONS_EMPTY_CTA_ROUTE = '/(tabs)/search' as const

export function cleanNotificationTitle(title?: string | null): string {
  if (!title) return ''
  return title.replace(/\u2705\uFE0F?/g, '').replace(/\s{2,}/g, ' ').trim()
}

export type NotificationVisualConfig = {
  label: string
  icon: string
  color: string
  bg: string
}

const NOTIFICATION_VISUAL_MAP: Record<string, NotificationVisualConfig> = {
  LISTING_CREATED:        { label: 'إعلان جديد',   icon: 'add-circle-outline',       color: '#10B981', bg: '#ECFDF5' },
  LISTING_UPDATED:        { label: 'تحديث إعلان',  icon: 'refresh-circle-outline',   color: '#009CB5', bg: '#ECF8FA' },
  LISTING_SOLD:           { label: 'تم البيع',     icon: 'bag-check-outline',        color: '#10B981', bg: '#ECFDF5' },
  LISTING_DELETED:        { label: 'حذف إعلان',    icon: 'trash-outline',            color: '#EF4444', bg: '#FEF2F2' },
  LISTING_STATUS_CHANGED: { label: 'تغيير الحالة', icon: 'swap-horizontal-outline',  color: '#D97706', bg: '#FFFBEB' },
  LISTING_FAVORITED:      { label: 'مفضلة',        icon: 'heart-outline',            color: '#EF4444', bg: '#FEF2F2' },
  PRICE_DROP:             { label: 'تخفيض سعر',    icon: 'pricetag-outline',         color: '#F97316', bg: '#FFF7ED' },
  MESSAGE:                { label: 'رسالة',        icon: 'chatbubble-ellipses-outline', color: '#3B82F6', bg: '#EFF6FF' },
  PAYMENT_SUCCESS:        { label: 'دفع',          icon: 'card-outline',             color: '#10B981', bg: '#ECFDF5' },
  SUBSCRIPTION_ACTIVATED: { label: 'اشتراك',       icon: 'card-outline',             color: '#10B981', bg: '#ECFDF5' },
  REVIEW_RECEIVED:        { label: 'تقييم',        icon: 'star-outline',             color: '#D97706', bg: '#FFFBEB' },
  REVIEW_REMINDER:        { label: 'تذكير تقييم',  icon: 'star-outline',             color: '#D97706', bg: '#FFFBEB' },
  SYSTEM:                 { label: 'نظام',         icon: 'notifications-outline',    color: '#64748B', bg: '#F1F5F9' },
  // Legacy lowercase keys preserved for backward compatibility (via uppercase normalization)
  LISTING:                { label: 'إعلان',        icon: 'megaphone-outline',        color: '#8B5CF6', bg: '#F5F3FF' },
  PAYMENT:                { label: 'دفع',          icon: 'card-outline',             color: '#10B981', bg: '#ECFDF5' },
  APPROVAL:               { label: 'موافقة',       icon: 'checkmark-circle-outline', color: '#10B981', bg: '#ECFDF5' },
  WARNING:                { label: 'تنبيه',        icon: 'warning-outline',          color: '#EF4444', bg: '#FEF2F2' },
}

export function resolveNotificationVisualConfig(type?: string | null): NotificationVisualConfig {
  const key = (type ?? '').trim().toUpperCase()
  return NOTIFICATION_VISUAL_MAP[key] ?? NOTIFICATION_VISUAL_MAP.SYSTEM
}

function formatTime(iso: string) {
  if (!iso) return 'غير معروف'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'غير معروف'
  
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (mins < 1) return 'الآن'
  
  if (mins < 60) {
    if (mins === 1) return 'منذ دقيقة'
    if (mins === 2) return 'منذ دقيقتين'
    if (mins <= 10) return `منذ ${mins} دقائق`
    return `منذ ${mins} دقيقة`
  }
  
  if (hours < 24) {
    if (hours === 1) return 'منذ ساعة'
    if (hours === 2) return 'منذ ساعتين'
    if (hours <= 10) return `منذ ${hours} ساعات`
    return `منذ ${hours} ساعة`
  }
  
  if (days === 1) return 'أمس'
  if (days === 2) return 'منذ يومين'
  if (days <= 10) return `منذ ${days} أيام`
  if (days < 30) return `منذ ${days} يوماً`
  
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

const FILTERS = [
  { label: 'الكل', icon: 'grid-outline' },
  { label: 'غير مقروءة', icon: 'mail-unread-outline' },
  { label: 'رسائل', icon: 'chatbubble-ellipses-outline' },
  { label: 'إعلانات', icon: 'megaphone-outline' },
  ...(FEATURES.PAYMENTS_ENABLED ? [{ label: 'مدفوعات', icon: 'card-outline' }] : []),
  { label: 'موافقات', icon: 'checkmark-circle-outline' },
  { label: 'تنبيهات', icon: 'warning-outline' },
  { label: 'نظام', icon: 'information-circle-outline' }
]

function NotificationSkeleton({ reducedMotion }: { reducedMotion: boolean }) {
  const opacity = useSharedValue(reducedMotion ? 0.65 : 0.5)

  useEffect(() => {
    if (reducedMotion) {
      opacity.value = 0.65
      return
    }
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.ease }),
        withTiming(0.5, { duration: 800, easing: Easing.ease })
      ),
      -1,
      true
    )
  }, [reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View style={[s.card, s.skeletonCard, animatedStyle, { borderColor: 'transparent', shadowOpacity: 0 }]}>
      <View style={s.cardRow}>
        <View style={[s.iconBox, { backgroundColor: '#F1F5F9' }]} />
        <View style={s.contentCol}>
          <View style={[s.titleRow, { marginTop: 6 }]}>
            <View style={{ width: 120, height: 14, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
            <View style={{ width: 50, height: 10, backgroundColor: '#F1F5F9', borderRadius: 4 }} />
          </View>
          <View style={{ width: '100%', height: 12, backgroundColor: '#F8FAFC', borderRadius: 4, marginTop: 8 }} />
          <View style={{ width: '70%', height: 12, backgroundColor: '#F8FAFC', borderRadius: 4, marginTop: 6 }} />
        </View>
      </View>
    </Animated.View>
  )
}

const NotificationCard = React.memo(({
  item,
  onPress,
  onDelete,
  glassSupport,
  reducedMotion,
}: {
  item: any
  onPress: (item: any) => void
  onDelete: (id: string) => void
  glassSupport: GlassSupport
  reducedMotion: boolean
}) => {
  const config = resolveNotificationVisualConfig(item.type)
  const displayTitle = cleanNotificationTitle(item.title)

  const renderRightActions = () => (
    <View style={s.deleteActionContainer}>
      <TouchableOpacity
        style={s.deleteCircle}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          onDelete(item.id)
        }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="حذف الإشعار"
      >
        <Ionicons name="trash-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </View>
  )

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(180)}>
      <Swipeable
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
        overshootFriction={8}
        containerStyle={{ overflow: 'visible' }}
        onSwipeableOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View style={[s.card, !item.isRead && s.cardUnread]}>
          <GlassSurface
            testID={`notification-card-glass-${item.id}`}
            borderRadius={CardSystem.radius.outer}
            glassEffectStyle="clear"
            tintOverlayColor={CardSystem.glass.cardTint}
            noBorder={true}
            support={glassSupport}
          />
          {!item.isRead && <View style={s.unreadBar} pointerEvents="none" />}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => onPress(item)}
            style={s.cardTouchable}
          >
            <View style={s.cardRow}>
              <View style={[s.iconBox, { backgroundColor: config.bg }]}>
                <Ionicons name={config.icon as any} size={22} color={config.color} />
              </View>

              <View style={s.contentCol}>
                <View style={s.titleRow}>
                  <View style={s.titleWrap}>
                    {!item.isRead && <View style={s.newDot} />}
                    <Text style={s.cardTitle} numberOfLines={2}>
                      {displayTitle}
                    </Text>
                  </View>
                  <Text style={s.timeText}>{formatTime(item.createdAt)}</Text>
                </View>

                <Text style={s.bodyText} numberOfLines={2}>
                  {item.body}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Swipeable>
    </Animated.View>
  )
}, (prev, next) =>
  prev.item.isRead === next.item.isRead &&
  prev.item.id === next.item.id &&
  prev.item.title === next.item.title &&
  prev.item.type === next.item.type &&
  prev.reducedMotion === next.reducedMotion
)

function groupNotifications(notifs: any[]) {
  const groups: Record<string, any[]> = {
    'اليوم': [],
    'أمس': [],
    'هذا الأسبوع': [],
    'أقدم': []
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  
  notifs.forEach(n => {
    const d = new Date(n.createdAt)
    if (d >= today) groups['اليوم'].push(n)
    else if (d >= yesterday) groups['أمس'].push(n)
    else if (d >= lastWeek) groups['هذا الأسبوع'].push(n)
    else groups['أقدم'].push(n)
  })
  
  return [
    { title: 'اليوم', data: groups['اليوم'] },
    { title: 'أمس', data: groups['أمس'] },
    { title: 'هذا الأسبوع', data: groups['هذا الأسبوع'] },
    { title: 'أقدم', data: groups['أقدم'] },
  ].filter(g => g.data.length > 0)
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('الكل')
  const glassSupport = useGlassSupport()
  const reducedMotion = typeof useReducedMotion === 'function' ? Boolean(useReducedMotion()) : false
  
  const { 
    data: infiniteData, 
    isLoading,
    isError,
    error,
    isRefetchError,
    isRefetching, 
    refetch, 
    fetchNextPage, 
    hasNextPage 
  } = useNotifications()
  
  const notifs = useMemo(() => infiniteData?.pages?.flatMap((p: any) => p.items) ?? [], [infiniteData])

  const { mutate: markAllRead, isPending: marking } = useMarkAllRead()
  const { mutate: markRead } = useMarkNotificationRead()
  const { mutate: deleteNotification } = useDeleteNotification()

  const isFilterVisible = useSharedValue(1)

  const animatedFilterStyle = useAnimatedStyle(() => {
    return {
      height: isFilterVisible.value ? 48 : 0,
      opacity: isFilterVisible.value,
      transform: [
        { translateY: isFilterVisible.value ? 0 : -10 }
      ],
      overflow: 'hidden',
    }
  })

  const handleScroll = (event: any) => {
    const currentY = event.nativeEvent.contentOffset.y
    if (currentY <= 10) {
      isFilterVisible.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) })
    } else if (currentY > 40) {
      isFilterVisible.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.quad) })
    }
  }

  const handleNotificationPress = useCallback((item: any) => {
    Haptics.selectionAsync()
    if (!item.isRead) {
      markRead(item.id)
    }
    navigateFromNotification(item.data)
  }, [markRead])

  const handleDelete = useCallback((id: string) => {
    deleteNotification(id)
  }, [deleteNotification])

  const unreadCount = notifs.filter((n: any) => !n.isRead).length

  const filteredData = useMemo(() => {
    return notifs.filter((item: any) => {
      if (activeTab === 'الكل') return true
      if (activeTab === 'غير مقروءة') return !item.isRead
      
      const typeMap: Record<string, string[]> = {
        'رسائل': ['message', 'room', 'conversation'],
        'إعلانات': [
          'listing',
          'bus',
          'equipment',
          'part',
          'service',
          ...(FEATURES.JOBS_ENABLED ? ['job'] : []),
          ...(FEATURES.TRANSPORT_ENABLED ? ['transport'] : []),
        ],
        ...(FEATURES.PAYMENTS_ENABLED ? { 'مدفوعات': ['payment', 'transaction'] } : {}),
        'موافقات': ['approval', 'verify'],
        'تنبيهات': ['warning', 'alert'],
        'نظام': ['system', 'admin']
      }
      const targetTypes = typeMap[activeTab] || []
      const t = (item.type || '').toLowerCase()
      const e = (item.data?.entityType || '').toLowerCase()
      
      return targetTypes.some(target => t.includes(target) || e.includes(target))
    })
  }, [notifs, activeTab])

  const sections = useMemo(() => groupNotifications(filteredData), [filteredData])

  if (isError && notifs.length === 0) {
    const errorProps = getListErrorProps(error, 'تعذر تحميل الإشعارات')
    return (
      <View style={s.root}>
        <AppHeader title="الإشعارات" showBack />
        <View style={s.emptyState} testID="notifications-error-state">
          <View style={[s.emptyIconCircle, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons
              name={errorProps.icon as keyof typeof Ionicons.glyphMap}
              size={44}
              color={errorProps.iconColor}
            />
          </View>
          <Text style={s.emptyTitle}>{errorProps.title}</Text>
          <Text style={s.emptySub}>{errorProps.subtitle}</Text>
          <TouchableOpacity
            style={s.ctaButton}
            onPress={() => refetch()}
            disabled={isRefetching}
            activeOpacity={0.8}
            testID="notifications-retry-btn"
            accessibilityRole="button"
            accessibilityLabel={errorProps.actionLabel}
          >
            <Text style={s.ctaText}>{errorProps.actionLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <AppHeader
        title="الإشعارات"
        showBack
        rightSlot={
          unreadCount > 0 ? (
            <TouchableOpacity
              testID="notifications-mark-all-read-btn"
              accessibilityRole="button"
              accessibilityLabel="تحديد الكل كمقروء"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                markAllRead()
              }}
              disabled={marking}
              hitSlop={6}
              style={[s.markAllBtn, { opacity: marking ? 0.5 : 1 }]}
              activeOpacity={0.7}
            >
              <TopBarGlassSurface
                testID="notifications-mark-all-glass"
                kind="ice-control"
                borderRadius={16}
                support={glassSupport}
              />
              <Ionicons name="checkmark-done" size={18} color={TopBarTokens.buttonIconColor} />
            </TouchableOpacity>
          ) : <View style={{ width: 32 }} />
        }
      />

      <Animated.View style={[s.headerContainer, animatedFilterStyle]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {FILTERS.map(f => (
            <Pressable 
              key={f.label} 
              style={[s.tab, activeTab === f.label && s.tabActive]}
              onPress={() => {
                Haptics.selectionAsync()
                setActiveTab(f.label)
              }}
              hitSlop={8}
            >
              <Ionicons 
                name={f.icon as any} 
                size={14} 
                color={activeTab === f.label ? Colors.white : Colors.text2} 
              />
              <Text style={[s.tabTxt, activeTab === f.label && s.tabTxtActive]}>{f.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>

      {(isError || isRefetchError) && notifs.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }} testID="notifications-stale-banner">
          <StaleDataBanner onRetry={() => refetch()} isRefetching={isRefetching} />
        </View>
      ) : null}

      {isLoading ? (
        <View style={s.list}>
          {[1, 2, 3, 4, 5].map(i => <NotificationSkeleton key={i} reducedMotion={reducedMotion} />)}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={s.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                refetch()
              }}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage()
          }}
          onEndReachedThreshold={0.5}
          stickySectionHeadersEnabled={true}
          ListEmptyComponent={
            <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(220)} style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={44} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد إشعارات حالياً</Text>
              <Text style={s.emptySub}>عِندما تتلقى تحديثات أو رسائل جديدة، ستظهر هنا مباشرة.</Text>
              <TouchableOpacity 
                style={s.ctaButton} 
                onPress={() => {
                  Haptics.selectionAsync()
                  router.push(NOTIFICATIONS_EMPTY_CTA_ROUTE)
                }}
                activeOpacity={0.8}
              >
                <Text style={s.ctaText}>تصفح الإعلانات المتاحة</Text>
              </TouchableOpacity>
            </Animated.View>
          }
          renderSectionHeader={({ section: { title } }) => (
            <View style={s.sectionHeaderContainer}>
              <Text style={s.sectionHeader}>{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <NotificationCard
              item={item}
              onPress={handleNotificationPress}
              onDelete={handleDelete}
              glassSupport={glassSupport}
              reducedMotion={reducedMotion}
            />
          )}
        />
      )}
    </View>
  )
}

const softShadow = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  android: { elevation: 2.5 },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  
  markAllBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TopBarTokens.iceGlass,
    borderWidth: TopBarTokens.buttonBorderWidth,
    borderColor: TopBarTokens.buttonBorderColor,
    ...TopBarTokens.buttonShadow,
  },

  headerContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    justifyContent: 'center',
    paddingVertical: 6,
    zIndex: 10,
  },
  tabsRow: {
    paddingStart: Spacing.space3,
    paddingEnd: Spacing.space5,
    gap: 8,
    alignItems: 'center',
  },
  tab: { 
    flexDirection: 'row', alignItems: 'center', gap: 5, 
    paddingHorizontal: 12, paddingVertical: 7, 
    borderRadius: 8, backgroundColor: Colors.white, 
    borderWidth: 1, borderColor: '#E2E8F0',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 1 },
    }),
  },
  tabActive: { 
    backgroundColor: Colors.primary, 
    borderColor: Colors.primary, 
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
      android: { elevation: 2 },
    }), 
  },
  tabTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, color: Colors.text, lineHeight: 16, writingDirection: 'rtl' },
  tabTxtActive: { color: Colors.white },
  
  list: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 80 },
  
  sectionHeaderContainer: {
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    paddingVertical: 8,
    marginBottom: 8,
    alignSelf: 'flex-start', // keeps the pill small instead of full width
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 4,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#475569',
    writingDirection: 'rtl',
  },

  deleteActionContainer: {
    width: 76,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10, // Adjust for card's marginBottom
    paddingRight: 8,
  },
  deleteCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    ...Platform.select({
      ios: { shadowColor: '#EF4444', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyIconCircle: { 
    width: 80, height: 80, borderRadius: 40, 
    backgroundColor: '#EEF2FF', 
    alignItems: 'center', justifyContent: 'center', 
    marginBottom: 16,
    ...softShadow
  },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold', fontSize: Typography.titleMd.fontSize, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'Almarai_400Regular', fontSize: 14, color: Colors.text2, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  
  ctaButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    ...softShadow,
  },
  ctaText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: Colors.white,
  },
  
  card: {
    borderRadius: CardSystem.radius.outer,
    borderWidth: 1,
    borderColor: CardSystem.glass.cardBorderColor,
    marginBottom: 10,
    overflow: 'hidden',
    ...CardSystem.styles.softShadow,
  },
  skeletonCard: {
    backgroundColor: Colors.white,
    padding: 12,
  },
  cardUnread: {
    borderColor: Colors.borderStrong,
  },
  unreadBar: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    start: 0,
    width: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  cardTouchable: {
    padding: 12,
  },
  
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  newDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: '#0F172A',
    writingDirection: 'rtl',
    lineHeight: 20,
    flexShrink: 1,
  },
  timeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#94A3B8',
    writingDirection: 'rtl',
  },
  bodyText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    writingDirection: 'rtl',
  },
})
