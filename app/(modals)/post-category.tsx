import { View, Text, TouchableOpacity, StyleSheet, FlatList, Platform, Dimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../src/constants/colors'
import { usePostStore } from '../../src/store/postStore'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2 // 2 columns with 16 padding on sides and 16 gap

const CATEGORIES = [
  { id: 'cars', title: 'سيارات ومركبات', icon: 'car-sport', color: Colors.primary, bg: '#F0F4FC' },
  { id: 'buses', title: 'حافلات', icon: 'bus', color: '#059669', bg: '#ECFDF5' },
  { id: 'equipment', title: 'معدات', icon: 'construct', color: '#D97706', bg: '#FFFBEB' },
  { id: 'transport', title: 'نقل', icon: 'cube', color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'jobs', title: 'وظائف', icon: 'briefcase', color: '#DB2777', bg: '#FDF2F8' },
  { id: 'services', title: 'خدمات', icon: 'color-wand', color: '#2563EB', bg: '#EFF6FF' },
  { id: 'parts', title: 'قطع غيار', icon: 'settings', color: '#475569', bg: '#F1F5F9' },
]

export default function PostCategoryModal() {
  const { set } = usePostStore()
  const insets = useSafeAreaInsets()

  const handleSelect = (categoryId: string) => {
    set({ category: categoryId })
    router.replace('/post/step2')
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 24) }]}>
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>ما الذي تود نشره؟</Text>
        <Text style={styles.subtitle}>اختر القسم المناسب لإعلانك للبدء</Text>
      </View>
      
      <FlatList
        data={CATEGORIES}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleSelect(item.id)}>
            <View style={[styles.iconWrap, { backgroundColor: item.bg }]}>
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.8}>
          <Text style={styles.closeBtnTxt}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    alignItems: 'center',
  },
  handleWrap: {
    width: '100%', alignItems: 'center',
    paddingTop: 12, paddingBottom: 12,
  },
  handle: {
    width: 48, height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  header: {
    width: '100%', paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  title: {
    fontFamily: 'Almarai_800ExtraBold',  fontSize: 24, color: '#111827',
    marginBottom: 6,
    textAlign: 'left', // in RTL, left is visually right
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Almarai_400Regular',  fontSize: 14, color: '#6B7280',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1, borderColor: '#F3F4F6',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Almarai_700Bold',  fontSize: 15, color: '#1F2937', textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 16, paddingHorizontal: 24,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  closeBtn: {
    height: 56, borderRadius: 100,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  closeBtnTxt: {
    fontFamily: 'Almarai_700Bold',  fontSize: 16, color: '#4B5563',
  },
})
