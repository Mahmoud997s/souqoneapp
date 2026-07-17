import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { UnifiedCard } from '../../src/components/cards/UnifiedCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { Ionicons } from '@expo/vector-icons'
import { useServices } from '../../src/hooks/useServices'
import { router } from 'expo-router'

const FILTERS = ['نوع الخدمة', 'الموقع', 'السعر', 'التوافر']

export default function ServicesScreen() {
  const { data, isLoading, isError, refetch } = useServices()

  return (
    <View style={s.root}>
      <AppHeader title="الخدمات" showBack />

      {isLoading ? (
        <View style={s.grid}>
          {[1, 2, 3, 4].map(i => <View key={i} style={s.fullCard}><SkeletonCard /></View>)}
        </View>
      ) : isError ? (
        <View style={s.center}>
          <Text style={s.errorTxt}>حدث خطأ أثناء تحميل البيانات</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={i => i.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
          ListHeaderComponent={
            <View style={s.headerWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersScroll}>
                {FILTERS.map((f, i) => (
                  <TouchableOpacity key={i} style={s.filterChip} activeOpacity={0.7}>
                    <Text style={s.filterTxt}>{f}</Text>
                    <Ionicons name="chevron-down" size={16} color={Colors.text2} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={s.resultsCount}>{(data ?? []).length} نتيجة</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <Ionicons name="build-outline" size={56} color={Colors.border} />
              <Text style={s.emptyTitle}>لا توجد خدمات</Text>
              <Text style={s.emptySubtitle}>تحقق لاحقاً للعثور على خدمات جديدة</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.fullCard}>
              <UnifiedCard item={item} onPress={() => router.push(`/services/${item.id}` as any)} />
            </View>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.error, marginBottom: 12 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.lg },
  retryTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.white },
  grid: { padding: Spacing.space4, gap: Spacing.space4 },
  list: { paddingBottom: Spacing.space6 },
  fullCard: { paddingHorizontal: Spacing.space5, paddingBottom: Spacing.space3 },
  headerWrap: { paddingBottom: Spacing.space3 },
  filtersScroll: { paddingHorizontal: Spacing.space5, paddingVertical: Spacing.space3, gap: Spacing.space2, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.space1,
    height: 34, borderRadius: Radius.sm, paddingHorizontal: Spacing.space3,
    backgroundColor: '#eceef1', borderWidth: 1, borderColor: '#c3c6d6',
  },
  filterTxt: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, writingDirection: 'rtl' },
  resultsCount: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text, writingDirection: 'rtl', paddingHorizontal: Spacing.space5 },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.space3 },
  emptyTitle: { fontFamily: 'Almarai_700Bold',  fontSize: 18, color: Colors.text, textAlign: 'center' },
  emptySubtitle: { fontFamily: 'Almarai_400Regular',  fontSize: 14, color: Colors.text2, textAlign: 'center' },
})
