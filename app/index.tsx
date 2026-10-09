import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'
import { Gradients } from '../src/constants/gradients'
import { Colors } from '../src/constants/colors'

const { width, height } = Dimensions.get('window')

export default function SplashScreen() {
  const { isLoggedIn } = useAuthStore()
  
  const spinAnim = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.5)).current
  const logoOpacity = useRef(new Animated.Value(0)).current
  const textTranslateY = useRef(new Animated.Value(20)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const spinnerOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // 1. Entrance Animations Sequence
    const entranceAnim = Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ]),
      Animated.parallel([
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      ]),
      Animated.timing(spinnerOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]);
    
    entranceAnim.start()

    // 2. Continuous Spin Animation
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    spinLoop.start()

    // Cleanup animations on unmount to prevent native driver crashes!
    return () => {
      entranceAnim.stop()
      spinLoop.stop()
    }
  }, [])

  useEffect(() => {
    let isMounted = true;
    const t = setTimeout(() => {
      if (isMounted) {
        router.replace(isLoggedIn ? '/(tabs)' : '/(auth)/onboarding')
      }
    }, 2500)
    return () => {
      isMounted = false;
      clearTimeout(t)
    }
  }, [isLoggedIn])

  const rotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <LinearGradient colors={['#FFFFFF', '#F7F8FA']} locations={[0, 1]} style={s.container}>
      {/* Center Logo Section */}
      <View style={s.centerSection}>
        <Animated.View style={[s.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <View style={s.logoBox}>
            <Image
              source={require('../assets/logo.png')}
              style={s.appIcon}
              contentFit="contain"
            />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }], alignItems: 'center', marginTop: 12 }}>
          <Text style={s.brandTitle}>سوق وان</Text>
          <Text style={s.tagline}>منصة المركبات والخدمات الأولى في سلطنة عُمان 🇴🇲</Text>
        </Animated.View>
      </View>

      {/* Bottom Spinner Section */}
      <View style={s.bottomSection}>
        <Animated.View style={[s.spinWrap, { opacity: spinnerOpacity }]}>
          <Animated.View style={[s.spinner, { transform: [{ rotate }] }]} />
        </Animated.View>
      </View>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  centerSection: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#009CB5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  appIcon: { 
    width: 60, 
    height: 60, 
  },
  brandTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    lineHeight: 30,
    color: '#11232E',
    textAlign: 'center',
    marginBottom: 4,
  },
  tagline: {
    fontFamily: 'Almarai_700Bold', 
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 260,
  },
  bottomSection: {
    position: 'absolute',
    bottom: height * 0.12,
    alignItems: 'center',
    zIndex: 3,
    width: '100%',
  },
  spinWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#E5E7EB',
    borderTopColor: '#009CB5',
  },
})
