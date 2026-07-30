import React from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Colors } from '../../src/constants/colors'
import { Radius } from '../../src/constants/radius'
import { Config } from '../../src/constants/config'
import { Typography } from '../../src/constants/typography'
import { Gradients } from '../../src/constants/gradients'
import { useAuthStore } from '../../src/store/authStore'
import { useMyListings, useFavorites } from '../../src/hooks/useListings'
import { dialogService } from '../../src/store/dialogStore'

// ─── Menu items ───────────────────────────────────────────────────────────────
const MENU_ITEMS = [
  { icon: 'megaphone-outline',    title: 'إعلاناتي',       route: '/profile/my-listings',        bg: '#FFF7ED', fg: '#EA580C' },
  { icon: 'car-outline',          title: 'طلبات النقل',    route: '/transport/my-requests',      bg: '#ECFDF5', fg: '#059669' },
  { icon: 'pricetag-outline',     title: 'عروضي المقدمة',  route: '/transport/my-quotes',        bg: '#EFF6FF', fg: '#2563eb' },
  { icon: 'clipboard-outline',    title: 'حجوزاتي',        route: '/transport/bookings',         bg: '#FDF4FF', fg: '#7c3aed' },
  { icon: 'bus-outline',          title: 'سجّل كناقل',     route: '/transport/carrier-register', bg: '#FEF9C3', fg: '#ca8a04' },
  { icon: 'heart-outline',        title: 'المفضلة',         route: '/profile/favorites',          bg: '#FCE7F3', fg: '#DB2777' },
  { icon: 'card-outline',         title: 'الاشتراك',        route: '/profile/subscription',       bg: '#FEF3C7', fg: '#D97706' },
  { icon: 'notifications-outline',title: 'الإشعارات',      route: '/profile/notifications',      bg: '#E0F2FE', fg: '#0284C7' },
  { icon: 'settings-outline',     title: 'الإعدادات',      route: '/profile/settings',           bg: '#F3E8FF', fg: '#9333EA' },
]

// ─── Stat box ─────────────────────────────────────────────────────────────────
function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={s.statVal}>{value}</Text>
    </View>
  )
}

// ─── Option row ───────────────────────────────────────────────────────────────
function OptionRow({ icon, title, onPress, bg, fg, isLast = false }: {
  icon: string; title: string; onPress: () => void; bg: string; fg: string; isLast?: boolean
}) {
  return (
    <TouchableOpacity
      style={s.optionRow}
      activeOpacity={0.6}
      onPress={onPress}
    >
      <View style={s.optionRight}>
        <View style={[s.optionIconWrap, { backgroundColor: bg }]}>
          <Ionicons name={icon as any} size={20} color={fg} />
        </View>
        <Text style={s.optionTitle} numberOfLines={1}>{title}</Text>
      </View>
      
      <Ionicons name="chevron-back" size={16} color={Colors.borderStrong} />
      
      {!isLast && <View style={s.optionDivider} />}
    </TouchableOpacity>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuthStore()
  const { data: myListings } = useMyListings()
  const { data: favorites } = useFavorites()

  const displayName = user?.displayName || (user as any)?.name || user?.username || 'مستخدم'
  const handle      = user?.username ? `@${user.username}` : ''

  const rawAvatar = user?.avatarUrl || user?.avatar
  const avatarUrl = rawAvatar
    ? rawAvatar.startsWith('http')
      ? rawAvatar
      : `${Config.apiUrl}${rawAvatar.startsWith('/') ? '' : '/'}${rawAvatar}`
    : null

  const handleLogout = () => {
    dialogService.confirm(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      async () => {
        await logout()
        router.replace('/(auth)/login')
      },
      'تسجيل الخروج',
      'إلغاء',
      true
    )
  }

  return (
    <View style={s.root}>
      {/* ── ENTIRE PAGE SCROLL ────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
        bounces={false}
      >

        {/* ── HEADER ────────────────────────────────────────────── */}
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <LinearGradient
          colors={Gradients.primary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }]}
        />
        {/* Back Button */}
        <TouchableOpacity
          style={[s.backBtn, { top: insets.top + 2 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="arrow-forward-outline" 
            size={24} 
            color="#F8FAFC" 
          />
        </TouchableOpacity>

        {/* Avatar Area Wrapper */}
        <View style={s.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarLetter}>{displayName.charAt(0)}</Text>
            </View>
          )}

          <TouchableOpacity
            style={s.cameraBadge}
            activeOpacity={0.8}
            onPress={() => router.push('/profile/edit-profile' as any)}
          >
            <Ionicons name="camera" size={14} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Name & Handle */}
        <View style={s.nameRow}>
          {user?.isVerified && (
            <MaterialIcons name="verified" size={18} color="#38bdf8" style={{ marginRight: 6 }} />
          )}
          <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
          {user?.isVerified && <View style={{ width: 24 }} />}
        </View>
        {handle ? <Text style={s.userHandle} numberOfLines={1}>{handle}</Text> : null}

        {/* Bio Badge */}
        {user?.bio ? (
          <View style={s.bioBadge}>
            <Text style={s.bioTxt}>{user.bio}</Text>
          </View>
        ) : null}

        {/* Contact Info Pills */}
        {(user?.email || user?.phone) ? (
          <View style={s.contactRow}>
            {user.phone ? (
              <View style={s.contactPill}>
                <Ionicons name="call" size={14} color="#FFF" />
                <Text style={[s.contactTxt, { writingDirection: 'ltr' }]}>{user.phone}</Text>
              </View>
            ) : null}
            {user.email ? (
              <View style={s.contactPill}>
                <Ionicons name="mail" size={14} color="#FFF" />
                <Text style={s.contactTxt}>{user.email}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Edit profile subtle button */}
        <TouchableOpacity
          style={s.editBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/profile/settings' as any)}
        >
          <Text style={s.editBtnTxt}>تعديل الملف الشخصي</Text>
        </TouchableOpacity>

      </View>

      {/* ── CONTENT SCROLL ──────────────────────────────────────── */}
      <View style={s.content}>

        {/* ── STATS CARD ─────────────────────── */}
        <View style={s.statsCard}>
          <StatBox value={myListings?.length ?? 0} label="إعلاناتي" />
          <View style={s.statDivider} />
          <StatBox value={favorites?.length ?? 0} label="المفضلة" />
          <View style={s.statDivider} />
          <StatBox value={user?.city || user?.governorate || '—'} label="المدينة" />
        </View>

        {/* ── PREMIUM BANNER ───────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/profile/subscription' as any)}
          style={s.premiumOuter}
        >
          <LinearGradient
            colors={['#D4AF37', '#AA771C']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={s.premiumBanner}
          >
            <View style={s.premiumRight}>
              <View style={s.premiumIconBox}>
                <Ionicons name="medal" size={24} color="#FFF" />
              </View>
              <View style={s.premiumTextWrap}>
                <Text style={s.premiumTitle}>الاشتراك الذهبي</Text>
                <Text style={s.premiumSub} numberOfLines={1}>ترقية الإعلانات وزيادة المشاهدات</Text>
              </View>
            </View>
            <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* ── OPTIONS CARD ─────────────────────────────────────── */}
        <View style={s.optionsGroup}>
          {MENU_ITEMS.map((item, idx) => (
            <OptionRow
              key={item.route}
              icon={item.icon}
              title={item.title}
              bg={item.bg}
              fg={item.fg}
              isLast={idx === MENU_ITEMS.length - 1}
              onPress={() => router.push(item.route as any)}
            />
          ))}
        </View>

        {/* ── LOGOUT BUTTON ────────────────────────────────────── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.6}>
          <Text style={s.logoutTxt}>تسجيل الخروج</Text>
        </TouchableOpacity>

        {/* App version */}
        <Text style={s.version}>الإصدار 1.0.0</Text>

      </View>
      </ScrollView>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const AVATAR_SIZE = 84

const softShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16 },
  android: { elevation: 3 },
})

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  // Header
  header: {
    alignItems: 'center',
    paddingBottom: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  backBtn: {
    position: 'absolute',
    start: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: Colors.white,
  },
  avatarFallback: {
    backgroundColor: Colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 32,
    color: Colors.white,
  },
  
  // Badges
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    end: -4,
    zIndex: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryDark,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },

  // Name & Handle
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  userName: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.headlineSm.fontSize,
    color: Colors.white,
    textAlign: 'center',
  },
  userHandle: {
    fontFamily: 'Almarai_400Regular',  fontSize: Typography.bodyMd.fontSize,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  
  // Bio Badge
  bioBadge: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    marginBottom: 16,
    alignSelf: 'center',
  },
  bioTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: Typography.bodyMd.fontSize,
    color: Colors.white,
    textAlign: 'center',
  },

  // Contact Pills
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  contactPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    gap: 6,
  },
  contactTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: Typography.labelMd.fontSize,
    color: Colors.white,
  },

  // Edit Button
  editBtn: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    width: '60%',
  },
  editBtnTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: Typography.bodyMd.fontSize,
    color: Colors.white,
  },

  // Content scroll
  content: {
    marginTop: -24,
    paddingHorizontal: 16,
  },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 24,
    zIndex: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  statVal: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.titleMd.fontSize,
    color: Colors.primary,
    textAlign: 'center',
  },
  statLabel: {
    fontFamily: 'Almarai_700Bold',  fontSize: Typography.bodyMd.fontSize,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },

  // Premium banner
  premiumOuter: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    ...softShadow,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  premiumRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  premiumIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTextWrap: {
    alignItems: 'flex-start',
  },
  premiumTitle: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.titleMd.fontSize,
    color: Colors.white,
    marginBottom: 2,
    textAlign: 'right',
  },
  premiumSub: {
    fontFamily: 'Almarai_400Regular',  fontSize: Typography.caption.fontSize,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
  },

  // Options Group
  optionsGroup: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginBottom: 24,
    paddingVertical: 8,
    ...softShadow,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: Typography.bodyLg.fontSize,
    color: Colors.text,
    textAlign: 'right',
  },
  optionDivider: {
    position: 'absolute',
    bottom: 0,
    right: 70, 
    left: 16,
    height: 1,
    backgroundColor: Colors.border,
  },

  // Logout
  logoutBtn: {
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutTxt: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: Typography.bodyLg.fontSize,
    color: Colors.error,
    textAlign: 'center',
  },
  // Version
  version: {
    fontFamily: 'Almarai_400Regular',  fontSize: Typography.caption.fontSize,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
})
