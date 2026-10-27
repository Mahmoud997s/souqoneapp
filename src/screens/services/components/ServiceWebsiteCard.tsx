import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../../constants/colors'
import { Spacing } from '../../../constants/spacing'
import { Radius } from '../../../constants/radius'
import type { ServiceWebsiteViewModel } from '../../../types/serviceDetailViewModel.types'
import { dialogService } from '../../../store/dialogStore'

export interface ServiceWebsiteCardProps {
  website?: ServiceWebsiteViewModel
}

/**
 * ServiceWebsiteCard
 * Renders verified website link for the service provider with safe external opening.
 */
export function ServiceWebsiteCard({ website }: ServiceWebsiteCardProps) {
  if (!website || !website.url) {
    return null
  }

  const handleOpenWebsite = async () => {
    try {
      const canOpen = await Linking.canOpenURL(website.url)
      if (canOpen) {
        await Linking.openURL(website.url)
      } else {
        dialogService.alert('تنبيه', 'تعذر فتح الرابط المطلوب', 'error')
      }
    } catch {
      dialogService.alert('تنبيه', 'حدث خطأ أثناء فتح الرابط', 'error')
    }
  }

  return (
    <View style={s.card} testID="service-website-card">
      <View style={s.headerRow}>
        <View style={s.iconCircle}>
          <Ionicons name="globe-outline" size={18} color={Colors.primary} />
        </View>
        <Text style={s.title}>الموقع الإلكتروني</Text>
      </View>

      <TouchableOpacity
        style={s.linkButton}
        onPress={handleOpenWebsite}
        activeOpacity={0.7}
        accessibilityRole="link"
        accessibilityLabel={`زيارة الموقع الإلكتروني ${website.displayUrl}`}
        testID="service-website-link"
      >
        <Text style={s.linkText} numberOfLines={1}>
          {website.displayUrl}
        </Text>
        <Ionicons name="open-outline" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,
    gap: Spacing.space3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: Colors.paleMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Almarai_700Bold',
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.space3,
    paddingVertical: Spacing.space3,
    borderRadius: Radius.md,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Almarai_700Bold',
    color: Colors.primary,
    textAlign: 'left',
    writingDirection: 'ltr', // URLs read LTR
  },
})
