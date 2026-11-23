import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter, router as expoRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { EmptyState } from '../../src/components/ui/EmptyState'
import { RatingStars } from '../../src/components/ui/RatingStars'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { lineHeightFor } from '../../src/constants/typography'
import { reviewsApi } from '../../src/api/reviews'
import { sellerReviewSummaryKey } from '../../src/hooks/listing-detail/useSellerReviewSummary'
import { useAuthStore } from '../../src/store/authStore'
import { toastService } from '../../src/store/toastStore'
import { loginRoute } from '../../src/navigation/listingRoutes'
import { parseListEnvelope } from '../../src/utils/parseListEnvelope'
import { getListErrorProps } from '../../src/utils/getListErrorProps'
import { StaleDataBanner } from '../../src/components/listing-detail/StaleDataBanner'
import { getPublishRateLimitErrorMessage } from '../../src/utils/publishRateLimitError'
import { getMutationErrorMessage } from '../../src/utils/listing-detail/getDetailErrorKind'

export { RatingStars as StarRow }

export interface ReviewItem {
  id: string
  rating?: number
  comment?: string
  createdAt?: string
  reviewer?: {
    id?: string
    displayName?: string
    username?: string
  }
  user?: {
    id?: string
    displayName?: string
    username?: string
  }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'اليوم'
  if (days === 1) return 'أمس'
  if (days < 7) return `منذ ${days} أيام`
  if (days < 30) return `منذ ${Math.floor(days / 7)} أسابيع`
  return `منذ ${Math.floor(days / 30)} أشهر`
}

function extractReviewErrorMessage(err: unknown): string {
  const response = (err as { response?: { status?: number; data?: { message?: unknown } } })?.response
  if (response?.status === 429) {
    return getPublishRateLimitErrorMessage(err)
  }
  const rawMessage = response?.data?.message
  if (typeof rawMessage === 'string' && rawMessage.trim().length > 0) {
    return rawMessage.trim()
  }
  if (Array.isArray(rawMessage)) {
    const first = rawMessage.find((m) => typeof m === 'string' && m.trim().length > 0)
    if (typeof first === 'string') return first.trim()
  }
  return getMutationErrorMessage(err, 'تعذر إضافة التقييم')
}

export default function ReviewsScreen() {
  const { entityId, type, revieweeId, write } = useLocalSearchParams<{
    entityId: string
    type?: string
    revieweeId?: string
    write?: string
  }>()
  const resolvedType = type && type.trim().length > 0 ? type.trim() : 'USER'
  const router = typeof useRouter === 'function' ? useRouter() : expoRouter
  const { user } = useAuthStore()
  const [isWriting, setIsWriting] = React.useState(write === 'true' && Boolean(user))
  const [rating, setRating] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const queryClient = useQueryClient()

  React.useEffect(() => {
    if (write === 'true' && !user && entityId) {
      router.push(loginRoute(`/reviews/${entityId}?type=${resolvedType}&write=true`))
    }
  }, [write, user, entityId, resolvedType, router])

  const {
    data: reviews,
    isLoading,
    isError,
    error,
    isRefetchError,
    isRefetching,
    refetch,
  } = useQuery<ReviewItem[]>({
    queryKey: ['reviews', entityId, resolvedType],
    queryFn: async () => {
      const res = await reviewsApi.getByEntity(entityId, resolvedType)
      const { items } = parseListEnvelope<ReviewItem>(res.data)
      return items
    },
    enabled: !!entityId,
  })

  const avgRating = reviews?.length
    ? reviews.reduce((sum: number, r: ReviewItem) => sum + (r.rating ?? 0), 0) / reviews.length
    : 0

  const isServerDerivedReviewee = resolvedType === 'OPERATOR_LISTING' || resolvedType === 'USER'

  const { mutate: submitReview, isPending: submitting } = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        entityId,
        entityType: resolvedType,
        rating,
        comment: comment.trim() ? comment.trim() : undefined,
        ...(!isServerDerivedReviewee ? { revieweeId: revieweeId || entityId } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', entityId] })
      queryClient.invalidateQueries({ queryKey: ['reviews', entityId, resolvedType] })
      queryClient.invalidateQueries({ queryKey: sellerReviewSummaryKey(entityId) })
      queryClient.invalidateQueries({ queryKey: ['user', entityId] })
      queryClient.invalidateQueries({ queryKey: ['operator-detail', entityId] })
      queryClient.invalidateQueries({ queryKey: ['operator-item', entityId] })
      queryClient.invalidateQueries({ queryKey: ['equipment-item', entityId] })
      queryClient.invalidateQueries({ queryKey: ['service-item', entityId] })
      queryClient.invalidateQueries({ queryKey: ['bus-item', entityId] })
      queryClient.invalidateQueries({ queryKey: ['car-item', entityId] })
      setIsWriting(false)
      setRating(0)
      setComment('')
      setSubmitError(null)
      toastService.show({ kind: 'success', title: 'تم إرسال تقييمك' })
    },
    onError: (err: unknown) => {
      const msg = extractReviewErrorMessage(err)
      setSubmitError(msg)
      toastService.show({ kind: 'error', title: msg })
    },
  })

  const handleOpenWriteForm = () => {
    if (!user) {
      router.push(loginRoute(`/reviews/${entityId}?type=${resolvedType}&write=true`))
      return
    }
    setSubmitError(null)
    setIsWriting(true)
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title="التقييمات والمراجعات" showBack />

      {(isError || isRefetchError) && (reviews?.length ?? 0) > 0 && (
        <StaleDataBanner onRetry={() => refetch()} isRefetching={isRefetching} />
      )}

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={s.loader} />
      ) : (
        <FlatList
          data={reviews ?? []}
          keyExtractor={(item: ReviewItem) => item.id}
          contentContainerStyle={s.content}
          ListHeaderComponent={
            reviews && reviews.length > 0 ? (
              <View style={s.summaryCard}>
                <View style={s.sumRight}>
                  <View style={s.scoreRow}>
                    <Text style={s.score}>{avgRating.toFixed(1)}</Text>
                    <Text style={s.outOf}>/ 5</Text>
                  </View>
                  <RatingStars rating={avgRating} size={16} />
                </View>
                <View style={s.sumLeft}>
                  <Text style={s.count}>{reviews.length}</Text>
                  <Text style={s.countLbl}>تقييم معتمد</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            isError ? (
              <EmptyState
                testID="reviews-error-state"
                {...getListErrorProps(error, 'تعذر تحميل التقييمات')}
                actionLabel="إعادة المحاولة"
                onAction={() => refetch()}
              />
            ) : (
              <View style={s.emptyState} testID="reviews-empty-state">
                <Ionicons name="star-outline" size={56} color={Colors.border} />
                <Text style={s.emptyTitle}>لا توجد تقييمات بعد</Text>
                <Text style={s.emptySub}>كن أول من يضيف تقييماً</Text>
              </View>
            )
          }
          renderItem={({ item }: { item: ReviewItem }) => {
            const reviewer = item.reviewer ?? item.user
            const name = reviewer?.displayName ?? reviewer?.username ?? 'مستخدم'
            return (
              <View style={s.reviewCard}>
                <View style={s.revHeader}>
                  <View style={s.userInfo}>
                    <View style={s.avatar}>
                      <Text style={s.avatarInit}>{name.charAt(0)}</Text>
                    </View>
                    <View>
                      <Text style={s.revName}>{name}</Text>
                      <Text style={s.revTime}>{item.createdAt ? formatTime(item.createdAt) : ''}</Text>
                    </View>
                  </View>
                  <RatingStars rating={item.rating ?? 0} size={14} />
                </View>
                {item.comment ? <Text style={s.comment}>{item.comment}</Text> : null}
              </View>
            )
          }}
        />
      )}

      {isWriting ? (
        <View style={s.writeBox}>
          <View style={s.writeHeader}>
            <Text style={s.writeTitle}>تقييمك</Text>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => {
                setIsWriting(false)
                setSubmitError(null)
              }}
              accessibilityRole="button"
              accessibilityLabel="إغلاق نافذة التقييم"
            >
              <Ionicons name="close" size={24} color={Colors.text2} />
            </TouchableOpacity>
          </View>
          <RatingStars
            rating={rating}
            size={32}
            onChange={(next) => {
              setRating(next)
              if (submitError) setSubmitError(null)
            }}
            starButtonTestIDPrefix="review-star-btn"
            style={s.starsInput}
          />
          <TextInput
            testID="review-comment-input"
            style={s.commentInput}
            placeholder="اكتب تعليقك هنا..."
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={(txt) => {
              setComment(txt)
              if (submitError) setSubmitError(null)
            }}
            multiline
            textAlign="right"
          />
          {submitError ? (
            <Text style={s.submitErrorText} testID="review-submit-error" accessibilityRole="alert">
              {submitError}
            </Text>
          ) : null}
          <TouchableOpacity
            testID="submit-review-btn"
            style={[s.writeBtn, (!rating || submitting) && s.writeBtnDisabled]}
            disabled={!rating || submitting}
            onPress={() => {
              setSubmitError(null)
              submitReview()
            }}
            accessibilityRole="button"
            accessibilityLabel="إرسال التقييم"
          >
            {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={s.writeTxt}>إرسال التقييم</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.footer}>
          <TouchableOpacity
            testID="open-write-review-btn"
            style={s.writeBtn}
            onPress={handleOpenWriteForm}
            accessibilityRole="button"
            accessibilityLabel="إضافة تقييم"
          >
            <Ionicons name="create-outline" size={20} color={Colors.white} />
            <Text style={s.writeTxt}>أضف تقييم</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateTintBg },
  loader: { marginTop: 60 },
  content: { padding: Spacing.space4, paddingBottom: 100, gap: Spacing.space4 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,
    marginBottom: Spacing.space2,
  },
  sumRight: { flex: 1, borderLeftWidth: 1, borderLeftColor: Colors.border, alignItems: 'flex-start' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  score: { fontFamily: 'Almarai_800ExtraBold', fontSize: 32, lineHeight: lineHeightFor(32), color: Colors.primary },
  outOf: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: lineHeightFor(14), color: Colors.text2 },
  sumLeft: { paddingLeft: Spacing.space4, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: 'Almarai_700Bold', fontSize: 24, lineHeight: lineHeightFor(24), color: Colors.text },
  countLbl: { fontFamily: 'Almarai_400Regular', fontSize: 12, lineHeight: lineHeightFor(12), color: Colors.text2 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.space3 },
  emptyTitle: { fontFamily: 'Almarai_700Bold', fontSize: 18, lineHeight: lineHeightFor(18), color: Colors.text },
  emptySub: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: lineHeightFor(14), color: Colors.text2, textAlign: 'center' },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.space4,
  },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.space3 },
  userInfo: { flexDirection: 'row', gap: Spacing.space3 },
  avatar: { width: 40, height: 40, borderRadius: Radius.pill, backgroundColor: Colors.slateTintBg, alignItems: 'center', justifyContent: 'center' },
  avatarInit: { fontFamily: 'Almarai_700Bold', fontSize: 16, lineHeight: lineHeightFor(16), color: Colors.text },
  revName: { fontFamily: 'Almarai_700Bold', fontSize: 14, lineHeight: lineHeightFor(14), color: Colors.text, textAlign: 'left', writingDirection: 'rtl' },
  revTime: { fontFamily: 'Almarai_400Regular', fontSize: 12, lineHeight: lineHeightFor(12), color: Colors.text2, textAlign: 'left', writingDirection: 'rtl' },
  comment: { fontFamily: 'Almarai_400Regular', fontSize: 14, lineHeight: lineHeightFor(14), color: Colors.text, textAlign: 'left', writingDirection: 'rtl' },
  footer: { backgroundColor: Colors.white, padding: Spacing.space4, borderTopWidth: 1, borderTopColor: Colors.border },
  writeBox: { backgroundColor: Colors.white, padding: Spacing.space4, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.space3 },
  writeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  writeTitle: { fontFamily: 'Almarai_700Bold', fontSize: 16, lineHeight: lineHeightFor(16), color: Colors.text, textAlign: 'left', writingDirection: 'rtl' },
  closeBtn: { minWidth: Spacing.touch, minHeight: Spacing.touch, alignItems: 'center', justifyContent: 'center' },
  starsInput: { paddingVertical: Spacing.space1 },
  commentInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.space3,
    fontFamily: 'Almarai_400Regular',
    fontSize: 14,
    lineHeight: lineHeightFor(14),
    textAlign: 'right',
    writingDirection: 'rtl',
    textAlignVertical: 'top',
  },
  submitErrorText: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 13,
    lineHeight: lineHeightFor(13),
    color: Colors.error,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  writeBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: Radius.lg,
    gap: Spacing.space2,
  },
  writeBtnDisabled: { opacity: 0.5 },
  writeTxt: { fontFamily: 'Almarai_700Bold', fontSize: 16, lineHeight: lineHeightFor(16), color: Colors.white },
})
