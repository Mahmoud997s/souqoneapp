import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'
import { Gradients } from '../../constants/gradients'
import { VerifiedBadge } from '../ui/VerifiedBadge'

interface ProfileHeroCardProps {
  displayName: string
  handle: string
  avatarUrl: string | null
  firstLetter: string
  isVerified?: boolean
  listingsCount: number | string
  favoritesCount: number | string
  locationName: string
}

const softShadow = Platform.select({
  ios: {
    shadowColor: Colors.slateHeading,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

export function ProfileHeroCard({
  displayName,
  handle,
  avatarUrl,
  firstLetter,
  isVerified,
  listingsCount,
  favoritesCount,
  locationName,
}: ProfileHeroCardProps) {
  return (
    <View style={s.userHeroCard}>
      <View style={s.userInfoRow}>
        {/* Avatar with Camera Badge */}
        <View style={s.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatar} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={Gradients.hero as any}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[s.avatar, s.avatarFallback]}
            >
              {/* Glass shimmer overlay */}
              <View style={s.avatarGlassShimmer} />
              <Text style={s.avatarLetter}>{firstLetter}</Text>
            </LinearGradient>
          )}
          <TouchableOpacity
            style={s.cameraBadge}
            activeOpacity={0.8}
            onPress={() => router.push('/profile/edit-profile' as any)}
          >
            <Ionicons name="camera" size={11} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Name & Handle */}
        <View style={s.nameAndHandleCol}>
          <View style={s.nameRow}>
            <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
            {isVerified && (
              <VerifiedBadge size={17} style={{ marginStart: 4 }} />
            )}
          </View>
          {handle ? <Text style={s.userHandle} numberOfLines={1}>{handle}</Text> : null}
        </View>
      </View>

      {/* User Stats Card */}
      <View style={s.statsCard}>
        <View style={s.statItem}>
          <Text style={s.statVal}>{listingsCount}</Text>
          <Text style={s.statLabel}>إعلاناتي</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal}>{favoritesCount}</Text>
          <Text style={s.statLabel}>المفضلة</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statVal} numberOfLines={1}>{locationName || '—'}</Text>
          <Text style={s.statLabel}>المدينة</Text>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  /* User Hero Card */
  userHeroCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
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
    borderColor: Colors.slateBorder,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarGlassShimmer: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    height: '55%',
    backgroundColor: Colors.whiteAlpha08,
    borderTopStartRadius: 28,
    borderTopEndRadius: 28,
  },
  avatarLetter: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    lineHeight: 32,
    color: Colors.white,
    includeFontPadding: false,
    letterSpacing: 0.5,
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
    borderColor: Colors.white,
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
    color: Colors.slateDark,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  userHandle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: Colors.slateText,
    textAlign: 'left',
    writingDirection: 'rtl',
  },

  /* Stats Card */
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slateSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.slateBorder,
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
    color: Colors.slateDark,
    textAlign: 'center',
    includeFontPadding: false,
  },
  statLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    lineHeight: 14,
    color: Colors.slateText,
    textAlign: 'center',
    includeFontPadding: false,
    writingDirection: 'rtl',
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.slateBorderStrong,
  },
})
