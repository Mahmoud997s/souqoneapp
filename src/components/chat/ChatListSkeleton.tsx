import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

export const ChatListSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [pulseAnim])

  const items = [
    { hasListing: true },
    { hasListing: false },
    { hasListing: true },
    { hasListing: false },
    { hasListing: false },
  ]

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <Animated.View
          key={index}
          style={[styles.card, { opacity: pulseAnim }]}
        >
          <View style={styles.mainRow}>
            {/* Avatar skeleton */}
            <View style={styles.avatar} />

            {/* Content skeleton */}
            <View style={styles.contentCol}>
              <View style={styles.topRow}>
                <View style={styles.nameLine} />
                <View style={styles.timeLine} />
              </View>
              <View style={styles.messageLine} />
            </View>
          </View>

          {/* Listing snippet skeleton */}
          {item.hasListing && (
            <View style={styles.listingSnippet}>
              <View style={styles.listingThumb} />
              <View style={styles.listingTitleLine} />
            </View>
          )}
        </Animated.View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.space3,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.space3 + 2,
    borderWidth: 1,
    borderColor: '#EEF2F6',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  contentCol: {
    flex: 1,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameLine: {
    width: '40%',
    height: 14,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  timeLine: {
    width: '15%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#EDF2F7',
  },
  messageLine: {
    width: '70%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#EDF2F7',
  },
  listingSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: Spacing.space2 + 2,
    gap: 8,
  },
  listingThumb: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  listingTitleLine: {
    width: '50%',
    height: 11,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
})
