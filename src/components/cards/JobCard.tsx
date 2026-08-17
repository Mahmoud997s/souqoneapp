import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { Colors } from '../../constants/colors'
import { CardSystem } from '../../constants/cardSystem'
import { JobCardProps } from './job/jobCard.types'
import { parseJobCardData } from './job/jobCardMapper'
import { JobCardHeader } from './job/JobCardHeader'
import { JobCardChips } from './job/JobCardChips'
import { JobCardFooter } from './job/JobCardFooter'

const CARD_WIDTH = Dimensions.get('window').width * 0.6

export function JobCard({
  job,
  onPress,
  fullWidth = false,
  maxChips = 3,
  actionMenu,
  compact = false,
}: JobCardProps) {
  if (!job) return null

  const data = parseJobCardData(job)

  return (
    <TouchableOpacity
      style={[
        s.card,
        fullWidth ? s.cardFull : s.cardFixed,
      ]}
      activeOpacity={0.85}
      onPress={onPress}
    >
      {/* 1. Unified Header (Avatar + Poster + Location + Verification + Rating/ActionMenu) */}
      <JobCardHeader data={data} actionMenu={actionMenu} />

      {/* 2. Job Title & Date Row */}
      <View style={s.titleSection}>
        <Text style={s.jobTitle} numberOfLines={1}>
          {data.title}
        </Text>
        <Text style={s.timeText}>
          {data.formattedDate}
        </Text>
      </View>

      {/* 3. Description Container (Max 2 lines in a dedicated container) */}
      <View style={s.descBox}>
        <Text style={s.descText} numberOfLines={2} ellipsizeMode="tail">
          {data.description || 'لا يوجد وصف تفصيلي للوظيفة'}
        </Text>
      </View>

      {/* 4. Single-Row Chips (Employment Type + Experience + Licenses) */}
      <JobCardChips chips={data.chips} maxChips={maxChips} />

      {/* 5. Footer (Formatted Salary + Applications Count) */}
      <JobCardFooter
        formattedSalary={data.formattedSalary}
        applicationsCount={data.applicationsCount}
      />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    padding: CardSystem.padding.dense,
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
    alignSelf: 'flex-start',
  },
  cardFull: {
    width: '100%',
  },
  cardFixed: {
    width: CARD_WIDTH,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  jobTitle: {
    ...CardSystem.typography.title,
    fontSize: 13.5,
    color: '#0f172a',
    lineHeight: 18,
    flex: 1,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  timeText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 14,
    writingDirection: 'rtl',
  },
  descBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  descText: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 11,
    color: '#475569',
    lineHeight: 16.5,
    minHeight: 33,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
})
