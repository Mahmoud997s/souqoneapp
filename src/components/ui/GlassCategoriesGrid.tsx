import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StyleProp,
  ViewStyle,
} from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { GestureDetector, Gesture } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'
import { Spacing } from '../../constants/spacing'
import {
  physicalRightStyle,
  getGestureDirectionMultiplier,
} from '../../utils/physicalDirection'

export interface GlassCategoryTabItem {
  id: string
  label: string
  icon: string | any
  iconType?: 'ion' | 'material'
  iconColor: string
  iconBg: string
  onPress: () => void
}

export interface GlassCategoriesGridProps {
  items: GlassCategoryTabItem[]
  compact?: boolean
  scrollable?: boolean
  tabWidth?: number
  containerStyle?: StyleProp<ViewStyle>
}

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const DEFAULT_TAB_WIDTH = 88
const TAB_GAP = 8
const PADDING_END = Spacing.space5 // 16px

export function GlassCategoriesGrid({
  items,
  compact,
  scrollable,
  tabWidth = DEFAULT_TAB_WIDTH,
  containerStyle,
}: GlassCategoriesGridProps) {
  const isScrollable = scrollable ?? items.length > 5
  const isCompact = compact ?? (!isScrollable && items.length >= 5)

  // ── Scrollable Track Measurement & State ──
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH)
  const count = items.length
  const step = tabWidth + TAB_GAP
  const totalContentWidth = PADDING_END + count * tabWidth + (count - 1) * TAB_GAP + PADDING_END
  const maxScroll = Math.max(0, totalContentWidth - containerWidth)

  const directionMultiplier = getGestureDirectionMultiplier()

  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-15, 15])
      .onStart(() => {
        cancelAnimation(translateX)
        startX.value = translateX.value
      })
      .onUpdate((event) => {
        if (maxScroll <= 0) return
        const dx = event.translationX * directionMultiplier
        const rawX = startX.value + dx

        if (rawX < 0) {
          translateX.value = rawX * 0.25
        } else if (rawX > maxScroll) {
          const over = rawX - maxScroll
          translateX.value = maxScroll + over * 0.25
        } else {
          translateX.value = rawX
        }
      })
      .onEnd((event) => {
        if (maxScroll <= 0) return
        const vx = event.velocityX * directionMultiplier
        const currentX = translateX.value

        if (currentX < 0) {
          translateX.value = withSpring(0, { damping: 22, stiffness: 200 })
          return
        }
        if (currentX > maxScroll) {
          translateX.value = withSpring(maxScroll, { damping: 22, stiffness: 200 })
          return
        }

        // Momentum projection based on velocity flick
        const projectedX = currentX + vx * 0.25
        const clampedProjectedX = Math.max(0, Math.min(maxScroll, projectedX))

        // Snap to nearest tab step for clean alignment, bounded by [0, maxScroll]
        const nearestStep = Math.round(clampedProjectedX / step) * step
        const finalTarget = Math.max(0, Math.min(maxScroll, nearestStep))

        translateX.value = withSpring(finalTarget, {
          damping: 24,
          stiffness: 180,
          velocity: Math.abs(vx) > 150 ? vx * 0.5 : 0,
        })
      })
  }, [directionMultiplier, maxScroll, step])

  const animatedTrackStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  const renderIcon = (item: GlassCategoryTabItem, size: number) => {
    if (item.iconType === 'material') {
      return (
        <MaterialCommunityIcons
          name={item.icon}
          size={size}
          color={item.iconColor}
        />
      )
    }
    return (
      <Ionicons
        name={item.icon}
        size={size}
        color={item.iconColor}
      />
    )
  }

  // ── 1. Scrollable Gesture Mode (New Physics Engine) ──
  if (isScrollable) {
    return (
      <View
        style={[s.scrollableContainer, containerStyle]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width
          if (w > 0 && w !== containerWidth) {
            setContainerWidth(w)
          }
        }}
      >
        <GestureDetector gesture={panGesture}>
          <View style={s.scrollableGestureArea}>
            <Animated.View style={[s.scrollableTrack, animatedTrackStyle]}>
              {items.map((item, index) => {
                const rightOffset = PADDING_END + index * step

                return (
                  <View
                    key={item.id}
                    style={[
                      s.scrollableItemWrapper,
                      {
                        width: tabWidth,
                        ...physicalRightStyle(rightOffset),
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={s.catItemScrollable}
                      activeOpacity={0.7}
                      onPress={item.onPress}
                    >
                      <View
                        style={[
                          s.catIconBox,
                          { backgroundColor: item.iconBg },
                        ]}
                      >
                        {renderIcon(item, 20)}
                      </View>
                      <Text
                        style={s.catLabelScrollable}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
              })}
            </Animated.View>
          </View>
        </GestureDetector>
      </View>
    )
  }

  // ── 2. Static Flex Row Grid (Cars, Buses, Equipment) ──
  return (
    <View style={[s.container, containerStyle]}>
      <View style={[s.catsGrid, isCompact && s.catsGridCompact]}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[s.catItem, isCompact && s.catItemCompact]}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <View
              style={[
                s.catIconBox,
                isCompact && s.catIconBoxCompact,
                { backgroundColor: item.iconBg },
              ]}
            >
              {renderIcon(item, isCompact ? 17 : 20)}
            </View>
            <Text
              style={[s.catLabel, isCompact && s.catLabelCompact]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  catsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  catsGridCompact: {
    gap: 6,
  },
  catItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3, // 3D floating shadow
  },
  catItemCompact: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: Radius.md,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catIconBoxCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
  catLabelCompact: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 15,
    paddingTop: 1,
    writingDirection: 'rtl',
  },

  // ── Scrollable Track Styles ──
  scrollableContainer: {
    marginHorizontal: -Spacing.space5,
    width: SCREEN_WIDTH,
  },
  scrollableGestureArea: {
    width: '100%',
    height: 96,
    overflow: 'hidden',
    position: 'relative',
  },
  scrollableTrack: {
    ...StyleSheet.absoluteFill,
  },
  scrollableItemWrapper: {
    position: 'absolute',
    top: 4,
  },
  catItemScrollable: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  catLabelScrollable: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 16,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
})
