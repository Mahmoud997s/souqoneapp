import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import { Colors } from '../../src/constants/colors'
import { Config } from '../../src/constants/config'
import { useAuthStore } from '../../src/store/authStore'
import { useMyListings, useFavorites } from '../../src/hooks/useListings'
import { dialogService } from '../../src/store/dialogStore'
import { locationsApi } from '../../src/api/locations'
import { authApi } from '../../src/api/auth'
import { Gradients } from '../../src/constants/gradients'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { SupportHelpButton } from '../../src/components/ui/SupportHelpButton'

interface MenuItem {
  icon: string
  title: string
  subTitle?: string
  route?: string
  onPress?: () => void
  iconColor?: string
  badge?: string | number
}

function SectionCard({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <View style={s.sectionWrap}>
      <Text style={s.sectionHeaderTitle}>{title}</Text>
      <View style={s.cardGroup}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          const handlePress = () => {
            if (item.onPress) {
              item.onPress()
            } else if (item.route) {
              router.push(item.route as any)
            }
          }

          const iconFg = item.iconColor || '#334155'

          return (
            <TouchableOpacity
              key={item.title}
              style={s.optionRow}
              activeOpacity={0.6}
              onPress={handlePress}
            >
              <View style={s.optionRight}>
                <View style={s.optionIconWrap}>
                  <Ionicons name={item.icon as any} size={18} color={iconFg} />
                </View>
                <View style={s.optionTextWrap}>
                  <Text style={s.optionTitle} numberOfLines={1}>{item.title}</Text>
                  {item.subTitle ? (
                    <Text style={s.optionSubTitle} numberOfLines={1}>{item.subTitle}</Text>
                  ) : null}
                </View>
              </View>

              <View style={s.optionLeft}>
                {item.badge !== undefined && item.badge !== null && item.badge !== 0 ? (
                  <View style={s.badgePill}>
                    <Text style={s.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-back" size={15} color="#94A3B8" />
              </View>

              {!isLast && <View style={s.optionDivider} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuthStore()
  const { data: myListings } = useMyListings()
  const { data: favorites }  = useFavorites()

  const [locationName, setLocationName] = React.useState('')

  // Refresh user data from API when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      authApi.me().then((res) => {
        const data = res.data as any
        const freshUser = data?.user ?? data
        if (freshUser?.id) {
          useAuthStore.setState((state) => ({ user: { ...state.user, ...freshUser } }))
        }
      }).catch(() => {})
    }, [])
  )

  // Resolve location name cleanly
  React.useEffect(() => {
    if (user?.wilayaRef?.nameAr) {
      setLocationName(user.wilayaRef.nameAr)
    } else if (user?.governorateRef?.nameAr) {
      setLocationName(user.governorateRef.nameAr)
    } else if (user?.city) {
      setLocationName(user.city)
    } else if (user?.governorate) {
      setLocationName(user.governorate)
    } else if (user?.governorateId && user?.wilayaId) {
      locationsApi.getWilayas(user.governorateId).then((list) => {
        const found = list.find((w) => w.id === user.wilayaId)
        if (found) setLocationName(found.nameAr)
      }).catch(() => {})
    } else if (user?.governorateId) {
      locationsApi.getGovernorates().then((list) => {
        const found = list.find((g) => g.id === user.governorateId)
        if (found) setLocationName(found.nameAr)
      }).catch(() => {})
    } else {
      setLocationName('')
    }
  }, [user])

  const displayName = user?.displayName || (user as any)?.name || user?.username || 'مستخدم'
  const handle      = user?.username ? `@${user.username}` : ''

  const rawAvatar = user?.avatarUrl || user?.avatar
  const avatarUrl = rawAvatar
    ? rawAvatar.startsWith('http')
      ? rawAvatar
      : `${Config.apiUrl}${rawAvatar.startsWith('/') ? '' : '/'}${rawAvatar}`
    : null

  const firstLetter = displayName.charAt(0)

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)' as any)
    }
  }

  const handleLogout = () => {
    dialogService.confirm(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      async () => { await logout(); router.replace('/(auth)/login') },
      'تسجيل الخروج', 'إلغاء', true
    )
  }

  // Group 1: النشاط التجاري والإعلانات
  const activitiesItems: MenuItem[] = [
    {
      icon: 'grid-outline',
      title: 'إعلاناتي',
      subTitle: 'إدارة وتعديل الإعلانات المنشورة',
      route: '/profile/my-listings',
      iconColor: Colors.primary,
      badge: myListings?.length,
    },
    {
      icon: 'bookmark-outline',
      title: 'المفضلة',
      subTitle: 'الإعلانات والخدمات المحفوظة',
      route: '/profile/favorites',
      iconColor: '#0284C7',
      badge: favorites?.length,
    },
  ]

  // Group 2: خدمات النقل واللوجستيات
  const transportItems: MenuItem[] = [
    {
      icon: 'cube-outline',
      title: 'طلبات النقل',
      subTitle: 'متابعة شحناتك والطلبات الجارية',
      route: '/transport/my-requests',
      iconColor: '#059669',
    },
    {
      icon: 'pricetags-outline',
      title: 'عروضي المقدمة',
      subTitle: 'عروض الأسعار المرسلة للعملاء',
      route: '/transport/my-quotes',
      iconColor: '#2563EB',
    },
    {
      icon: 'calendar-outline',
      title: 'حجوزاتي',
      subTitle: 'تأكيدات الحجز والمواعيد',
      route: '/transport/bookings',
      iconColor: '#7C3AED',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'سجّل كناقل معتمد',
      subTitle: 'انضم لشبكة الناقلين وابدأ العمل',
      route: '/transport/carrier-register',
      iconColor: '#D97706',
    },
  ]

  // Group 3: إعدادات الحساب والأمان
  const accountItems: MenuItem[] = [
    {
      icon: 'person-outline',
      title: 'تعديل الملف الشخصي',
      subTitle: 'الاسم، الصورة، والموقع الجغرافي',
      route: '/profile/edit-profile',
      iconColor: '#334155',
    },
    {
      icon: 'notifications-outline',
      title: 'الإشعارات والتنبيهات',
      subTitle: 'الرسائل، العروض، وحالة الطلبات',
      route: '/profile/notifications',
      iconColor: '#334155',
    },
    {
      icon: 'settings-outline',
      title: 'إعدادات الحساب وكلمة المرور',
      subTitle: 'الأمان، اللغة، وتفضيلات التطبيق',
      route: '/profile/settings',
      iconColor: '#334155',
    },
  ]

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── Fixed Top Navigation Bar ── */}
      <View style={[s.navBarFixed, { paddingTop: insets.top }]}>
        <View style={s.navBarRow}>
          {/* Back Button (Right in RTL) */}
          <TouchableOpacity
            style={s.navBtn}
            activeOpacity={0.75}
            onPress={handleBack}
            accessibilityLabel="رجوع"
          >
            <Ionicons name="arrow-forward-outline" size={18} color="#1E293B" />
          </TouchableOpacity>

          {/* Title Badge (flex:1) */}
          <View style={s.navTitleBadge}>
            <Text style={s.navTitle}>الملف الشخصي</Text>
          </View>

          {/* Action Buttons (Left in RTL) */}
          <View style={s.navActions}>
            <TouchableOpacity
              style={s.navBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/(tabs)/chat' as any)}
              accessibilityLabel="الرسائل والمحادثات"
            >
              <Ionicons name="chatbubble-outline" size={17} color="#1E293B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.navBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/profile/notifications' as any)}
              accessibilityLabel="الإشعارات"
            >
              <Ionicons name="notifications-outline" size={17} color="#1E293B" />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.navBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/profile/edit-profile' as any)}
              accessibilityLabel="تعديل الملف الشخصي"
            >
              <Ionicons name="create-outline" size={17} color="#1E293B" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          s.content,
          {
            paddingTop: insets.top + 66,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >

        {/* ── User Profile Card ── */}
        <View style={s.userHeroCard}>
          <View style={s.userInfoRow}>
            {/* Avatar with Camera Badge */}
            <View style={s.avatarWrap}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" />
              ) : (
                <View style={[s.avatar, s.avatarFallback]}>
                  <Text style={s.avatarLetter}>{firstLetter}</Text>
                </View>
              )}
              <TouchableOpacity
                style={s.cameraBadge}
                activeOpacity={0.8}
                onPress={() => router.push('/profile/edit-profile' as any)}
              >
                <Ionicons name="camera" size={11} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Name & Handle */}
            <View style={s.nameAndHandleCol}>
              <View style={s.nameRow}>
                <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
                {user?.isVerified && (
                  <MaterialIcons name="verified" size={16} color="#0284C7" style={{ marginStart: 4 }} />
                )}
              </View>
              {handle ? <Text style={s.userHandle} numberOfLines={1}>{handle}</Text> : null}
            </View>
          </View>

          {/* User Stats Card */}
          <View style={s.statsCard}>
            <View style={s.statItem}>
              <Text style={s.statVal}>{myListings?.length ?? 0}</Text>
              <Text style={s.statLabel}>إعلاناتي</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statVal}>{favorites?.length ?? 0}</Text>
              <Text style={s.statLabel}>المفضلة</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statVal} numberOfLines={1}>{locationName || '—'}</Text>
              <Text style={s.statLabel}>المدينة</Text>
            </View>
          </View>
        </View>

        {/* ── Subscription Card ── */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/profile/subscription' as any)}
          style={s.premiumOuter}
        >
          <LinearGradient
            colors={Gradients.hero as any}
            locations={[0, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.premiumBanner}
          >
            {/* SVG Grid Overlay */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Svg width="100%" height="100%">
                <Defs>
                  <Pattern id="premiumGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <Path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#premiumGrid)" />
              </Svg>
            </View>

            <View style={s.premiumGlow} />
            
            <View style={s.premiumRight}>
              <View style={s.premiumIconBox}>
                <Ionicons name="sparkles" size={17} color="#FBBF24" />
              </View>
              <View style={s.premiumTextWrap}>
                <Text style={s.premiumTitle}>عضوية سوق ون الذهبية</Text>
                <Text style={s.premiumSub} numberOfLines={1}>
                  تمييز الإعلانات والظهور في صدارة البحث ⚡
                </Text>
              </View>
            </View>

            <View style={s.premiumActionBtn}>
              <Text style={s.premiumActionText}>ترقية</Text>
              <Ionicons name="chevron-back" size={13} color="#FBBF24" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Section 1: النشاط والإعلانات ── */}
        <SectionCard title="نشاطي وإعلاناتي" items={activitiesItems} />

        {/* ── Section 2: خدمات النقل ── */}
        <SectionCard title="خدمات النقل واللوجستيات" items={transportItems} />

        {/* ── Section 3: الحساب والأمان ── */}
        <SectionCard title="الحساب والإعدادات" items={accountItems} />

        {/* ── Support & Help Button ── */}
        <SupportHelpButton style={{ marginHorizontal: 0, marginTop: 4, marginBottom: 10 }} />

        {/* ── Logout Button ── */}
        <View style={s.logoutWrap}>
          <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.75}>
            <Ionicons name="log-out-outline" size={19} color="#DC2626" style={{ marginEnd: 8 }} />
            <Text style={s.logoutTxt}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>

        {/* ── Version Info ── */}
        <Text style={s.version}>سوق ون © الإصدار 1.0.0</Text>
      </ScrollView>
    </View>
  )
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 16,
  },

  /* Fixed Top Navigation Bar */
  navBarFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
    }),
  },

  /* Top Navigation Bar Row */
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 2,
    height: 44,
    gap: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navTitleBadge: {
    flex: 1,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...softShadow,
  },
  navTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  /* User Hero Card */
  userHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...softShadow,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginEnd: 12,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  avatarFallback: {
    backgroundColor: Colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    lineHeight: 28,
    color: Colors.white,
    includeFontPadding: false,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    start: -2,
    zIndex: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameAndHandleCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  userHandle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: '#64748B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },

  /* Stats Card */
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 9,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statVal: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: '#1E293B',
    textAlign: 'center',
    includeFontPadding: false,
  },
  statLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: '#64748B',
    textAlign: 'center',
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#CBD5E1',
  },

  /* Premium Banner Glassmorphism */
  premiumOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0B2447',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  premiumGlow: {
    position: 'absolute',
    top: -24,
    end: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  premiumRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  premiumIconBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  premiumTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  premiumSub: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#CBD5E1',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  premiumActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
  },
  premiumActionText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#FBBF24',
    writingDirection: 'rtl',
  },

  /* Section Styles */
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
    marginBottom: 7,
    paddingHorizontal: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...softShadow,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  optionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionSubTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#334155',
  },
  optionDivider: {
    position: 'absolute',
    bottom: 0,
    end: 14,
    start: 60,
    height: 1,
    backgroundColor: '#F1F5F9',
  },

  /* Logout */
  logoutWrap: {
    marginTop: 2,
    marginBottom: 10,
  },
  logoutBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  logoutTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    lineHeight: 20,
    color: '#DC2626',
    textAlign: 'center',
    writingDirection: 'rtl',
  },

  /* Version */
  version: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 4,
    writingDirection: 'rtl',
  },
})