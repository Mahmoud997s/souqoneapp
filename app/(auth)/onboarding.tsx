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
import { useAuthStore } from '../../src/store/authStore'

const SLIDES = [
  {
    key: '1',
    icon: 'car-sport' as const,
    title: 'سوق المركبات المتكامل في عُمان',
    subtitle: 'سيارات، نقل وشاحنات، باصات، ومعدات ثقيلة في مكان واحد',
  },
  {
    key: '2',
    icon: 'construct' as const,
    title: 'سوق قطع الغيار والإكسسوارات',
    subtitle: 'اطلب واعثر على قطع الغيار الأصلية والمستعملة بكل سهولة',
  },
  {
    key: '3',
    icon: 'chatbubbles' as const,
    title: 'تواصل مباشر وصفقات موثوقة',
    subtitle: 'دردشة فورية ومفاوضات آمنة مع المشترين والتجار الموثقين',
  },
]

export default function OnboardingScreen() {
  const setGuest = useAuthStore((st) => st.setGuest)
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
          onPress={() => {
            setGuest(true)
            router.replace('/(tabs)')
          }}
          style={s.guestPill}
          activeOpacity={0.7}
        >
          <Text style={s.guestPillTxt}>المتابعة كزائر ←</Text>
        </TouchableOpacity>

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
            <Ionicons name={slide.icon} size={64} color={Colors.primary} />
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
  container: { flex: 1, backgroundColor: Colors.surfaceAlt },
  topBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.space5, 
    paddingTop: Spacing.space2 
  },
  guestPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    borderWidth: 1,
    borderColor: 'rgba(0, 156, 181, 0.25)',
  },
  guestPillTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
  },
  skipBtn: { 
    paddingHorizontal: Spacing.space3, 
    paddingVertical: Spacing.space1, 
    borderRadius: Radius.pill 
  },
  skipTxt: {
    fontFamily: 'Almarai_700Bold',  
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space4,
  },
  illustrationWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBg: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.paleMint,
  },
  iconCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  textWrap: { alignItems: 'center', gap: Spacing.space2 },
  slideTitle: {
    fontFamily: 'Almarai_800ExtraBold',  
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  slideSubtitle: {
    fontFamily: 'Almarai_400Regular',  
    fontSize: 13.5,
    lineHeight: 21,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 270,
    writingDirection: 'rtl',
  },
  bottomPanel: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.space5,
    paddingTop: Spacing.space6,
    paddingBottom: 36,
    gap: Spacing.space5,
    borderTopWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  dotInactive: { width: 6, backgroundColor: Colors.border },
  loginTxt: {
    fontFamily: 'Almarai_400Regular',  
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  loginLink: { fontFamily: 'Almarai_700Bold', color: Colors.primary },
})
