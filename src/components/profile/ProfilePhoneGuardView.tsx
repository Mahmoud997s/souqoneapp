import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
 * - glass: GlassNavBar on calm Colors.homeBg with centered solid wizard card (cars / buses / parts / services / equipment / operators)
 * - app:   AppHeader showBack on calm Colors.homeBg with centered solid wizard card (post/step2)
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
    router.push('/profile/edit-profile' as never);
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
      <View style={s.root} testID="profile-phone-guard-view">
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

        <GlassNavBar
          title={title}
          paddingTop={insets.top}
          onBackPress={handleBack}
          actions={[
            { icon: 'chatbubble-outline', onPress: () => router.push('/(tabs)/chat' as never), accessibilityLabel: 'الرسائل' },
            { icon: 'notifications-outline', onPress: () => router.push('/profile/notifications' as never), accessibilityLabel: 'الإشعارات' },
          ]}
        />

        <ScrollView
          testID="profile-phone-guard-scroll"
          style={s.flex}
          contentContainerStyle={[
            s.scrollContent,
            {
              paddingTop: insets.top + 52 + Spacing.space5,
              paddingBottom: Math.max(insets.bottom, Spacing.space4) + Spacing.space5,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View testID="profile-phone-guard-card" style={s.card}>
            {body}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.root} testID="profile-phone-guard-view">
      <AppHeader
        title={title}
        showBack
        variant="default"
        onLeftPress={handleBack}
      />

      <ScrollView
        testID="profile-phone-guard-scroll"
        style={s.flex}
        contentContainerStyle={[
          s.scrollContent,
          {
            paddingTop: Spacing.space4,
            paddingBottom: Math.max(insets.bottom, Spacing.space4) + Spacing.space4,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View testID="profile-phone-guard-card" style={s.card}>
          {body}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  root: {
    flex: 1,
    backgroundColor: Colors.homeBg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.space4,
  },
  card: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    alignItems: 'center',
    gap: Spacing.space3,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    ...Platform.select({
      ios: { shadowColor: Colors.slateHeading, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1.5 },
    }),
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.infoSoftBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.space2,
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    lineHeight: 26,
    paddingVertical: 2,
    color: Colors.slateHeading,
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
