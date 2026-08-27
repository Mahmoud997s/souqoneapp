import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image, Dimensions } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Gradients } from '../../constants/gradients'

const { width } = Dimensions.get('window')

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
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
})

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

  // Generate overlapping images
  const displayImages = images.slice(0, 4)
  const remainingImagesCount = Math.max(0, images.length - 4)

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* ── Fixed Top Navigation Bar ── */}
      <View style={[styles.navBarFixed, { paddingTop: insets.top }]}>
        <View style={styles.navBarRow}>
          <TouchableOpacity
            style={styles.navBtn}
            activeOpacity={0.75}
            onPress={() => router.back()}
            accessibilityLabel="رجوع"
          >
            <Ionicons name="arrow-forward-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
          <View style={styles.navTitleContainer}>
            <Text style={styles.navTitle}>إعلان غير مكتمل</Text>
          </View>
          <View style={styles.placeholderBtn} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 60,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          }
        ]}
        bounces={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <LinearGradient
              colors={Gradients.primary as any}
              style={styles.heroIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="document-text" size={40} color={Colors.white} />
            </LinearGradient>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{categoryName}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>مرحباً بعودتك!</Text>
          <Text style={styles.heroSubtitle}>
            لقد قطعت شوطاً في إضافة إعلانك. يمكنك إكمال التفاصيل المتبقية الآن ليكون متاحاً للمشترين.
          </Text>
        </View>

        {/* Draft Card */}
        <View style={styles.cardContainer}>
          {images.length > 0 && (
            <View style={styles.imageGalleryContainer}>
              {displayImages.map((img, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.galleryImageWrapper,
                    { zIndex: displayImages.length - idx, marginRight: idx > 0 ? -12 : 0 }
                  ]}
                >
                  <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
                </View>
              ))}
              {remainingImagesCount > 0 && (
                <View style={[styles.galleryImageWrapper, styles.remainingImagesWrapper, { zIndex: 0, marginRight: -12 }]}>
                  <Text style={styles.remainingImagesText}>+{remainingImagesCount}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.draftInfo}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {draftTitle}
            </Text>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.timeText}>{lastSavedText}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>نسبة اكتمال الإعلان</Text>
              <Text style={styles.progressValue}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <LinearGradient
                colors={Gradients.primary as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressBarFill, { width: `${completionPercentage}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Actions Area */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onResume} activeOpacity={0.85}>
            <LinearGradient
              colors={Gradients.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Ionicons name="rocket-outline" size={20} color={Colors.white} />
              <Text style={styles.primaryBtnText}>استكمال ونشر الإعلان</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={onDiscard} activeOpacity={0.6}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.secondaryBtnText}>تجاهل المسودة والبدء من جديد</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  
  /* Top Navigation Bar */
  navBarFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: 'rgba(248, 250, 252, 0.98)',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.8)',
  },
  navBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...(softShadow as any),
  },
  placeholderBtn: {
    width: 40,
    height: 40,
  },
  navTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  navTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: '#0F172A',
  },

  /* Scroll Content */
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.space4,
    alignItems: 'center',
  },

  /* Hero Section */
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.space6,
    paddingHorizontal: Spacing.space4,
    width: '100%',
  },
  heroIconContainer: {
    position: 'relative',
    marginBottom: Spacing.space4,
  },
  heroIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '10deg' }],
    ...(softShadow as any),
  },
  heroBadge: {
    position: 'absolute',
    bottom: -6,
    right: -10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: '#F8FAFC',
    ...(softShadow as any),
  },
  heroBadgeText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    color: Colors.primary,
  },
  heroTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 24,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },

  /* Shared Card Container (Draft) */
  cardContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    marginBottom: Spacing.space5,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    gap: Spacing.space4,
    ...(softShadow as any),
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    color: '#0F172A',
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 22,
    marginBottom: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },

  /* Draft Specific Items */
  imageGalleryContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 8,
  },
  galleryImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
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
    backgroundColor: '#F1F5F9',
  },
  remainingImagesText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 12,
    color: '#64748B',
  },
  draftInfo: {
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  timeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginLeft: 6,
  },
  progressSection: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: '#475569',
  },
  progressValue: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    color: Colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },

  /* Actions Area */
  actionsContainer: {
    width: '100%',
    gap: 16,
    marginTop: Spacing.space2,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: Colors.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.lg,
  },
  secondaryBtnText: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 13,
    color: '#EF4444',
  },
})
