import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import Svg, { Circle } from 'react-native-svg'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { GlassNavBar } from '../ui/GlassNavBar'

interface DraftResumeScreenProps {
  categoryName: string
  draftTitle: string
  completionPercentage?: number
  lastSavedText?: string
  images?: string[]
  onResume: () => void
  onDiscard: () => void
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
  },
  android: { elevation: 3 },
})

const RING_RADIUS = 22
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

export function DraftResumeScreen({
  categoryName,
  draftTitle,
  completionPercentage = 30,
  lastSavedText = 'تم الحفظ مؤخراً',
  images = [],
  onResume,
  onDiscard,
}: DraftResumeScreenProps) {
  const insets = useSafeAreaInsets()

  const displayImages = images.slice(0, 3)
  const remainingImagesCount = Math.max(0, images.length - 3)
  const ringOffset = RING_CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, completionPercentage)) / 100)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Ambient glass backdrop ── */}
      <LinearGradient
        colors={['#EAF2FF', '#F3EEFF', '#FFF6EE']}
        locations={[0, 0.55, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.orb, styles.orbPrimary]} pointerEvents="none" />
      <View style={[styles.orb, styles.orbAccent]} pointerEvents="none" />

      {/* ── Top Header ── */}
      <GlassNavBar
        title="إعلان غير مكتمل"
        paddingTop={insets.top}
        onBackPress={() => router.back()}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 52 + Spacing.space5,
            paddingBottom: Math.max(insets.bottom, 14) + 150,
          }
        ]}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={styles.heroSection}>
          <Text style={styles.eyebrow}>لديك مسودة محفوظة</Text>
          <Text style={styles.heroTitle}>أكمل من حيث توقفت، أو ابدأ إعلاناً جديداً</Text>
        </View>

        {/* Glass Draft Card */}
        <View style={styles.cardOuter}>
          <BlurView intensity={45} tint="light" experimentalBlurMethod="dimezisBlurView" style={styles.cardContainer}>
            {images.length > 0 && (
              <View style={styles.photoRow}>
                <View style={styles.photoStack}>
                  {displayImages.map((img, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.galleryImageWrapper,
                        { zIndex: displayImages.length - idx, marginStart: idx > 0 ? -14 : 0 }
                      ]}
                    >
                      <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
                    </View>
                  ))}
                  {remainingImagesCount > 0 && (
                    <View style={[styles.galleryImageWrapper, styles.remainingImagesWrapper, { marginStart: -14 }]}>
                      <Text style={styles.remainingImagesText}>+{remainingImagesCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.photoCaption}>{images.length} صور مرفقة</Text>
              </View>
            )}

            <View style={styles.titleRow}>
              <View style={styles.titleCol}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {draftTitle}
                </Text>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{categoryName}</Text>
                </View>
              </View>

              <View style={styles.progressRing}>
                <Svg width={52} height={52} viewBox="0 0 52 52">
                  <Circle
                    cx={26}
                    cy={26}
                    r={RING_RADIUS}
                    stroke="rgba(15,23,42,0.08)"
                    strokeWidth={5}
                    fill="none"
                  />
                  <Circle
                    cx={26}
                    cy={26}
                    r={RING_RADIUS}
                    stroke={Colors.primary}
                    strokeWidth={5}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={ringOffset}
                    rotation={-90}
                    origin="26, 26"
                  />
                </Svg>
                <Text style={styles.progressRingText}>{completionPercentage}%</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.metaText}>{lastSavedText}</Text>
            </View>
          </BlurView>
        </View>
      </ScrollView>

      {/* ── Fixed Bottom Actions ── */}
      <BlurView
        intensity={55}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}
      >
        <TouchableOpacity style={styles.primaryBtn} onPress={onResume} activeOpacity={0.9}>
          <Ionicons name="rocket-outline" size={20} color={Colors.white} />
          <Text style={styles.primaryBtnText}>استكمال ونشر الإعلان</Text>
        </TouchableOpacity>

        <View style={styles.secondaryBtnOuter}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onDiscard} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={styles.secondaryBtnText}>تجاهل المسودة والبدء من جديد</Text>
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EEFF',
  },

  /* Ambient orbs */
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

  /* Scroll Content */
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.space4,
    alignItems: 'center',
  },

  /* Intro */
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.space5,
    paddingHorizontal: Spacing.space4,
    width: '100%',
    gap: 6,
  },
  eyebrow: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  heroTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 20,
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 28,
  },

  /* Glass Draft Card */
  cardOuter: {
    width: '100%',
    borderRadius: Radius.xl,
    marginBottom: Spacing.space5,
    ...(softShadow as any),
  },
  cardContainer: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    overflow: 'hidden',
    gap: Spacing.space4,
  },

  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  photoStack: {
    flexDirection: 'row',
  },
  galleryImageWrapper: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md - 2,
  },
  remainingImagesWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  remainingImagesText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    color: '#64748B',
  },
  photoCaption: {
    marginStart: 'auto',
    fontFamily: 'Almarai_400Regular',
    fontSize: 11.5,
    color: '#8791A3',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: '#0F172A',
    textAlign: 'left',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  categoryPill: {
    marginTop: 6,
    backgroundColor: 'rgba(13,48,96,0.08)',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  categoryPillText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11.5,
    color: Colors.primary,
  },

  progressRing: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingText: {
    position: 'absolute',
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    color: Colors.primary,
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.08)',
    width: '100%',
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: '#64748B',
  },

  /* Fixed Bottom Actions */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    gap: 10,
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.5)',
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtnText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: Colors.white,
  },
  secondaryBtnOuter: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.35)',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  secondaryBtnText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    color: Colors.error,
  },
})
