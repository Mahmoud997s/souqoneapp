import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import Svg, { Defs, Pattern, Rect, Path } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Gradients } from '../../constants/gradients'

export interface ChatRoomHeaderProps {
  displayName: string
  avatarUri?: string | null
  isOnline?: boolean
  isTyping?: boolean
  onBackPress?: () => void
  onProfilePress?: () => void
  onOptionsPress?: () => void
  onCallPress?: () => void
  showCallButton?: boolean
}

export const ChatRoomHeader: React.FC<ChatRoomHeaderProps> = ({
  displayName,
  avatarUri,
  isOnline = false,
  isTyping = false,
  onBackPress,
  onProfilePress,
  onOptionsPress,
  onCallPress,
  showCallButton = false,
}) => {
  const insets = useSafeAreaInsets()

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onBackPress?.()
  }

  const handleProfile = () => {
    if (onProfilePress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onProfilePress()
    }
  }

  const handleCall = () => {
    if (onCallPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onCallPress()
    }
  }

  const initialLetter = displayName ? displayName.trim().charAt(0) : 'م'

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={Gradients.hero as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Svg Geometric Background Grid */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern
              id="roomHeaderGrid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <Path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#roomHeaderGrid)" />
        </Svg>
      </View>

      {/* Ambient Top Glow */}
      <View style={styles.ambientGlow} />

      {/* Header Content Row */}
      <View style={styles.row}>
        {/* Right Side in RTL: Back Button */}
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.75}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="رجوع"
        >
          <Ionicons
            name="arrow-forward"
            size={20}
            color={Colors.white}
          />
        </TouchableOpacity>

        {/* User Profile (Avatar + Name + Status) adjacent to Back Button */}
        <TouchableOpacity
          style={styles.userProfileSection}
          activeOpacity={0.75}
          onPress={handleProfile}
          accessibilityLabel="الملف الشخصي"
        >
          {/* User Avatar */}
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{initialLetter}</Text>
              </View>
            )}

            {/* Online Indicator Badge */}
            {isOnline && <View style={styles.onlineBadge} />}
          </View>

          {/* User Name & Status Text */}
          <View style={styles.textContainer}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>

            <View style={styles.statusRow}>
              {isTyping ? (
                <View style={styles.typingBox}>
                  <View style={styles.typingDot} />
                  <Text style={styles.typingText}>يكتب الآن...</Text>
                </View>
              ) : isOnline ? (
                <View style={styles.onlineStatusBox}>
                  <View style={styles.statusDotActive} />
                  <Text style={styles.statusOnlineText}>متصل الآن</Text>
                </View>
              ) : (
                <Text style={styles.statusOfflineText}>غير متصل</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Optional Call Button (Left Side in RTL) */}
        {showCallButton && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={handleCall}
            accessibilityLabel="اتصال"
          >
            <Ionicons name="call-outline" size={19} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Room Options Button (3 dots) (Left Side in RTL) */}
        {onOptionsPress && (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onOptionsPress()
            }}
            accessibilityLabel="خيارات المحادثة"
          >
            <Ionicons name="ellipsis-vertical" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#0B2447',
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ambientGlow: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  row: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.space3,
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  userProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
    maxWidth: '68%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    lineHeight: 20,
    color: Colors.white,
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  typingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  typingText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#34D399',
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  onlineStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDotActive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  statusOnlineText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  statusOfflineText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'left',
    writingDirection: 'rtl',
    includeFontPadding: false,
  },
  avatarWrapper: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  avatarFallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.white,
    includeFontPadding: false,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#34D399',
    borderWidth: 2,
    borderColor: '#0B2447',
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
