import React from 'react'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GlassSurface, type GlassSupport } from '../../navigation/glassSupport'
import { VerifiedBadge } from '../../ui/VerifiedBadge'
import { BottomBarTokens } from '../../../constants/bottomBarTokens'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { PublicProfileTokens } from '../../../constants/publicProfileTokens'
import { PublicProfile } from '../../../types/profile.types'

export interface PublicProfileHeroProps {
  profile: PublicProfile
  action?: { kind: 'owner' | 'visitor'; onPress: () => void }
  support?: GlassSupport
}

export function PublicProfileHero({ profile, action, support }: PublicProfileHeroProps) {
  const displayName = profile.displayName ?? profile.username ?? 'مستخدم'
  const location = profile.governorateRef?.nameAr ?? profile.wilayaRef?.nameAr ?? profile.governorate
  const counts = [profile._count.listings, profile._count.busListings, profile._count.equipmentListings, profile._count.spareParts, profile._count.carServices]
  const activeCount = counts.reduce((sum, count) => sum + count, 0)
  const sectionCount = counts.filter((count) => count > 0).length
  const joinYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : '—'

  return (
    <View testID="public-profile-hero" style={s.hero}>
      <GlassSurface
        testID="public-profile-hero-surface"
        variant="surface"
        borderRadius={PublicProfileTokens.heroRadius}
        noBorder
        washColor={Colors.white}
        washOpacity={PublicProfileTokens.heroWashOpacity}
        support={support}
      />
      <View style={s.identityRow}>
        <LinearGradient colors={PublicProfileTokens.actionGradient} style={s.avatarRing}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" accessibilityLabel="الصورة الشخصية" />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Text style={s.avatarLetter}>{displayName.charAt(0)}</Text>
            </View>
          )}
        </LinearGradient>
        <View style={s.identityText}>
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1} ellipsizeMode="tail">{displayName}</Text>
            {profile.isVerified && <VerifiedBadge testID="public-profile-verified" size={20} />}
          </View>
          {profile.username ? <Text style={s.username} numberOfLines={1}>@{profile.username}</Text> : null}
          {location ? (
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={15} color={Colors.textMuted} />
              <Text style={s.location} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {profile.bio ? <Text style={s.bio} numberOfLines={2}>{profile.bio}</Text> : null}

      <View testID="public-profile-stats" style={s.stats}>
        <GlassSurface
          testID="public-profile-stats-surface"
          variant="surface"
          borderRadius={PublicProfileTokens.statsRadius}
          noBorder
          washColor={Colors.white}
          washOpacity={PublicProfileTokens.statsWashOpacity}
          support={support}
        />
        <Stat value={String(activeCount)} label="إعلان نشط" testID="public-profile-active-count" />
        <View style={s.divider} />
        <Stat value={String(sectionCount)} label="أقسام" testID="public-profile-section-count" />
        <View style={s.divider} />
        <Stat value={String(joinYear)} label="عضو منذ" testID="public-profile-join-year" />
      </View>

      {action ? (
        <Pressable
          testID="public-profile-action"
          style={s.action}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.kind === 'owner' ? 'تعديل ملفي الشخصي' : 'راسل البائع'}
        >
          <GlassSurface
            testID="public-profile-action-surface"
            variant="surface"
            borderRadius={PublicProfileTokens.actionRadius}
            noBorder
            washColor={Colors.primary}
            washOpacity={PublicProfileTokens.actionWashOpacity}
            tintOverlayColor={Colors.primary}
            support={support}
          />
          <Ionicons name={action.kind === 'owner' ? 'create-outline' : 'chatbubble-ellipses-outline'} size={20} color={Colors.white} />
          <Text style={s.actionText}>{action.kind === 'owner' ? 'تعديل ملفي الشخصي' : 'راسل البائع'}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function Stat({ value, label, testID }: { value: string; label: string; testID: string }) {
  return (
    <View style={s.stat}>
      <Text testID={testID} style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  hero: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: PublicProfileTokens.heroRadius,
    paddingTop: PublicProfileTokens.heroPaddingTop,
    paddingHorizontal: PublicProfileTokens.heroPaddingHorizontal,
    paddingBottom: PublicProfileTokens.heroPaddingBottom,
    borderWidth: 1,
    borderColor: BottomBarTokens.borderColor,
    gap: Spacing.space4,
    ...BottomBarTokens.shadow,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space3 },
  avatarRing: {
    width: PublicProfileTokens.avatarSize + PublicProfileTokens.avatarRingWidth * 2,
    height: PublicProfileTokens.avatarSize + PublicProfileTokens.avatarRingWidth * 2,
    borderRadius: Radius.pill,
    padding: PublicProfileTokens.avatarRingWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: PublicProfileTokens.avatarSize, height: PublicProfileTokens.avatarSize, borderRadius: Radius.pill },
  avatarFallback: { backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: PublicProfileTokens.avatarFallbackFontSize,
    lineHeight: PublicProfileTokens.avatarFallbackLineHeight,
    color: Colors.primaryDark,
  },
  identityText: { flex: 1, minWidth: 0, gap: Spacing.space1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2 },
  name: {
    flexShrink: 1,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    lineHeight: 30,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  username: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space1 },
  location: {
    flexShrink: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  bio: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  stats: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: 76,
    borderRadius: PublicProfileTokens.statsRadius,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.space1, paddingVertical: Spacing.space2 },
  divider: { width: 1, height: 36, backgroundColor: Colors.border },
  statValue: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    lineHeight: 28,
    color: Colors.primaryDark,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  action: {
    position: 'relative',
    overflow: 'hidden',
    height: PublicProfileTokens.actionHeight,
    borderRadius: PublicProfileTokens.actionRadius,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
  },
  actionText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.white,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
