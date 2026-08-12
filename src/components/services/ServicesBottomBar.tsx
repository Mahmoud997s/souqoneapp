import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Typography } from '../../constants/typography'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { Shadows } from '../../constants/shadows'

const TABS = [
  { id: 'home', label: 'الرئيسية', icon: 'car-sport', iconO: 'car-sport-outline' },
  { id: 'favorites', label: 'مفضلتي', icon: 'heart', iconO: 'heart-outline' },
  { id: 'post', isPost: true },
  { id: 'listings', label: 'إعلاناتي', icon: 'albums', iconO: 'albums-outline' },
  { id: 'profile', label: 'حسابي', icon: 'person', iconO: 'person-outline' },
]

function FABItem({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1)
  const fabAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  
  const handlePress = React.useCallback(() => {
    scale.value = withSpring(0.85, { damping: 8, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 12, stiffness: 250 })
    })
    onPress()
  }, [onPress])

  return (
    <Pressable onPress={handlePress} style={s.fabItem}>
      <Animated.View style={[s.fabCircle, fabAnimStyle]}>
        <Ionicons name="add" size={30} color={Colors.white} />
      </Animated.View>
    </Pressable>
  )
}

export const ServicesBottomBar = () => {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const { isLoggedIn } = useAuthStore()
  const { set } = usePostStore()

  const bottomPad = insets.bottom > 0 ? insets.bottom : 16

  const handlePost = () => {
    if (!isLoggedIn) {
      router.push('/(auth)/login' as any)
      return
    }
    // Set category to services and directly skip to step2!
    set({ category: 'services' })
    router.push('/post/step2' as any)
  }

  return (
    <View style={[s.wrapper, { bottom: bottomPad }]}>
      <BlurView intensity={80} tint="light" style={s.blurBackground} />
      <View style={s.bar}>
        {TABS.map((tab) => {
          if (tab.isPost) {
            return <FABItem key={tab.id} onPress={handlePost} />
          }
          
          const isActive = activeTab === tab.id
          return (
            <Pressable 
              key={tab.id} 
              style={s.tabItem}
              onPress={() => {
                setActiveTab(tab.id)
                if (tab.id === 'home') {
                  // Already on home, do nothing or scroll to top
                } else if (tab.id === 'favorites') {
                  if (!isLoggedIn) {
                    router.push('/(auth)/login' as any)
                    return
                  }
                  // Navigate to favorites with services tab selected
                  router.push('/profile/favorites?tab=خدمات' as any)
                } else if (tab.id === 'listings') {
                  if (!isLoggedIn) {
                    router.push('/(auth)/login' as any)
                    return
                  }
                  // Navigate to user's listings
                  router.push('/profile/my-listings' as any)
                } else if (tab.id === 'profile') {
                  if (!isLoggedIn) {
                    router.push('/(auth)/login' as any)
                    return
                  }
                  router.push('/(tabs)/profile' as any)
                }
              }}
            >
              <View style={s.iconContainer}>
                {isActive && <View style={s.iconBg} />}
                <Ionicons 
                  name={isActive ? tab.icon as any : tab.iconO as any} 
                  size={24} 
                  color={isActive ? Colors.primary : Colors.textMuted} 
                />
              </View>
              <Text style={[s.label, isActive && s.labelActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={s.dot} />}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16, right: 16,
    borderRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  bar: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 2,
    paddingTop: 4,
    paddingBottom: 6,
  },
  iconContainer: {
    width: 44,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBg: {
    position: 'absolute',
    width: 44,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF3FF', // Primary light bg
  },
  label: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 10,
    color: Colors.textMuted,
     letterSpacing: 0.1,
    lineHeight: 16,
    paddingBottom: 2,
  },
  labelActive: {
    fontFamily: Typography.labelMd.fontFamily,
    color: Colors.primary,
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  fabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
  },
  fabCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: Shadows.floating,
      android: { elevation: 10 },
    }),
  },
})
