import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { JobApplication } from '../../types/jobs.types'
import { StatusPill } from '../jobs/StatusPill'
import { VerificationBadge } from '../jobs/VerificationBadge'
import RatingBadges from '../jobs/RatingBadges'
import { formatDate, getInitials, getAvatarColor } from '../../utils/format'
import { STRINGS } from '../../constants/jobs'
import { useUpdateApplicationStatus, useWithdrawApplication } from '../../hooks/useJobActions'

interface ProposalCardProps {
  application: JobApplication
  isJobOwner: boolean
  isOwnProposal: boolean
  isAuthenticated: boolean
}

export function ProposalCard({
  application,
  isJobOwner,
  isOwnProposal,
  isAuthenticated,
}: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false)

  const updateStatusMutation = useUpdateApplicationStatus()
  const withdrawMutation = useWithdrawApplication()

  const accepting = updateStatusMutation.isPending && updateStatusMutation.variables?.status === 'ACCEPTED'
  const rejecting = updateStatusMutation.isPending && updateStatusMutation.variables?.status === 'REJECTED'
  const withdrawing = withdrawMutation.isPending
  const loadingAny = accepting || rejecting || withdrawing

  const canSeeAll = isJobOwner || isOwnProposal
  const displayName = application.driverProfile?.user.displayName
    ?? application.applicant?.displayName
    ?? 'مستخدم'
  const userId = application.applicantId
  const avatarColor = getAvatarColor(userId)
  const initials = getInitials(displayName)

  const message = application.message ?? ''
  const isLongMessage = message.length > 120
  const previewMessage = isLongMessage && !expanded && !canSeeAll
    ? message.slice(0, 100) + '...'
    : message

  const handleAccept = () => {
    if (loadingAny) return
    updateStatusMutation.mutate({ applicationId: application.id, status: 'ACCEPTED' })
  }

  const handleReject = () => {
    if (loadingAny) return
    updateStatusMutation.mutate({ applicationId: application.id, status: 'REJECTED' })
  }

  const handleWithdraw = () => {
    if (loadingAny) return
    withdrawMutation.mutate(application.id)
  }

  return (
    <View style={s.card}>
      {/* Header: Avatar + Name + Verification + Time */}
      <View style={s.header}>
        <View style={s.profileInfo}>
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={s.nameBox}>
            <View style={s.nameRow}>
              <Text style={s.nameText} numberOfLines={1}>{displayName}</Text>
              {application.driverProfile?.isVerified && (
                <VerificationBadge showText />
              )}
            </View>
            {application.driverProfile && (
              <RatingBadges
                rating={application.driverProfile.averageRating}
                completionRate={application.driverProfile.completionRate}
                responseTime={application.driverProfile.responseTimeHours}
                size="sm"
              />
            )}
          </View>
        </View>
        <Text style={s.timeText}>{formatDate(application.createdAt)}</Text>
      </View>

      {/* Message / Content Body */}
      <View style={s.body}>
        {canSeeAll ? (
          <Text style={s.messageText}>{message}</Text>
        ) : isAuthenticated ? (
          <View>
            <Text style={s.messageText}>{previewMessage}</Text>
            {isLongMessage && (
              <TouchableOpacity
                onPress={() => setExpanded(!expanded)}
                style={s.expandBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={Colors.primary}
                />
                <Text style={s.expandText}>
                  {expanded ? 'عرض أقل' : 'اقرأ المزيد'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={s.lockedBox}>
            <Ionicons name="lock-closed-outline" size={14} color={Colors.text2} />
            <Text style={s.lockedText}>سجّل دخول لعرض التفاصيل الكاملة</Text>
          </View>
        )}
      </View>

      {/* Footer: Status Pill + Actions */}
      <View style={s.footer}>
        <StatusPill status={application.status} />

        <View style={s.actions}>
          {isJobOwner && application.status === 'PENDING' && (
            <>
              <TouchableOpacity
                onPress={handleAccept}
                disabled={loadingAny}
                style={[s.btn, s.btnAccept]}
                activeOpacity={0.8}
              >
                {accepting ? (
                  <ActivityIndicator size="small" color="#15803D" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={13} color="#15803D" />
                    <Text style={s.txtAccept}>{STRINGS.ACCEPT}</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReject}
                disabled={loadingAny}
                style={[s.btn, s.btnReject]}
                activeOpacity={0.8}
              >
                {rejecting ? (
                  <ActivityIndicator size="small" color={Colors.error} />
                ) : (
                  <>
                    <Ionicons name="close-circle-outline" size={13} color={Colors.error} />
                    <Text style={s.txtReject}>{STRINGS.REJECT}</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {isOwnProposal && application.status === 'PENDING' && (
            <TouchableOpacity
              onPress={handleWithdraw}
              disabled={loadingAny}
              style={[s.btn, s.btnWithdraw]}
              activeOpacity={0.8}
            >
              {withdrawing ? (
                <ActivityIndicator size="small" color={Colors.text2} />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={13} color={Colors.text2} />
                  <Text style={s.txtWithdraw}>{STRINGS.WITHDRAW}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.space3,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4,  },
  nameBox: {
    alignItems: 'flex-start',
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    marginBottom: 2,
  },
  nameText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4,  fontSize: 14,
    color: Colors.text, textAlign: 'left', writingDirection: 'rtl',
  },
  timeText: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4,  fontSize: 11,
    color: Colors.textMuted, textAlign: 'left', writingDirection: 'rtl',
  },
  body: {
    marginBottom: Spacing.space3,
  },
  messageText: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4,  fontSize: 13,
    color: Colors.text, textAlign: 'left', writingDirection: 'rtl',
    lineHeight: 18,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    marginTop: Spacing.space1,
    alignSelf: 'flex-end',
  },
  expandText: {
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4,  fontSize: 12,
    color: Colors.primary, textAlign: 'left', writingDirection: 'rtl',
  },
  lockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.space3,
    justifyContent: 'center',
  },
  lockedText: {
    fontFamily: 'Almarai_400Regular', paddingTop: 4, paddingBottom: 4,  fontSize: 12,
    color: Colors.text2, textAlign: 'left', writingDirection: 'rtl',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.space2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space1,
    paddingVertical: 6,
    paddingHorizontal: Spacing.space3,
    borderRadius: Radius.md,
    minWidth: 70,
    justifyContent: 'center',
  },
  btnAccept: {
    backgroundColor: '#F0FDF4', // bg-green-50
  },
  txtAccept: {
    color: '#15803D',
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4,  fontSize: 11,
  },
  btnReject: {
    backgroundColor: '#FEF2F2', // bg-red-50
  },
  txtReject: {
    color: Colors.error,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4,  fontSize: 11,
  },
  btnWithdraw: {
    backgroundColor: Colors.surface,
  },
  txtWithdraw: {
    color: Colors.text2,
    fontFamily: 'Almarai_700Bold', paddingTop: 4, paddingBottom: 4,  fontSize: 11,
  },
})
