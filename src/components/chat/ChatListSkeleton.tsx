import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Colors } from '../../constants/colors'

export const ChatListSkeleton: React.FC = () => {
  const pulseAnim = useRef(new Animated.Value(0.45)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [pulseAnim])

  const items = [0, 1, 2, 3, 4, 5]

  return (
    <View style={styles.container} testID="chat-list-skeleton">
      {items.map((idx) => (
        <Animated.View key={idx} style={[styles.row, { opacity: pulseAnim }]}>
          <View style={styles.avatar} />
          <View style={styles.contentCol}>
            <View style={styles.topRow}>
              <View style={styles.nameLine} />
              <View style={styles.timeLine} />
            </View>
            <View style={styles.metaLine} />
            <View style={styles.messageLine} />
          </View>
          <View style={styles.divider} />
        </Animated.View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
  },
  row: {
    height: 76,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.slateSubtleBg,
  },
  contentCol: {
    flex: 1,
    marginStart: 12,
    justifyContent: 'center',
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameLine: {
    width: 120,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.slateSubtleBg,
  },
  timeLine: {
    width: 36,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.slateSubtleBg,
  },
  metaLine: {
    width: 150,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.slateSubtleBg,
  },
  messageLine: {
    width: '82%',
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.slateSubtleBg,
  },
  divider: {
    position: 'absolute',
    bottom: 0,
    start: 74,
    end: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.chatDivider,
  },
})
