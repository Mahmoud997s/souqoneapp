import React from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { reviewsApi } from '../../src/api/reviews'
import { dialogService } from '../../src/store/dialogStore'

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name="star"
          size={size}
          color={i <= rating ? Colors.warning : Colors.border}
        />
      ))}
    </View>
  )
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

export default function ReviewsScreen() {
  const { entityId, type = 'USER' } = useLocalSearchParams<{ entityId: string; type?: string }>()
  const [isWriting, setIsWriting] = React.useState(false)
  const [rating, setRating] = React.useState(0)
  const [comment, setComment] = React.useState('')
  const queryClient = useQueryClient()

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', entityId],
    queryFn: async () => {
      const res = await reviewsApi.getByEntity(entityId)
      const raw = res.data as any
      return Array.isArray(raw) ? raw : (raw?.items ?? raw?.data ?? [])
    },
    enabled: !!entityId,
  })

  const avgRating = reviews?.length
    ? reviews.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) / reviews.length
    : 0

  const { mutate: submitReview, isPending: submitting } = useMutation({
    mutationFn: () => reviewsApi.create({ entityId, entityType: type, rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', entityId] })
      setIsWriting(false)
      setRating(0)
      setComment('')
    },
    onError: () => dialogService.alert('خطأ', 'تعذر إضافة التقييم'),
  })

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader title="التقييمات والمراجعات" showBack />

      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={s.loader} />
      ) : (
        <FlatList
          data={reviews ?? []}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={s.content}
          ListHeaderComponent={
            reviews && reviews.length > 0 ? (
              <View style={s.summaryCard}>
                <View style={s.sumRight}>
                  <View style={s.scoreRow}>
                    <Text style={s.score}>{avgRating.toFixed(1)}</Text>
                    <Text style={s.outOf}>/ 5</Text>
                  </View>
                  <StarRow rating={Math.round(avgRating)} size={16} />
                </View>
                <View style={s.sumLeft}>
                  <Text style={s.count}>{reviews.length}</Text>
                  <Text style={s.countLbl}>تقييم معتمد</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="star-outline" size={56} color={Colors.border} />
              <Text style={s.emptyTitle}>لا توجد تقييمات</Text>
              <Text style={s.emptySub}>كن أول من يضيف تقييماً</Text>
            </View>
          }
          renderItem={({ item }: { item: any }) => {
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
                  <StarRow rating={item.rating ?? 0} />
                </View>
                {item.comment && <Text style={s.comment}>{item.comment}</Text>}
              </View>
            )
          }}
        />
      )}

      {isWriting ? (
        <View style={s.writeBox}>
          <View style={s.writeHeader}>
            <Text style={s.writeTitle}>تقييمك</Text>
            <TouchableOpacity onPress={() => setIsWriting(false)}>
              <Ionicons name="close" size={24} color={Colors.text2} />
            </TouchableOpacity>
          </View>
          <View style={s.starsInput}>
            {[1, 2, 3, 4, 5].map(i => (
              <TouchableOpacity key={i} onPress={() => setRating(i)}>
                <Ionicons name="star" size={32} color={i <= rating ? Colors.warning : Colors.border} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={s.commentInput}
            placeholder="اكتب تعليقك هنا..."
            placeholderTextColor={Colors.textMuted}
            value={comment}
            onChangeText={setComment}
            multiline
            textAlign="right"
          />
          <TouchableOpacity 
            style={[s.writeBtn, (!rating || submitting) && s.writeBtnDisabled]} 
            disabled={!rating || submitting} 
            onPress={() => submitReview()}
          >
            {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={s.writeTxt}>إرسال التقييم</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.footer}>
          <TouchableOpacity style={s.writeBtn} onPress={() => setIsWriting(true)}>
            <Ionicons name="create-outline" size={20} color={Colors.white} />
            <Text style={s.writeTxt}>أضف تقييم</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  loader: { marginTop: 60 },
  content: { padding: Spacing.space4, paddingBottom: 100, gap: Spacing.space4 },
  summaryCard: {
    flexDirection: 'row', backgroundColor: Colors.white, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.space4, marginBottom: Spacing.space2,
  },
  sumRight: { flex: 1, borderLeftWidth: 1, borderLeftColor: Colors.border, alignItems: 'flex-start' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  score: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 32, color: Colors.primary },
  outOf: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2 },
  sumLeft: { paddingLeft: Spacing.space4, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: 'Almarai_700Bold',  fontSize: 24, color: Colors.text },
  countLbl: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.text2 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.space3 },
  emptyTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text },
  emptySub: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, textAlign: 'center' },
  reviewCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.space4,
  },
  revHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.space3 },
  userInfo: { flexDirection: 'row', gap: Spacing.space3 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f7f9fc', alignItems: 'center', justifyContent: 'center' },
  avatarInit: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text },
  revName: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.text, writingDirection: 'rtl' },
  revTime: { fontFamily: 'Almarai_400Regular',  fontSize: 12, color: Colors.text2, writingDirection: 'rtl' },
  comment: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text, writingDirection: 'rtl', lineHeight: 22 },
  footer: { backgroundColor: Colors.white, padding: Spacing.space4, borderTopWidth: 1, borderTopColor: Colors.border },
  writeBox: { backgroundColor: Colors.white, padding: Spacing.space4, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.space3 },
  writeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  writeTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.text },
  starsInput: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: Spacing.space2 },
  commentInput: { height: 80, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.space3, fontFamily: 'Almarai_400Regular',  textAlignVertical: 'top' },
  writeBtn: { backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: Radius.lg, gap: 8 },
  writeBtnDisabled: { opacity: 0.5 },
  writeTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 16, color: Colors.white },
})
