import React from 'react'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GlassSurface, type GlassSupport } from '../../navigation/glassSupport'
import { VerifiedBadge } from '../../ui/VerifiedBadge'
import { RatingStars } from '../../ui/RatingStars'
import { BottomBarTokens } from '../../../constants/bottomBarTokens'
import { Colors } from '../../../constants/colors'
import { Radius } from '../../../constants/radius'
import { Spacing } from '../../../constants/spacing'
import { lineHeightFor } from '../../../constants/typography'
import { PublicProfileTokens } from '../../../constants/publicProfileTokens'
import { PublicProfile } from '../../../types/profile.types'
import { formatNumberWestern } from '../../../utils/numberFormat'

export type PublicProfileWithOptionalContact = PublicProfile & {
  whatsapp?: string | null
  whatsappAvailable?: boolean | null
}

export interface PublicProfileHeroProps {
  profile: PublicProfileWithOptionalContact
  action?: {
    kind: 'owner' | 'visitor'
    onPress: () => void
    onCall?: (phone: string) => void
    onWhatsApp?: (phone: string) => void
  }
  /** Optional fallback summary when profile payload lacks averageRating/reviewCount */
  ratingFallback?: {
    averageRating: number | null
    reviewCount: number
  }
  onOpenReviews?: () => void
  onRateSeller?: () => void
  support?: GlassSupport
}

export function PublicProfileHero({
  profile,
  action,
  ratingFallback,
  onOpenReviews,
  onRateSeller,
  support,
}: PublicProfileHeroProps) {
  const displayName = profile.displayName ?? profile.username ?? 'مستخدم'
  const location = profile.governorateRef?.nameAr ?? profile.wilayaRef?.nameAr ?? profile.governorate
  const counts = [profile._count.listings, profile._count.busListings, profile._count.equipmentListings, profile._count.spareParts, profile._count.carServices]
  const activeCount = counts.reduce((sum, count) => sum + count, 0)
  const sectionCount = counts.filter((count) => count > 0).length
  const joinYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : '—'

  const resolvedReviewCount =
    typeof profile.reviewCount === 'number' && Number.isFinite(profile.reviewCount)
      ? profile.reviewCount
      : ratingFallback?.reviewCount ?? 0
  const resolvedAvgRating =
    typeof profile.averageRating === 'number' && Number.isFinite(profile.averageRating)
      ? profile.averageRating
      : ratingFallback?.averageRating ?? null
  const showRatingRow = resolvedReviewCount > 0 && resolvedAvgRating !== null && resolvedAvgRating > 0

  const exposedPhone = typeof profile.phone === 'string' ? profile.phone.trim() : ''
  const exposedWhatsapp =
    typeof profile.whatsapp === 'string' && profile.whatsapp.trim()
      ? profile.whatsapp.trim()
      : profile.whatsappAvailable && exposedPhone
        ? exposedPhone
        : ''

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
            {profile.isVerified && <VerifiedBadge testID="public-profile-verified" size={18} />}
          </View>
          {profile.username ? (
            <Text testID="public-profile-handle" style={s.username} numberOfLines={1}>
              {`\u2066@${profile.username}\u2069`}
            </Text>
          ) : null}
          {location ? (
            <View style={s.locationRow}>
              <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
              <Text style={s.location} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}
          {showRatingRow ? (
            <Pressable
              testID="public-profile-rating-row"
              style={s.ratingRow}
              onPress={onOpenReviews}
              accessibilityRole="button"
              accessibilityLabel={`التقييم ${resolvedAvgRating.toFixed(1)} من 5 بناءً على ${formatNumberWestern(resolvedReviewCount)} تقييم`}
            >
              <RatingStars rating={resolvedAvgRating} size={14} />
              <Text style={s.ratingAvg}>{resolvedAvgRating.toFixed(1)}</Text>
              <Text style={s.ratingCount}>({formatNumberWestern(resolvedReviewCount)})</Text>
            </Pressable>
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

      {action?.kind === 'owner' ? (
        <Pressable
          testID="public-profile-action"
          style={s.action}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel="تعديل ملفي الشخصي"
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
          <Ionicons name="create-outline" size={18} color={Colors.white} />
          <Text style={s.actionText}>تعديل ملفي الشخصي</Text>
        </Pressable>
      ) : null}

      {action?.kind === 'visitor' ? (
        <View testID="public-profile-contact-row" style={s.contactRow}>
          <ContactIconButton
            testID="public-profile-chat-btn"
            icon="chatbubble-ellipses-outline"
            label="محادثة"
            variant="primary"
            onPress={action.onPress}
            support={support}
          />
          {exposedPhone ? (
            <ContactIconButton
              testID="public-profile-call-btn"
              icon="call-outline"
              label="اتصال"
              variant="outline"
              onPress={() => action.onCall?.(exposedPhone)}
              support={support}
            />
          ) : null}
          {exposedWhatsapp ? (
            <ContactIconButton
              testID="public-profile-whatsapp-btn"
              icon="logo-whatsapp"
              label="واتساب"
              variant="outline"
              onPress={() => action.onWhatsApp?.(exposedWhatsapp)}
              support={support}
            />
          ) : null}
        </View>
      ) : null}

      {onRateSeller ? (
        <Pressable
          testID="public-profile-rate-btn"
          style={s.rateSellerBtn}
          onPress={onRateSeller}
          accessibilityRole="button"
          accessibilityLabel="تقييم البائع"
        >
          <Ionicons name="star-outline" size={16} color={Colors.primary} />
          <Text style={s.rateSellerText}>تقييم البائع</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function ContactIconButton({
  testID,
  icon,
  label,
  variant,
  onPress,
  support,
}: {
  testID: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  variant: 'primary' | 'outline'
  onPress: () => void
  support?: GlassSupport
}) {
  const isPrimary = variant === 'primary'
  return (
    <Pressable
      testID={testID}
      style={[s.contactBtn, isPrimary ? s.contactBtnPrimary : s.contactBtnOutline]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isPrimary ? (
        <GlassSurface
          testID="public-profile-action-surface"
          variant="surface"
          borderRadius={Radius.md}
          noBorder
          washColor={Colors.primary}
          washOpacity={PublicProfileTokens.actionWashOpacity}
          tintOverlayColor={Colors.primary}
          support={support}
        />
      ) : null}
      <Ionicons name={icon} size={18} color={isPrimary ? Colors.white : Colors.primary} />
      <Text style={[s.contactBtnLabel, isPrimary ? s.contactBtnLabelPrimary : s.contactBtnLabelOutline]}>
        {label}
      </Text>
    </Pressable>
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
    gap: PublicProfileTokens.heroGap,
    ...BottomBarTokens.shadow,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space2 + 2 },
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
  identityText: { flex: 1, minWidth: 0, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space1 + 2 },
  name: {
    flexShrink: 1,
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 17,
    lineHeight: 24,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  username: {
    alignSelf: 'flex-start',
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.space1 },
  location: {
    flexShrink: 1,
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  bio: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  stats: {
    position: 'relative',
    overflow: 'hidden',
    minHeight: PublicProfileTokens.statsMinHeight,
    borderRadius: PublicProfileTokens.statsRadius,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: Spacing.space1 + 2 },
  divider: { width: 1, height: PublicProfileTokens.statsDividerHeight, backgroundColor: Colors.border },
  statValue: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.primaryDark,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  statLabel: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 16,
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
    fontSize: 14,
    lineHeight: 20,
    color: Colors.white,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  contactBtn: {
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    minHeight: PublicProfileTokens.actionHeight,
    borderRadius: Radius.md,
    paddingVertical: Spacing.space1 + 2,
    paddingHorizontal: Spacing.space2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  contactBtnPrimary: {
    backgroundColor: Colors.primary,
  },
  contactBtnOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contactBtnLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  contactBtnLabelPrimary: {
    color: Colors.white,
  },
  contactBtnLabelOutline: {
    color: Colors.text,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    marginTop: Spacing.space1,
  },
  ratingAvg: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  ratingCount: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: lineHeightFor(12),
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  rateSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
    minHeight: Spacing.touch,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primarySoft30,
    backgroundColor: Colors.primarySoft12,
  },
  rateSellerText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
