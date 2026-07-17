import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { UnifiedCard } from '../../src/components/cards/UnifiedCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { useListings } from '../../src/hooks/useListings'
import { router } from 'expo-router'

export default function ListingsScreen() {
  const insets = useSafeAreaInsets()
  const { data, isLoading, isError, refetch } = useListings()

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={s.grid}>
          {[1,2,3,4].map(i => <View key={i} style={s.fullCard}><SkeletonCard /></View>)}
        </View>
      )
    }

    if (isError) {
      return (
        <View style={s.center}>
          <Text style={s.errorTxt}>حدث خطأ أثناء تحميل البيانات</Text>
          <TouchableOpacity onPress={() => refetch()} style={s.retryBtn}>
            <Text style={s.retryTxt}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!data || data.length === 0) {
      return (
        <View style={s.center}>
          <Text style={s.emptyTxt}>لا توجد إعلانات حالياً</Text>
        </View>
      )
    }

    return (
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={[s.list, { paddingBottom: insets.bottom || 20 }]}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[Colors.primary]} />}
        renderItem={({item}) => (
          <View style={s.fullCard}>
            <UnifiedCard item={item} onPress={() => router.push(`/listings/${item.id}`)} />
          </View>
        )}
      />
    )
  }

  return (
    <View style={s.root}>
      <AppHeader title="جميع الإعلانات" showBack />
      {renderContent()}
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.error, marginBottom: 12 },
  emptyTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.text2 },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.lg },
  retryTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.white },
  grid: { padding: Spacing.space4, gap: Spacing.space4 },
  list: { padding: Spacing.space4, gap: Spacing.space4 },
  fullCard: { width: '100%' }
})
