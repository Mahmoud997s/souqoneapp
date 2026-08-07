import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { Spacing } from '../../src/constants/spacing'
import { router } from 'expo-router'
import { usePostStore } from '../../src/store/postStore'

const CATEGORIES = [
  { id: 'cars', title: 'سيارات ومركبات', icon: 'car-outline' },
  { id: 'buses', title: 'حافلات', icon: 'bus-outline' },
  { id: 'equipment', title: 'معدات', icon: 'build-outline' },
  { id: 'transport', title: 'نقل', icon: 'cube-outline' },
  { id: 'jobs', title: 'وظائف', icon: 'briefcase-outline' },
  { id: 'services', title: 'خدمات', icon: 'build-outline' },
  { id: 'parts', title: 'قطع غيار', icon: 'settings-outline' },
]

export default function PostScreen() {
  const insets = useSafeAreaInsets()
  const { set, reset } = usePostStore()

  const handleSelect = (id: string) => {
    reset()
    set({ category: id })
    if (id === 'equipment') {
      router.push('/equipment/new')
    } else if (id === 'transport') {
      router.push('/transport/new')
    } else {
      router.push('/post/step2')
    }
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.space2 }]}>
        <Text style={s.headerTitle}>اختر نوع الإعلان</Text>
      </View>

      <ScrollView contentContainerStyle={[s.listContent, { paddingBottom: 100 }]} showsVerticalScrollIndicator={false}>
        {CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={s.card}
            activeOpacity={0.8}
            onPress={() => handleSelect(item.id)}
          >
            <View style={s.iconCircle}>
              <Ionicons name={item.icon as any} size={24} color={Colors.primary} />
            </View>
            <Text style={s.itemTitle}>{item.title}</Text>
            <Ionicons name="chevron-back" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={[s.bottomBar, { paddingBottom: insets.bottom || Spacing.space4 }]}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={s.closeBtnTxt}>إغلاق</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: Spacing.space4,
    paddingBottom: Spacing.space4,
    backgroundColor: '#F8F9FA',
  },
  headerTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 22,
    color: Colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: Spacing.space4,
  },
  listContent: {
    paddingHorizontal: Spacing.space4,
    paddingTop: Spacing.space2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.space3,
    borderRadius: 20,
    marginBottom: Spacing.space3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
    gap: Spacing.space3,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  itemTitle: {
    flex: 1,
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F0F4FC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingTop: Spacing.space4,
    paddingHorizontal: Spacing.space4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.02)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.04, shadowRadius: 12 },
      android: { elevation: 12 },
    }),
  },
  closeBtn: {
    height: 56,
    borderRadius: 100,
    backgroundColor: '#F1F3F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 16,
    color: Colors.text2,
    writingDirection: 'rtl',
  },
})
