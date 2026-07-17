import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Typography } from '../../src/constants/typography'
import { useNotifications, useMarkAllRead } from '../../src/hooks/useProfile'

function formatTime(iso: string) {
  if (!iso) return 'غير معروف'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'غير معروف'
  
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'الآن'
  if (hours < 1) return `منذ ${mins} دقيقة`
  if (days < 1) return `منذ ${hours} ساعة`
  if (days === 1) return 'أمس'
  if (days === 2) return 'منذ يومين'
  return `منذ ${days} أيام`
}

const ICON_MAP: Record<string, { icon: string; color: string }> = {
  message:  { icon: 'chatbubble-outline',        color: Colors.primary },
  listing:  { icon: 'megaphone-outline',         color: Colors.primary },
  payment:  { icon: 'card-outline',              color: Colors.success },
  system:   { icon: 'information-circle-outline', color: Colors.warning },
  approval: { icon: 'checkmark-circle-outline',  color: Colors.success },
  warning:  { icon: 'warning-outline',           color: Colors.warning },
}

const FILTERS = [
  { label: 'الكل', icon: 'grid-outline' },
  { label: 'غير مقروءة', icon: 'mail-unread-outline' },
  { label: 'رسائل', icon: 'chatbubble-ellipses-outline' },
  { label: 'نظام', icon: 'hardware-chip-outline' }
]

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState('الكل')
  const { data: notifs, isLoading, isRefetching, refetch } = useNotifications()
  const { mutate: markAllRead, isPending: marking } = useMarkAllRead()

  const unreadCount = (notifs ?? []).filter((n: any) => !n.isRead).length

  const filteredData = (notifs ?? []).filter((item: any) => {
    if (activeTab === 'الكل') return true
    if (activeTab === 'غير مقروءة') return !item.isRead
    if (activeTab === 'رسائل') return item.type === 'message'
    if (activeTab === 'نظام') return item.type !== 'message'
    return true
  })

  return (
    <View style={s.root}>
      <AppHeader title="الإشعارات" showBack />

      <View style={{ paddingTop: Spacing.space4 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f.label} 
              style={[s.tab, activeTab === f.label && s.tabActive]}
              onPress={() => setActiveTab(f.label)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={f.icon as any} 
                size={16} 
                color={activeTab === f.label ? Colors.white : Colors.text2} 
              />
              <Text style={[s.tabTxt, activeTab === f.label && s.tabTxtActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.actionRow}>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[s.markBtn, marking && s.markBtnDisabled]}
            onPress={() => markAllRead()}
            disabled={marking}
          >
            <Ionicons name="checkmark-done" size={16} color={Colors.primary} />
            <Text style={s.markTxt}>تحديد الكل كمقروء</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={s.loader} />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(i: any) => i.id}
          contentContainerStyle={s.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="notifications-outline" size={48} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد إشعارات</Text>
              <Text style={s.emptySub}>لا توجد لديك أي إشعارات جديدة في الوقت الحالي.</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
            const meta = ICON_MAP[item.type] ?? ICON_MAP.system
            return (
              <View style={[s.card, !item.isRead && s.cardUnread]}>
                {/* Icon box — FIRST = RIGHT in RTL */}
                <View style={[s.iconBox, { backgroundColor: meta.color + '1A' }]}>
                  {!item.isRead && <View style={s.unreadDot} />}
                  <Ionicons name={meta.icon as any} size={24} color={meta.color} />
                </View>
                {/* Text info — fills LEFT side in RTL */}
                <View style={s.info}>
                  <Text style={[s.title, !item.isRead && s.titleUnread]}>{item.title}</Text>
                  <Text style={s.body}>{item.body}</Text>
                  <View style={s.timeRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.primary} />
                    <Text style={s.time}>{formatTime(item.createdAt)}</Text>
                  </View>
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}

const softShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16 },
  android: { elevation: 3 },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F9FB' },
  
  tabsRow: { paddingHorizontal: Spacing.space4, gap: Spacing.space2, paddingBottom: 4 },
  tab: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, 
    paddingHorizontal: 20, paddingVertical: 10, 
    borderRadius: Radius.pill, backgroundColor: Colors.white, 
    borderWidth: 1, borderColor: Colors.border,
    ...softShadow,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontFamily: 'Almarai_700Bold',  fontSize: Typography.bodyMd.fontSize, color: Colors.text2 },
  tabTxtActive: { color: Colors.white },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
    paddingBottom: Spacing.space3,
  },
  markBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '1A',
    paddingHorizontal: Spacing.space3,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    gap: 4,
  },
  markBtnDisabled: { opacity: 0.5 },
  markTxt: { fontFamily: 'Almarai_700Bold',  fontSize: Typography.caption.fontSize, color: Colors.primary, writingDirection: 'rtl' },
  
  loader: { marginTop: 60 },
  list: { padding: Spacing.space4, gap: Spacing.space4, paddingBottom: 100 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0, 74, 198, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.titleMd.fontSize, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'Almarai_400Regular',  fontSize: Typography.bodyMd.fontSize, color: Colors.text2, textAlign: 'center', lineHeight: 22 },
  
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.space4,
    borderRadius: 20,
    position: 'relative',
    gap: Spacing.space3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  cardUnread: { backgroundColor: '#F4F8FF', borderColor: 'rgba(0, 74, 198, 0.1)', borderWidth: 1 },
  
  unreadDot: {
    position: 'absolute',
    start: 0,
    top: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 2,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, alignItems: 'flex-start' },
  title: { fontFamily: 'Almarai_700Bold',  fontSize: Typography.bodyLg.fontSize, color: Colors.text, marginBottom: 4, writingDirection: 'rtl' },
  titleUnread: { fontFamily: 'Almarai_800ExtraBold',  color: Colors.primary },
  body: { fontFamily: 'Almarai_400Regular',  fontSize: Typography.bodyMd.fontSize, color: Colors.text2, writingDirection: 'rtl', lineHeight: 22 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 4, marginTop: Spacing.space2 },
  time: { fontFamily: 'Almarai_400Regular',  fontSize: Typography.caption.fontSize, color: Colors.primary },
})
