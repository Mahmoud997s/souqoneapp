import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator, Alert, Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Typography } from '../../src/constants/typography'
import { Gradients } from '../../src/constants/gradients'
import { useChatRooms } from '../../src/hooks/useChat'
import { useAuthStore } from '../../src/store/authStore'
import { useArchiveStore } from '../../src/store/archiveStore'
import { Config } from '../../src/constants/config'

function formatTime(iso: string) {
  if (!iso) return 'غير معروف'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'غير معروف'
  
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'الآن'
  if (hours < 1) return `${mins}د`
  if (days < 1) return `${hours}س`
  if (days === 1) return 'أمس'
  return `${days}ي`
}

function getAvatarUrl(url?: string | null) {
  if (!url) return null
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return `${Config.socketUrl}${url}`
  return `${Config.socketUrl}/${url}`
}

export default function ChatListScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuthStore()
  const { data: rooms, isLoading, refetch } = useChatRooms()
  
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread' | 'archived'>('all')
  const { archivedIds, toggleArchive } = useArchiveStore()

  const filteredRooms = React.useMemo(() => {
    return rooms?.filter((r: any) => {
      const isArchived = archivedIds.includes(r.id)
      if (activeTab === 'archived') return isArchived
      if (isArchived) return false
      if (activeTab === 'unread') return (r.unreadCount ?? 0) > 0
      return true
    })
  }, [rooms, archivedIds, activeTab])

  return (
    <View style={s.container}>
      {/* ── HEADER ────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.space2 }]}>
        <LinearGradient
          colors={Gradients.hero as any}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}
        />
        <TouchableOpacity style={s.iconBtn} onPress={() => Alert.alert('قريباً', 'القائمة الجانبية قريباً')}>
          <Ionicons name="menu" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>الرسائل</Text>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/profile/notifications' as any)}>
          <Ionicons name="notifications-outline" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
      >
        <View style={s.searchBar}>
          <View style={s.searchInner}>
            <Ionicons name="search" size={20} color={Colors.textMuted} style={s.searchIcon} />
            <TextInput
              style={s.searchInput}
              placeholder="ابحث في الرسائل..."
              placeholderTextColor={Colors.textMuted}
              textAlign="right"
            />
          </View>
        </View>

        <View style={s.filterRow}>
          <TouchableOpacity 
            style={[s.filterChip, activeTab === 'all' && s.filterChipActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[s.filterChipTxt, activeTab === 'all' && s.filterChipTxtActive]}>الكل</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.filterChip, activeTab === 'unread' && s.filterChipActive]}
            onPress={() => setActiveTab('unread')}
          >
            <Text style={[s.filterChipTxt, activeTab === 'unread' && s.filterChipTxtActive]}>غير مقروءة</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.filterChip, activeTab === 'archived' && s.filterChipActive]}
            onPress={() => setActiveTab('archived')}
          >
            <Text style={[s.filterChipTxt, activeTab === 'archived' && s.filterChipTxtActive]}>مؤرشفة</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={s.loader} />
        ) : !filteredRooms || filteredRooms.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconCircle}>
              <Ionicons name="chatbubbles-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={s.emptyTitle}>لا توجد رسائل</Text>
            <Text style={s.emptySub}>لم تبدأ أي محادثة بعد. يمكنك التواصل مع البائعين من صفحة الإعلانات.</Text>
          </View>
        ) : (
          <View style={s.list}>
            {filteredRooms.map((room: any) => {
              const other = room.participants?.find((p: any) => p.id !== user?.id) ?? room.participants?.[0]
              const hasUnread = (room.unreadCount ?? 0) > 0
              const name = other?.displayName ?? other?.username ?? 'مجهول'
              const isArchived = archivedIds.includes(room.id)
              const avatar = getAvatarUrl(other?.avatarUrl || other?.avatar)

              return (
                <TouchableOpacity
                  key={room.id}
                  style={[s.chatItem, hasUnread && s.chatItemUnread]}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/chat/${room.id}` as any)}
                  onLongPress={() => {
                    Alert.alert(
                      name,
                      'خيارات المحادثة',
                      [
                        { text: isArchived ? 'إلغاء الأرشفة' : 'أرشفة', onPress: () => toggleArchive(room.id) },
                        { text: 'إلغاء', style: 'cancel' }
                      ]
                    )
                  }}
                >
                  <View style={s.avatarWrap}>
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={s.avatar} contentFit="cover" />
                    ) : (
                      <View style={s.avatarPlaceholder}>
                        <Text style={s.avatarLetter}>{name.charAt(0)}</Text>
                      </View>
                    )}
                  </View>

                  <View style={s.chatInfo}>
                    <View style={s.chatRowTop}>
                      <Text style={s.userName} numberOfLines={1}>{name}</Text>
                      <Text style={s.timeTxt}>{formatTime(room.updatedAt)}</Text>
                    </View>
                    <Text style={[s.msgTxt, hasUnread && s.msgUnread]} numberOfLines={1}>
                      {room.lastMessage?.content ?? 'ابدأ المحادثة'}
                    </Text>
                  </View>

                  {hasUnread && (
                    <View style={s.unreadBadge}>
                      <Text style={s.unreadBadgeTxt}>{room.unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const softShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16 },
  android: { elevation: 3 },
})

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.space4, paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  iconBtn: { 
    width: 44, height: 44, 
    alignItems: 'center', justifyContent: 'center', 
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  headerTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.headlineSm.fontSize, color: Colors.white },
  
  content: { padding: Spacing.space4, paddingBottom: 100 },
  loader: { marginTop: 60 },
  
  searchBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, height: 52, borderRadius: Radius.xl,
    paddingStart: Spacing.space4, paddingEnd: Spacing.space1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    marginBottom: Spacing.space6,
  },
  searchInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2, flex: 1 },
  searchIcon: { marginEnd: Spacing.space2 },
  searchInput: { flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: Typography.bodyMd.fontSize, color: Colors.text, textAlign: 'right' },
  
  filterRow: { flexDirection: 'row', gap: Spacing.space3, marginBottom: Spacing.space5, paddingHorizontal: 2 },
  filterChip: { 
    paddingHorizontal: 20, paddingVertical: 10, 
    borderRadius: Radius.pill, backgroundColor: Colors.white, 
    borderWidth: 1, borderColor: Colors.border,
    ...softShadow,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipTxt: { fontFamily: 'Almarai_700Bold',  fontSize: Typography.bodyMd.fontSize, color: Colors.text2 },
  filterChipTxtActive: { color: Colors.white },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 30 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0, 74, 198, 0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.titleMd.fontSize, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'Almarai_400Regular',  fontSize: Typography.bodyMd.fontSize, color: Colors.text2, textAlign: 'center', lineHeight: 22 },
  
  list: { gap: Spacing.space4 },
  
  chatItemUnread: { backgroundColor: '#F4F8FF', borderColor: 'rgba(0, 74, 198, 0.1)', borderWidth: 1 },
  chatItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white,
    padding: Spacing.space4, borderRadius: 20, gap: Spacing.space3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  
  avatarWrap: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(0, 74, 198, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.titleMd.fontSize, color: Colors.primary },
  
  chatInfo: { flex: 1, alignItems: 'flex-start' },
  chatRowTop: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 6, alignItems: 'center' },
  timeTxt: { fontFamily: 'Almarai_400Regular',  fontSize: Typography.caption.fontSize, color: Colors.textMuted },
  userName: { fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.bodyLg.fontSize, color: Colors.text, writingDirection: 'rtl', flex: 1 },
  msgTxt: { fontFamily: 'Almarai_400Regular',  fontSize: Typography.bodyMd.fontSize, color: Colors.text2, writingDirection: 'rtl', textAlign: 'right' },
  msgUnread: { fontFamily: 'Almarai_700Bold',  color: Colors.primary },
  
  unreadBadge: {
    minWidth: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6, marginStart: Spacing.space2,
  },
  unreadBadgeTxt: { fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.caption.fontSize, color: Colors.white },
})
