import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { Shadows } from '../../constants/shadows'

export interface ListingDescriptionProps {
  text: string
  collapsedLines?: number
}

/**
 * ListingDescription
 * Collapsible description text block.
 * Defaults to 5 lines collapsed with an expandable "قراءة المزيد" toggle.
 */
export function ListingDescription({
  text,
  collapsedLines = 5,
}: ListingDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!text || !text.trim()) {
    return null
  }

  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>الوصف</Text>

      <Text
        style={s.bodyText}
        numberOfLines={isExpanded ? undefined : collapsedLines}
      >
        {text}
      </Text>

      {text.length > 120 ? (
        <TouchableOpacity
          style={s.toggleButton}
          onPress={() => setIsExpanded((prev) => !prev)}
          activeOpacity={0.7}
          testID="btn-toggle-description"
        >
          <Text style={s.toggleText}>
            {isExpanded ? 'عرض أقل' : 'قراءة المزيد'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={Colors.primary}
          />
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.space3,
    marginHorizontal: Spacing.space4,
    marginVertical: Spacing.space2,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 14,
    lineHeight: 19,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
    marginBottom: Spacing.space2,
  },
  bodyText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    lineHeight: 21,
    color: Colors.text2,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: Spacing.space2,
    paddingVertical: 2,
  },
  toggleText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
  },
})
