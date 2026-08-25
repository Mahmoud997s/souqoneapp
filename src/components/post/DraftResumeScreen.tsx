import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { AppHeader } from '../ui/AppHeader'
import { AppButton } from '../ui/AppButton'

interface DraftResumeScreenProps {
  categoryName: string
  draftTitle: string
  completionPercentage?: number
  lastSavedText?: string
  onResume: () => void
  onDiscard: () => void
}

export function DraftResumeScreen({
  categoryName,
  draftTitle,
  completionPercentage = 30,
  lastSavedText = 'تم الحفظ مؤخراً',
  onResume,
  onDiscard,
}: DraftResumeScreenProps) {
  return (
    <View style={styles.container}>
      <AppHeader title="إعلانات غير مكتملة" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="document-text-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>لديك مسودة {categoryName} غير مكتملة</Text>
          <Text style={styles.subtitle}>
            لقد بدأت في إضافة إعلان سابقاً ولم تكمله. هل تود استكمال البيانات أم مسحها والبدء من جديد؟
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.draftTitle} numberOfLines={2}>
              {draftTitle}
            </Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>مسودة</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>نسبة الاكتمال تقريباً</Text>
              <Text style={styles.progressValue}>{completionPercentage}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
            </View>
          </View>

          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={16} color={Colors.text2} />
            <Text style={styles.timeText}>{lastSavedText}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="استكمال الإعلان" onPress={onResume} style={styles.resumeBtn} />
        <AppButton
          title="مسح والبدء بإعلان جديد"
          onPress={onDiscard}
          variant="outline"
          style={styles.discardBtn}
          textStyle={styles.discardBtnText}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    padding: Spacing.space4,
    paddingTop: Spacing.space8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.space6,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.space4,
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.space2,
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 15,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.space4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.space4,
  },
  draftTitle: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    lineHeight: 24,
  },
  badge: {
    backgroundColor: Colors.warning + '20',
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space1,
    borderRadius: Radius.pill,
    marginLeft: Spacing.space3,
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.warning,
  },
  progressSection: {
    marginBottom: Spacing.space4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.space2,
  },
  progressText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.text2,
  },
  progressValue: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    color: Colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.space3,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  timeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.text2,
    marginLeft: Spacing.space2,
  },
  footer: {
    padding: Spacing.space4,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Spacing.space8, // safe area padding fallback
  },
  resumeBtn: {
    marginBottom: Spacing.space3,
  },
  discardBtn: {
    borderColor: Colors.error,
  },
  discardBtnText: {
    color: Colors.error,
  },
})
