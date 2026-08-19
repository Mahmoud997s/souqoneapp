import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Gradients } from '../../constants/gradients'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import { OperatorListing } from '../../types/equipment.types'

interface OperatorSmartBannerProps {
  myOperatorProfile: OperatorListing | null
  onJoinPress: () => void
  onEditPress: (profileId: string) => void
}

export function OperatorSmartBanner({
  myOperatorProfile,
  onJoinPress,
  onEditPress,
}: OperatorSmartBannerProps) {
  if (myOperatorProfile) {
    return (
      <View style={[s.bannerContainer, s.bannerContainerActive]}>
        <View style={[s.bannerIconWrap, s.bannerIconWrapActive]}>
          <MaterialCommunityIcons name="badge-account-horizontal-outline" size={22} color="#059669" />
        </View>

        <View style={s.bannerTextWrap}>
          <View style={s.bannerBadgeRow}>
            <Text style={s.bannerTitle} numberOfLines={1}>
              بطاقتك المهنية
            </Text>
            <View style={s.activeStatusBadge}>
              <View style={s.activeStatusDot} />
              <Text style={s.activeStatusTxt}>نشطة بالدليل</Text>
            </View>
          </View>
          <Text style={s.bannerSubtitle} numberOfLines={1}>
            {myOperatorProfile.title || 'جاهز لتلقي طلبات العمل والتواصل المباشر'}
          </Text>
        </View>

        <TouchableOpacity
          style={s.bannerCtaBtn}
          onPress={() => onEditPress(myOperatorProfile.id)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.bannerCtaGradient}
          >
            <Text style={s.bannerCtaText}>تعديل بطاقتي</Text>
            <Ionicons name="create-outline" size={14} color="#ffffff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={s.bannerContainer}>
      <View style={s.bannerIconWrap}>
        <MaterialCommunityIcons name="hard-hat" size={21} color={Colors.primary} />
      </View>

      <View style={s.bannerTextWrap}>
        <Text style={s.bannerTitle} numberOfLines={1}>
          دليل مشغلي وسائقي المعدات
        </Text>
        <Text style={s.bannerSubtitle} numberOfLines={1}>
          أبرز خبراتك ورخصك وانضم لنخبة الكفاءات
        </Text>
      </View>

      <TouchableOpacity style={s.bannerCtaBtn} onPress={onJoinPress} activeOpacity={0.85}>
        <LinearGradient
          colors={Gradients.primary as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.bannerCtaGradient}
        >
          <Text style={s.bannerCtaText}>انضم للدليل</Text>
          <Ionicons name="add" size={14} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  bannerContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: Spacing.space2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  bannerContainerActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  bannerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerIconWrapActive: {
    backgroundColor: '#DCFCE7',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    gap: 4,
  },
  activeStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
  },
  activeStatusTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 9.5,
    lineHeight: 13,
    color: '#16A34A',
  },
  bannerTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    lineHeight: 18,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  bannerSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: Colors.textMuted,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  bannerCtaBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  bannerCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  bannerCtaText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    lineHeight: 16,
    color: '#ffffff',
  },
})
