import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Colors } from '../../constants/colors'

export function ChatSkeleton() {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start()
  }, [])

  const bgOwn = anim.interpolate({ inputRange: [0, 1], outputRange: ['#E0F2FE', '#BAE6FD'] }) // Light blue shades
  const bgOther = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.surface, Colors.border] })

  const bubbles = [
    { isOwn: false, width: '60%', height: 44, marginTop: 16 },
    { isOwn: true, width: '40%', height: 44, marginTop: 12 },
    { isOwn: true, width: '75%', height: 64, marginTop: 4 },
    { isOwn: false, width: '50%', height: 44, marginTop: 16 },
    { isOwn: false, width: '70%', height: 84, marginTop: 4 },
    { isOwn: true, width: '50%', height: 44, marginTop: 16 },
  ]

  return (
    <View style={s.container}>
      {bubbles.map((b, i) => (
        <View key={i} style={[s.msgRow, b.isOwn ? s.msgOwn : s.msgOther, { marginTop: b.marginTop }]}>
          <Animated.View
            style={[
              s.bubble,
              b.isOwn ? s.bubbleOwn : s.bubbleOther,
              { width: b.width as any, height: b.height },
              { backgroundColor: b.isOwn ? bgOwn : bgOther }
            ]}
          />
        </View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  msgRow: {
    width: '100%',
  },
  msgOwn: {
    alignItems: 'flex-end',
  },
  msgOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
  },
  bubbleOwn: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 4,
  }
})
