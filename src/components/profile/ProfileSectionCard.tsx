import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { MenuItem } from '../../types/profile.types'

interface ProfileSectionCardProps {
  title: string
  items: MenuItem[]
}

const softShadow = Platform.select({
  ios: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  android: { elevation: 1.5 },
})

export function ProfileSectionCard({ title, items }: ProfileSectionCardProps) {
  return (
    <View style={s.sectionWrap}>
      <Text style={s.sectionHeaderTitle}>{title}</Text>
      <View style={s.cardGroup}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1
          const handlePress = () => {
            if (item.onPress) {
              item.onPress()
            } else if (item.route) {
              router.push(item.route as any)
            }
          }

          const iconFg = item.iconColor || '#334155'

          return (
            <TouchableOpacity
              key={item.title}
              style={s.optionRow}
              activeOpacity={0.6}
              onPress={handlePress}
            >
              <View style={s.optionRight}>
                <View style={s.optionIconWrap}>
                  <Ionicons name={item.icon as any} size={18} color={iconFg} />
                </View>
                <View style={s.optionTextWrap}>
                  <Text style={s.optionTitle} numberOfLines={1}>{item.title}</Text>
                  {item.subTitle ? (
                    <Text style={s.optionSubTitle} numberOfLines={1}>{item.subTitle}</Text>
                  ) : null}
                </View>
              </View>

              <View style={s.optionLeft}>
                {item.badge !== undefined && item.badge !== null && item.badge !== 0 ? (
                  <View style={s.badgePill}>
                    <Text style={s.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-back" size={15} color="#94A3B8" />
              </View>

              {!isLast && <View style={s.optionDivider} />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  /* Section Styles */
  sectionWrap: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12.5,
    lineHeight: 17,
    color: '#64748B',
    marginBottom: 7,
    paddingHorizontal: 4,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...softShadow,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  optionTitle: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13.5,
    lineHeight: 19,
    color: '#1E293B',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionSubTitle: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    lineHeight: 15,
    color: '#94A3B8',
    marginTop: 1,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 11,
    lineHeight: 15,
    color: '#334155',
  },
  optionDivider: {
    position: 'absolute',
    bottom: 0,
    end: 14,
    start: 60,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
})
