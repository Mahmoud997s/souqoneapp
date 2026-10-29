import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Radius } from '../../constants/radius';
import { Spacing } from '../../constants/spacing';
import { AppHeader } from '../ui/AppHeader';
import { GlassNavBar } from '../ui/GlassNavBar';
import { AppButton } from '../ui/AppButton';
import { PROFILE_PHONE_REQUIRED_MESSAGE } from '../../utils/profilePhoneGuard';

/**
 * Header style of the form that renders the guard:
 * - glass: GlassNavBar + ambient gradient (cars / buses / parts / services / equipment ...)
 * - app:   AppHeader showBack (post/step2, carrier-onboarding)
 */
export type ProfilePhoneGuardHeaderVariant = 'glass' | 'app';

interface Props {
  title?: string;
  onBack?: () => void;
  headerVariant?: ProfilePhoneGuardHeaderVariant;
}

const GUARD_TITLE = 'أضف رقم هاتفك الأول';
const GUARD_HINT = 'يظهر رقمك للمشتري فقط عند ضغطه على اتصال أو واتساب';

export function ProfilePhoneGuardView({ title = 'إضافة إعلان', onBack, headerVariant = 'app' }: Props) {
  const insets = useSafeAreaInsets();
  const isGlass = headerVariant === 'glass';

  const handleAddPhone = () => {
    router.push('/profile/edit-profile' as any);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const body = (
    <>
      <View style={s.iconWrap}>
        <Ionicons name="call" size={30} color={Colors.primary} />
      </View>

      <Text style={s.cardTitle} maxFontSizeMultiplier={1.3}>{GUARD_TITLE}</Text>
      <Text style={s.cardMessage} maxFontSizeMultiplier={1.3}>{PROFILE_PHONE_REQUIRED_MESSAGE}</Text>
      <Text style={s.cardHint} maxFontSizeMultiplier={1.3}>{GUARD_HINT}</Text>

      <TouchableOpacity
        style={s.fullWidth}
        onPress={handleAddPhone}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel="أضف رقمك"
        testID="guard-add-phone-btn"
      >
        <View pointerEvents="none">
          <AppButton title="أضف رقمك" icon="create-outline" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.secondaryBtn}
        onPress={handleBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="الرجوع"
        testID="guard-back-btn"
      >
        <Text style={s.secondaryBtnText} maxFontSizeMultiplier={1.3}>الرجوع</Text>
      </TouchableOpacity>
    </>
  );

  if (isGlass) {
    return (
      <View style={s.glassRoot} testID="profile-phone-guard-view">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <LinearGradient
          colors={['#EAF2FF', '#F3EEFF', '#FFF6EE']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[s.orb, s.orbPrimary]} pointerEvents="none" />
        <View style={[s.orb, s.orbAccent]} pointerEvents="none" />

        <GlassNavBar
          title={title}
          paddingTop={insets.top}
          onBackPress={handleBack}
          actions={[
            { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as any), accessibilityLabel: 'الرسائل' },
            { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as any), accessibilityLabel: 'الإشعارات' },
          ]}
        />

        <ScrollView
          style={s.flex}
          contentContainerStyle={[s.glassContent, { paddingTop: insets.top + 52 + Spacing.space3 }]}
          showsVerticalScrollIndicator={false}
        >
          <BlurView intensity={50} tint="light" blurMethod="dimezisBlurView" style={s.glassCard}>
            <View style={s.whiteWash} pointerEvents="none" />
            <View style={s.tint} pointerEvents="none" />
            {body}
          </BlurView>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.appRoot} testID="profile-phone-guard-view">
      <AppHeader
        title={title}
        showBack
        variant="default"
        onLeftPress={handleBack}
      />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.appContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.appCard}>{body}</View>
      </ScrollView>
    </View>
  );
}

const cardBase = {
  borderRadius: Radius.lg,
  padding: Spacing.space4,
  alignItems: 'center' as const,
  gap: Spacing.space3,
};

const s = StyleSheet.create({
  flex: { flex: 1 },
  glassRoot: {
    flex: 1,
    backgroundColor: '#F3EEFF',
  },
  appRoot: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orbPrimary: {
    width: 260,
    height: 260,
    top: -80,
    left: -70,
    backgroundColor: Colors.primary,
    opacity: 0.08,
  },
  orbAccent: {
    width: 220,
    height: 220,
    bottom: 80,
    right: -60,
    backgroundColor: Colors.accent,
    opacity: 0.1,
  },
  glassContent: {
    paddingHorizontal: Spacing.space4 - 4,
    paddingBottom: 120,
  },
  appContent: {
    padding: Spacing.space4,
    paddingBottom: 120,
  },
  glassCard: {
    ...cardBase,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  appCard: {
    ...cardBase,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  whiteWash: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  tint: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.primary,
    opacity: 0.04,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.space2,
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 26,
    paddingVertical: 2,
    color: '#0F172A',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardMessage: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 22,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cardHint: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10.5,
    lineHeight: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
  },
  fullWidth: {
    width: '100%',
  },
  secondaryBtn: {
    width: '100%',
    height: Spacing.touch,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
});
