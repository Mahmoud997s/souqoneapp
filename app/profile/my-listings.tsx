import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { listingsApi } from '../../src/api/listings'
import { AppHeader } from '../../src/components/ui/AppHeader'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { Radius } from '../../src/constants/radius'
import { CarCard } from '../../src/components/cars/CarCard'
import { SkeletonCard } from '../../src/components/ui/SkeletonCard'
import { useMyListings } from '../../src/hooks/useListings'

const FILTERS = ['الكل', 'نشط', 'منتهي', 'مسودة']

export default function MyListingsScreen() {
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState('الكل')
  const { data, isLoading } = useMyListings()

  // Filter logic based on status
  const filteredData = data?.filter(item => {
    const originalItem = (item as any).raw || item
    const status = (originalItem.status || '').toUpperCase()
    if (activeTab === 'الكل') return true
    if (activeTab === 'نشط') return status === 'ACTIVE' || status === 'PUBLISHED'
    if (activeTab === 'منتهي') return status === 'EXPIRED' || status === 'SOLD' || status === 'CLOSED'
    if (activeTab === 'مسودة') return status === 'DRAFT' || status === 'PENDING'
    return true
  }) ?? []

  return (
    <View style={s.root}>
      <AppHeader title="إعلاناتي" showBack />

      <View style={{ paddingTop: Spacing.space3 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsRow}>
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[s.tab, activeTab === f && s.tabActive]}
              onPress={() => setActiveTab(f)}
              activeOpacity={0.7}
            >
              <Text style={[s.tabTxt, activeTab === f && s.tabTxtActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={s.list}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={i => i.id}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 80 }]} // extra padding for FAB
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={s.emptyIconCircle}>
                <Ionicons name="document-text-outline" size={40} color={Colors.primary} />
              </View>
              <Text style={s.emptyTitle}>لا توجد إعلانات</Text>
              <Text style={s.emptySub}>لم تقم بنشر أي إعلانات في هذا القسم حتى الآن.</Text>
              
              <TouchableOpacity 
                style={s.emptyBtn} 
                activeOpacity={0.8}
                onPress={() => router.push('/post' as any)}
              >
                <Ionicons name="add" size={18} color={Colors.white} />
                <Text style={s.emptyBtnTxt}>أضف إعلانك الأول</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ marginBottom: 16 }}>
              <CarCard 
                item={item as any} 
                onPress={() => router.push(`/listings/${item.id}` as any)} 
                fullWidth 
                showChips 
                actionMenu={
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Delete Button */}
                    <TouchableOpacity 
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.95)', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }}
                      activeOpacity={0.8}
                      onPress={() => {
                        Alert.alert(
                          'حذف الإعلان',
                          'هل أنت متأكد من رغبتك في حذف هذا الإعلان نهائياً؟',
                          [
                            { text: 'إلغاء', style: 'cancel' },
                            { text: 'حذف', style: 'destructive', onPress: async () => {
                              try {
                                await listingsApi.remove(item.id)
                                Alert.alert('تم', 'تم حذف الإعلان بنجاح')
                              } catch (e) {
                                Alert.alert('خطأ', 'حدث خطأ أثناء الحذف')
                              }
                            }}
                          ]
                        )
                      }}
                    >
                      <Ionicons name="trash" size={18} color="#ef4444" />
                    </TouchableOpacity>

                    {/* Edit Button */}
                    <TouchableOpacity 
                      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.95)', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 }} 
                      activeOpacity={0.8}
                      onPress={() => router.push(`/post/edit/${item.id}` as any)}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                }
              />
            </View>
          )}
        />
      )}

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity 
        style={[s.fab, { bottom: insets.bottom + 20 }]} 
        activeOpacity={0.8}
        onPress={() => router.push('/post' as any)}
      >
        <Ionicons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>
    </View>
  )
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f7f9fc' },
  tabsRow: { paddingHorizontal: Spacing.space4, paddingBottom: Spacing.space3, gap: Spacing.space2 },
  tab: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.pill, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 13, color: Colors.text2 },
  tabTxtActive: { color: Colors.white },
  list: { paddingHorizontal: Spacing.space4, gap: Spacing.space4 },
  
  // Empty State
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(56, 189, 248, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: Colors.text2, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.pill, gap: 8 },
  emptyBtnTxt: { fontFamily: 'Almarai_700Bold',  fontSize: 14, color: Colors.white },

  // FAB
  fab: {
    position: 'absolute',
    left: 20, // Bottom-left in RTL
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  }
})
