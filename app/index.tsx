import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuthStore } from '../src/store/authStore'
import { Gradients } from '../src/constants/gradients'

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
    <LinearGradient colors={Gradients.hero as any} locations={[0, 0.6, 1]} style={s.container}>
      {/* Center Logo */}
      <View style={s.centerSection}>
        <Animated.View style={[s.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require('../assets/icon.png')}
            style={s.appIcon}
            contentFit="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom Text and Spinner */}
      <View style={s.bottomSection}>
        <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textTranslateY }], alignItems: 'center' }}>
          <Text style={s.tagline}>منصة المركبات الأولى في عُمان</Text>
        </Animated.View>
        
        <Animated.View style={[s.spinWrap, { opacity: spinnerOpacity }]}>
          <Animated.View style={[s.spinner, { transform: [{ rotate }] }]} />
        </Animated.View>
      </View>
      
      <LinearGradient
        colors={['transparent', '#0B244780']}
        style={s.overlay}
        pointerEvents="none"
      />
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerSection: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoContainer: {
    // Removed elevation/shadow as animating scale on elevated views causes native crashes on Android
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIcon: { 
    width: 150, 
    height: 150, 
    borderRadius: 32,
    backgroundColor: 'transparent'
  },
  bottomSection: {
    position: 'absolute',
    bottom: height * 0.15, // Put text and spinner slightly above the bottom
    alignItems: 'center',
    zIndex: 3,
    width: '100%',
  },
  tagline: {
    fontFamily: 'Almarai_700Bold', 
    paddingTop: 4, 
    paddingBottom: 4, 
    includeFontPadding: false, 
    fontSize: 18,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    maxWidth: 280,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spinWrap: {
    marginTop: 40,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: '#E8781E',
  },
  overlay: { position: 'absolute', bottom: 0, start: 0, end: 0, height: height * 0.4, zIndex: 1 },
})
