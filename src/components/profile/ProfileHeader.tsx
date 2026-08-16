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
import { router } from 'expo-router'
import Svg, { Defs, Pattern, Path, Rect } from 'react-native-svg'
import { Colors } from '../../constants/colors'
import { Gradients } from '../../constants/gradients'

export interface ProfileHeaderProps {
  title?: string
  showBack?: boolean
  onBackPress?: () => void
  onChatPress?: () => void
  onNotificationsPress?: () => void
  onEditPress?: () => void
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title = 'حسابي',
  showBack = true,
  onBackPress,
  onChatPress,
  onNotificationsPress,
  onEditPress,
}) => {
  const insets = useSafeAreaInsets()

  const handleBack = onBackPress || (() => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/(tabs)' as any)
    }
  })

  const handleChat = onChatPress || (() => {
    router.push('/(tabs)/chat' as any)
  })

  const handleNotifications = onNotificationsPress || (() => {
    router.push('/profile/notifications' as any)
  })

  const handleEdit = onEditPress || (() => {
    router.push('/profile/edit-profile' as any)
  })

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={Gradients.hero as any}
        locations={[0, 0.6, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Subtle Background SVG Grid */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <Pattern id="profileGrid" width="36" height="36" patternUnits="userSpaceOnUse">
              <Path d="M 36 0 L 0 0 0 36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#profileGrid)" />
        </Svg>
      </View>

      {/* Top Bar Row */}
      <View style={styles.topRow}>
        {/* Back Button (Right in RTL) */}
        {showBack ? (
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={handleBack}
            accessibilityLabel="رجوع"
          >
            <Ionicons name="arrow-forward-outline" size={17} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <View style={styles.btnPlaceholder} />
        )}

        {/* Center Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        {/* Action Buttons (Left in RTL) */}
        <View style={styles.actionBtns}>
          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={handleChat}
            accessibilityLabel="الرسائل والمحادثات"
          >
            <Ionicons name="chatbubble-outline" size={16} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={handleNotifications}
            accessibilityLabel="الإشعارات"
          >
            <Ionicons name="notifications-outline" size={16} color={Colors.white} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            activeOpacity={0.75}
            onPress={handleEdit}
            accessibilityLabel="تعديل الملف الشخصي"
          >
            <Ionicons name="create-outline" size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primaryDark,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  topRow: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  btnPlaceholder: {
    width: 34,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 22,
    color: Colors.white,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
