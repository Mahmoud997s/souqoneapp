import { useState } from 'react'
import { Spacing } from '../../src/constants/spacing'
import { Shadows } from '../../src/constants/shadows'
import { Radius } from '../../src/constants/radius'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { AppButton } from '../../src/components/ui/AppButton'
import { Colors } from '../../src/constants/colors'

const SLIDES = [
  {
    key: '1',
    icon: 'car-sport' as const,
    title: 'اعثر على سيارة أحلامك',
    subtitle: 'آلاف الإعلانات في مكان واحد',
  },
  {
    key: '2',
    icon: 'pricetag' as const,
    title: 'بع سيارتك بسهولة',
    subtitle: 'أضف إعلانك في دقائق',
  },
  {
    key: '3',
    icon: 'chatbubbles' as const,
    title: 'تواصل مع البائعين',
    subtitle: 'دردشة مباشرة وآمنة',
  },
]

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      setIndex(index + 1)
    } else {
      router.replace('/(auth)/login')
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={s.skipBtn}
          activeOpacity={0.7}
        >
          <Text style={s.skipTxt}>تخطي</Text>
        </TouchableOpacity>
      </View>

      <View style={s.slide}>
        <View style={s.illustrationWrap}>
          <View style={s.illustrationBg} />
          <View style={s.iconCircle}>
            <Ionicons name={slide.icon} size={100} color={Colors.primary} />
          </View>
        </View>
        <View style={s.textWrap}>
          <Text style={s.slideTitle}>{slide.title}</Text>
          <Text style={s.slideSubtitle}>{slide.subtitle}</Text>
        </View>
      </View>

      <View style={s.bottomPanel}>
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[s.dot, i === index ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>

        <AppButton
          title={index === SLIDES.length - 1 ? 'ابدأ الآن' : 'التالي'}
          onPress={goNext}
        />

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={0.7}
        >
          <Text style={s.loginTxt}>
            لديك حساب بالفعل؟{'  '}
            <Text style={s.loginLink}>تسجيل الدخول</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9fc' },
  topBar: { alignItems: 'flex-start', paddingHorizontal: Spacing.space5, paddingTop: Spacing.space1 },
  skipBtn: { paddingHorizontal: Spacing.space4, paddingVertical: Spacing.space2, borderRadius: 999 },
  skipTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 12,
    lineHeight: 16,
    color: '#4B5563',
    writingDirection: 'rtl',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space6,
  },
  illustrationWrap: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBg: {
    position: 'absolute',
    width: '80%',
    height: '80%',
    borderRadius: 999,
    backgroundColor: 'rgba(0,53,148,0.05)',
    transform: [{ scale: 1.25 }],
  },
  iconCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  textWrap: { alignItems: 'center', gap: Spacing.space3 },
  slideTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 24,
    lineHeight: 32,
    color: Colors.primary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  slideSubtitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
    textAlign: 'center',
    maxWidth: 280,
    writingDirection: 'rtl',
  },
  bottomPanel: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space8,
    paddingBottom: 40,
    gap: Spacing.space6,
    ...Shadows.card,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.space2,
  },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 32, backgroundColor: Colors.primary },
  dotInactive: { width: 8, backgroundColor: '#c3c6d6' },
  loginTxt: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  loginLink: { fontFamily: 'Almarai_700Bold',  color: Colors.primary },
})
