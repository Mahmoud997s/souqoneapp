import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Colors } from '../../constants/colors'

interface ProfileHeroCardProps {
  displayName: string
  handle: string
  avatarUrl: string | null
  firstLetter: string
  isVerified?: boolean
  listingsCount: number
  favoritesCount: number
  locationName: string
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
              colors={['#1e3a6e', '#0f2952', '#0B2447']}
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
            <Ionicons name="camera" size={11} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Name & Handle */}
        <View style={s.nameAndHandleCol}>
          <View style={s.nameRow}>
            <Text style={s.userName} numberOfLines={1}>{displayName}</Text>
            {isVerified && (
              <MaterialIcons name="verified" size={16} color="#0284C7" style={{ marginStart: 4 }} />
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopStartRadius: 28,
    borderTopEndRadius: 28,
  },
  avatarLetter: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    lineHeight: 32,
    color: '#FFFFFF',
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
})
