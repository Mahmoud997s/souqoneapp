import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { UnifiedCard } from '../../src/components/cards/UnifiedCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../../src/api/search'
import { useDebounce } from '../../src/hooks/useDebounce'
import { useLocalSearchParams, router } from 'expo-router'
import { AppHeader } from '../../src/components/ui/AppHeader'

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams()
  const [query, setQuery] = useState((params.q as string) || '')
  const debouncedQuery = useDebounce(query, 400)
  
  const minPrice = params.minPrice as string
  const maxPrice = params.maxPrice as string
  const condition = params.condition as string

  const { data: rawData, isLoading, isError } = useQuery({
    queryKey: ['search', debouncedQuery, minPrice, maxPrice, condition],
    queryFn: async () => {
      const hasFilters = debouncedQuery || minPrice || maxPrice || (condition && condition !== 'ALL')
      if (!hasFilters) return []
      const req: any = { q: debouncedQuery, limit: 20 }
      if (minPrice) req.minPrice = Number(minPrice)
      if (maxPrice) req.maxPrice = Number(maxPrice)
      if (condition && condition !== 'ALL') req.condition = condition

      const res = await searchApi.search(req)
      return Array.isArray(res.data) ? res.data : res.data.items ?? res.data.data ?? []
    },
    enabled: !!(debouncedQuery || minPrice || maxPrice || (condition && condition !== 'ALL')),
  })

  const data = rawData ?? []

  const renderContent = () => {
    const hasFilters = debouncedQuery || minPrice || maxPrice || (condition && condition !== 'ALL')
    if (!hasFilters) return null
    if (isLoading) {
      return (
        <View style={s.list}>
          {[1,2,3,4].map(i => <View key={i} style={s.fullCard}><SkeletonCard /></View>)}
        </View>
      )
    }

    if (isError) {
      return <Text style={s.errorTxt}>حدث خطأ أثناء البحث</Text>
    }

    if (data && data.length === 0) {
      return <Text style={s.emptyTxt}>لا توجد نتائج مطابقة لبحثك</Text>
    }

    return (
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        contentContainerStyle={s.list}
        renderItem={({item}) => {
          let route = `/listings/${item.id}`
          if (item.entityType === 'jobs' || item.type === 'job') route = `/jobs/${item.id}`
          else if (item.entityType === 'services' || item.type === 'service') route = `/services/${item.id}`
          else if (item.entityType === 'parts' || item.type === 'part') route = `/parts/${item.id}`
          else if (item.entityType === 'buses' || item.type === 'bus') route = `/buses/${item.id}`
          else if (item.entityType === 'equipment') route = `/equipment/${item.id}`
          
          return (
            <View style={s.fullCard}>
               <UnifiedCard item={item} onPress={() => router.push(route as any)} />
            </View>
          )
        }}
      />
    )
  }

  return (
    <View style={s.root}>
      <AppHeader
        showBack
        centerSlot={
          <View style={s.compactSearch}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={s.compactInput}
              placeholder="ابحث عن سيارات، وظائف..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        }
        rightSlot={
          <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(modals)/filters' as any)}>
            <Ionicons name="options-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        }
      />

      {renderContent()}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  compactSearch: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.space2,
    backgroundColor: 'rgba(255,255,255,0.15)', height: 40, borderRadius: 20,
    paddingHorizontal: Spacing.space3, marginHorizontal: Spacing.space3
  },
  compactInput: {
    flex: 1, fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.white, textAlign: 'right'
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center'
  },
  list: { padding: Spacing.space4, gap: Spacing.space4, paddingBottom: 100 },
  fullCard: { width: '100%', alignItems: 'center' },
  errorTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.error, textAlign: 'center', marginTop: 40 },
  emptyTxt: { fontFamily: 'Almarai_700Bold',  color: Colors.text2, textAlign: 'center', marginTop: 40 }
})
