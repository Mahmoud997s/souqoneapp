import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, RefreshControl, Pressable, SectionList } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { 
  FadeInDown, 
  Layout, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withSequence,
  Easing
} from 'react-native-reanimated'
import { Swipeable } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Typography } from '../../src/constants/typography'
import { useNotifications, useMarkAllRead, useMarkNotificationRead, useDeleteNotification } from '../../src/hooks/useProfile'
import { navigateFromNotification } from '../../src/utils/notificationRouter'

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

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

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; pillBg: string }> = {
  message:  { label: 'رسالة',   icon: 'chatbubble-ellipses-outline', color: '#3B82F6', bg: '#EFF6FF', pillBg: '#DBEAFE' },
  listing:  { label: 'إعلان',   icon: 'megaphone-outline',           color: '#8B5CF6', bg: '#F5F3FF', pillBg: '#EDE9FE' },
  payment:  { label: 'دفع',     icon: 'card-outline',                color: '#10B981', bg: '#ECFDF5', pillBg: '#D1FAE5' },
  system:   { label: 'نظام',    icon: 'information-circle-outline',       color: '#64748B', bg: '#F8FAFC', pillBg: '#F1F5F9' },
  approval: { label: 'موافقة',  icon: 'checkmark-circle-outline',    color: '#10B981', bg: '#ECFDF5', pillBg: '#D1FAE5' },
  warning:  { label: 'تنبيه',   icon: 'warning-outline',             color: '#EF4444', bg: '#FEF2F2', pillBg: '#FEE2E2' },
}

const FILTERS = [
  { label: 'الكل', icon: 'grid-outline' },
  { label: 'غير مقروءة', icon: 'mail-unread-outline' },
  { label: 'رسائل', icon: 'chatbubble-ellipses-outline' },
  { label: 'إعلانات', icon: 'megaphone-outline' },
  { label: 'مدفوعات', icon: 'card-outline' },
  { label: 'موافقات', icon: 'checkmark-circle-outline' },
  { label: 'تنبيهات', icon: 'warning-outline' },
  { label: 'نظام', icon: 'information-circle-outline' }
]

function NotificationSkeleton() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.ease }),
        withTiming(0.5, { duration: 800, easing: Easing.ease })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[s.card, animatedStyle, { borderColor: 'transparent', shadowOpacity: 0 }]}>
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

const NotificationCard = React.memo(({ item, index, onPress, onDelete }: { item: any; index: number; onPress: (item: any) => void, onDelete: (id: string) => void }) => {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.system
  
  const renderRightActions = () => (
    <View style={s.deleteActionContainer}>
      <TouchableOpacity 
        style={s.deleteCircle} 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          onDelete(item.id)
        }} 
        activeOpacity={0.8}
      >
        <Ionicons name="trash-outline" size={22} color="#EF4444" />
      </TouchableOpacity>
    </View>
  )
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 20).springify().damping(15)} layout={Layout.springify()}>
      <Swipeable 
        renderRightActions={renderRightActions} 
        overshootRight={false} 
        containerStyle={{ overflow: 'visible' }}
        onSwipeableOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => onPress(item)}
          style={[s.card, !item.isRead && s.cardUnread]}
        >
          <View style={s.cardRow}>
            {/* Right Side (Icon) */}
            <View style={[s.iconBox, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon as any} size={22} color={config.color} />
            </View>

            {/* Left Side (Content) */}
            <View style={s.contentCol}>
              <View style={s.titleRow}>
                <View style={s.titleWrap}>
                  {!item.isRead && <View style={s.newDot} />}
                  <Text style={s.cardTitle} numberOfLines={1}>
                    {item.title}
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
      </Swipeable>
    </Animated.View>
  )
}, (prev, next) => prev.item.isRead === next.item.isRead && prev.item.id === next.item.id)

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
  
  const { 
    data: infiniteData, 
    isLoading,
    isError,
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
      height: isFilterVisible.value ? 40 : 0,
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
        'إعلانات': ['listing', 'bus', 'equipment', 'part', 'service', 'job', 'transport'],
        'مدفوعات': ['payment', 'transaction'],
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

  if (isError) {
    return (
      <View style={s.root}>
        <AppHeader title="الإشعارات" showBack />
        <View style={s.emptyState}>
          <View style={[s.emptyIconCircle, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="warning-outline" size={44} color={Colors.error} />
          </View>
          <Text style={s.emptyTitle}>حدث خطأ في الاتصال</Text>
          <Text style={s.emptySub}>تعذر جلب الإشعارات، يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.</Text>
          <TouchableOpacity style={s.ctaButton} onPress={() => refetch()} activeOpacity={0.8}>
             <Text style={s.ctaText}>إعادة المحاولة</Text>
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
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                markAllRead()
              }}
              disabled={marking}
              hitSlop={10}
              style={{ opacity: marking ? 0.5 : 1 }}
            >
              <Ionicons name="checkmark-done" size={24} color={Colors.white} />
            </TouchableOpacity>
          ) : <View style={{ width: 24 }} />
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

      {isLoading ? (
        <View style={s.list}>
          {[1, 2, 3, 4, 5].map(i => <NotificationSkeleton key={i} />)}
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
            <Animated.View entering={FadeInDown.duration(300)} style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={44} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد إشعارات حالياً</Text>
              <Text style={s.emptySub}>عِندما تتلقى تحديثات أو رسائل جديدة، ستظهر هنا مباشرة.</Text>
              <TouchableOpacity 
                style={s.ctaButton} 
                onPress={() => {
                  Haptics.selectionAsync()
                  router.push('/(tabs)/browse' as any)
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
          renderItem={({ item, index }) => (
            <NotificationCard 
              item={item} 
              index={index} 
              onPress={handleNotificationPress}
              onDelete={handleDelete}
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
  
  headerContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    justifyContent: 'center',
    paddingBottom: 6,
    paddingTop: 6,
    zIndex: 10,
  },
  tabsRow: { paddingHorizontal: Spacing.space3, gap: 6, alignItems: 'center' },
  tab: { 
    flexDirection: 'row', alignItems: 'center', gap: 4, 
    paddingHorizontal: 10, paddingVertical: 5, 
    borderRadius: 6, backgroundColor: Colors.white, 
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
  tabTxt: { fontFamily: 'Almarai_700Bold', fontSize: 11, color: Colors.text, lineHeight: 14 },
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
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardUnread: { 
    backgroundColor: '#F8FAFC', 
    borderColor: '#BFDBFE',
    borderWidth: 1.5,
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
