# تقرير توحيد تصميم الحافلات مع السيارات (السيارات = المرجع القياسي)
تاريخ التقرير: 2026-09-19

---

## 1. ملخص سريع
تم توحيد تجربة المستخدم وواجهات قسم الحافلات بالكامل (البطاقة `BusCard`، صفحة الهبوط `app/buses/index.tsx`، وصفحة التصفح `app/buses/browse.tsx`) لتتطابق بنيوياً وبصرياً مع قسم السيارات باعتباره المرجع القياسي للتطبيق. تم تنفيذ ذلك عبر استخراج مكوّنات أساسية قابلة لإعادة الاستخدام (`ListingCardBase`, `BrowseEmptyState`, `BrowseResultsBar`) لمنع أي تكرار برمجي وحذف الكود الميت بالكامل مع ربط الفلاتر ببيانات الـ Backend الحقيقية.

---

## 2. قائمة الملفات المتأثرة

| اسم الملف | نوع التغيير |
| :--- | :--- |
| `src/components/ui/ListingCardBase.tsx` | إنشاء (مكوّن أساسي مشترك للبطاقات) |
| `src/utils/listingLocation.ts` | إنشاء (مساعد استخراج موقع الإعلان الموحد) |
| `src/components/buses/BusCard.tsx` | تعديل (توحيد التصميم والاعتماد على المكوّن الأساسي) |
| `src/components/cars/CarCard.tsx` | تعديل (تحويله للاعتماد على المكوّن الأساسي الموحد) |
| `app/buses/index.tsx` | تعديل (توحيد الهيدر والمسافات وحذف الكود الميت والبانر) |
| `src/components/buses/BusesVisualFilters.tsx` | إنشاء (كاروسيل الفلاتر المرئية للحافلات) |
| `src/hooks/useBuses.ts` | تعديل (إضافة خطافات جلب الماركات والموديلات من الـ API) |
| `src/components/filters/QuickFilterModal.tsx` | تعديل (دعم حقول الحافلات وسعة الركاب بدون تكرار) |
| `src/components/ui/BrowseEmptyState.tsx` | إنشاء (حالة القائمة الفارغة الموحدة) |
| `src/components/cars/BrowseEmptyState.tsx` | تعديل (الاعتماد على المكوّن الموحد) |
| `src/components/ui/BrowseResultsBar.tsx` | إنشاء (شريط عدد النتائج ومسح الفلاتر الموحد) |
| `app/buses/browse.tsx` | تعديل (توحيد الفلاتر والبحث والفوتر وإزالة المودال المكرر) |

---

## 3. تفاصيل التغييرات (كود قبل وبعد الفعلي)

### `src/components/ui/ListingCardBase.tsx`

**قبل:**
ملف جديد

**بعد:**
```tsx
import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Colors } from '../../constants/colors'
import { CardSystem } from '../../constants/cardSystem'
import { useFavoritesStore } from '../../stores/favorites.store'
import { isSoldListing } from '../../types/listingStatus'
import { resolveListingLocation } from '../../utils/listingLocation'

export interface ListingCardBadge {
  id: string
  label: string
  bg: string
  textColor?: string
}

export interface ListingCardPill {
  key: string
  icon?: string
  iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'
  label: string
  color?: string
  styleVariant?: 'neutral' | 'blue' | 'amber' | 'green'
}

export interface ListingCardBaseProps {
  item: any
  title: string
  priceLabel: string
  isPriceNegotiable?: boolean
  onPress: () => void
  displayImages: string[]
  placeholderIcon?: keyof typeof Ionicons.glyphMap
  pills: ListingCardPill[]
  badges?: ListingCardBadge[]
  maxChips?: number
  isSellerVerified?: boolean
  status?: string
  fullWidth?: boolean
  gridMode?: boolean
  actionMenu?: React.ReactNode
  disableImageSwipe?: boolean
  shareMessage?: string
}

export function ListingCardBase({
  item,
  title,
  priceLabel,
  isPriceNegotiable = false,
  onPress,
  displayImages,
  placeholderIcon = 'car-sport',
  pills,
  badges = [],
  maxChips = 3,
  isSellerVerified = false,
  status,
  fullWidth = false,
  gridMode = false,
  actionMenu,
  disableImageSwipe = false,
  shareMessage,
}: ListingCardBaseProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const isHandlingSwipe = useRef(false)
  const { isFavorite, toggleFavorite } = useFavoritesStore()
  const favorited = isFavorite(item.id)

  const isSold = isSoldListing(status)
  const { locationText, timeAgoText } = resolveListingLocation(item)

  // Swiper & gestures logic...
  // Sold Overlay with BlurView & tilted ribbon...
  // Badges, pills, actions rendering...
}
```

**السبب:** استخراج مكوّن أساسي موحّد لكروت السيارات والحافلات يضمن تطابق السلوك البصري، السوايبر، البادجات، وأوفرلاي "مباع" دون تكرار سطر برمجي واحد.

---

### `src/utils/listingLocation.ts`

**قبل:**
ملف جديد

**بعد:**
```typescript
export function resolveListingLocation(item: any): {
  locationText: string
  timeAgoText: string
} {
  const rawData = item?.rawData || item || {}
  const govName =
    rawData.governorate?.nameAr ||
    rawData.governorateName ||
    item.location?.governorate ||
    item.governorate ||
    ''
  const cityName =
    rawData.city?.nameAr ||
    rawData.cityName ||
    item.location?.city ||
    item.city ||
    ''

  const locationText = [govName, cityName].filter(Boolean).join(' - ') || 'عُمان'
  const timeAgoText = item.timeAgo || ''

  return { locationText, timeAgoText }
}
```

**السبب:** استخراج وتسوية منطق معالجة واستخراج المحافظة والمدينة وتاريخ النشر في دالة موحدة لجميع البطاقات.

---

### `src/components/buses/BusCard.tsx`

**قبل:**
```tsx
// شارة الإيجار كانت بألوان قديمة غير موحدة
if (isRent) {
  badges.push({
    id: 'rent',
    label: 'للإيجار',
    bg: '#fffbeb',
    textColor: '#d97706',
  })
}

// maxChips كانت 4
export interface BusCardProps {
  // ...
  maxChips?: number // default 4
}
// مئات الأسطر المكررة من السوايبر والدوتس والمفضلة والـ StyleSheet الخاص
```

**بعد:**
```tsx
// شارة الإيجار أصبحت بنفس لون السيارات القياسي
if (isRent) {
  badges.push({
    id: 'rent',
    label: 'للإيجار',
    bg: '#FFCC00',
    textColor: '#000000',
  })
}

// maxChips أصبحت 3 زي السيارات بالظبط
export interface BusCardProps {
  item: BusListingCard
  onPress: () => void
  fullWidth?: boolean
  gridMode?: boolean
  actionMenu?: React.ReactNode
  showChips?: boolean
  maxChips?: number // default 3
  disableImageSwipe?: boolean
}

// تحويل المكوّن إلى Adapter خفيف ونظيف يستدعي ListingCardBase
export function BusCard({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  actionMenu,
  showChips = true,
  maxChips = 3,
  disableImageSwipe = false,
}: BusCardProps) {
  // تجميع الـ pills والـ badges الخاصة بالحافلات وتمريرها
  return (
    <ListingCardBase
      item={item}
      title={busName}
      priceLabel={priceLabel}
      isPriceNegotiable={Boolean(isSale && item.isPriceNegotiable)}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="bus-outline"
      pills={pills}
      badges={badges}
      maxChips={maxChips}
      isSellerVerified={isSellerVerified}
      status={rawData.status}
      fullWidth={fullWidth}
      gridMode={gridMode}
      actionMenu={actionMenu}
      disableImageSwipe={disableImageSwipe}
      shareMessage={`شاهد هذه الحافلة المعروضة على سوق ون: ${busName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`}
    />
  )
}
```

**السبب:** توحيد `BusCard` لتعتمد على `ListingCardBase`، ضبط لون شارة الإيجار إلى `#FFCC00`/`#000000`، وتقليل `maxChips` إلى 3 ومطابقة شريط المباع.

---

### `src/components/cars/CarCard.tsx`

**قبل:**
```tsx
export function CarCard({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  actionMenu,
  showChips = true,
  maxChips = 3,
  disableImageSwipe = false,
}: CarCardProps) {
  // أكثر من 450 سطر كود يحتوي على منطق Swiper و BlurView والمفضلة ونفس الـ StyleSheet المكرر
}
```

**بعد:**
```tsx
export function CarCard({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  actionMenu,
  showChips = true,
  maxChips = 3,
  disableImageSwipe = false,
}: CarCardProps) {
  // استخراج الـ pills وتمريرها للمكوّن المشترك ListingCardBase في أقل من 150 سطر
  return (
    <ListingCardBase
      item={item}
      title={carName}
      priceLabel={priceLabel}
      isPriceNegotiable={Boolean(isSale && item.isPriceNegotiable)}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="car-sport"
      pills={pills}
      badges={badges}
      maxChips={maxChips}
      isSellerVerified={isSellerVerified}
      status={rawData.status}
      fullWidth={fullWidth}
      gridMode={gridMode}
      actionMenu={actionMenu}
      disableImageSwipe={disableImageSwipe}
      shareMessage={`شاهد هذه السيارة المعروضة على سوق ون: ${carName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`}
    />
  )
}
```

**السبب:** إعادة استخدام نفس `ListingCardBase` للسيارات أيضاً لمنع أي انحراف مستقبلي بين القسمين وضمان تطابق السلوك.

---

### `app/buses/index.tsx`

**قبل:**
```tsx
function ActionCard({
  icon, label, desc, color, bg, onPress, iconFamily = 'Ionicons'
}: {
  icon: string; label: string; desc: string
  color: string; bg: string; onPress: () => void; iconFamily?: 'Ionicons' | 'MaterialCommunityIcons'
}) {
  return (
    <TouchableOpacity style={[act.card, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.85}>
      // ... كود ميت غير مستخدم
    </TouchableOpacity>
  );
}

// في الـ AnimatedHeroHeader
titleAccent="بيع وتأجير الحافلات بسهولة وموثوقية"
primaryCta={{
  label: 'أضف حافلة',
  icon: 'add-circle-outline',
  onPress: () => navigateToBusForm(),
  textColor: '#FFFFFF',
  bgColor: Colors.accent
}}

// في محتوى الـ ScrollView
contentContainerStyle={{ paddingTop: insets.top + 185 + 4 + 24, paddingBottom: insets.bottom + 80 }}
<View style={s.content}>
  <BusPromoBanner />
  <BusCategoriesGrid />
```

**بعد:**
```tsx
// تم حذف ActionCard و StyleSheet act بالكامل

// في الـ AnimatedHeroHeader: حذف titleAccent وتوحيد الـ CTA
primaryCta={{
  label: 'اعرض حافلتك',
  icon: 'add',
  onPress: () => navigateToBusForm(),
  bgColor: 'rgba(255,255,255,0.2)',
  textColor: Colors.white,
}}

// تصحيح معادلة الـ padding وحذف BusPromoBanner
contentContainerStyle={{
  paddingTop: insets.top + 106 + Spacing.space5,
  paddingBottom: 100,
}}
<View style={s.content}>
  <BusCategoriesGrid />

// في الـ StyleSheet:
content: {
  paddingHorizontal: Spacing.space5,
  gap: 20,
  paddingBottom: Spacing.space4,
},
```

**السبب:** إزالة الكود الميت والبانر الترويجي، توحيد زر الهيدر والمسافات والهوامش لتطابق صفحة هبوط السيارات.

---

### `src/components/buses/BusesVisualFilters.tsx`

**قبل:**
ملف جديد

**بعد:**
```tsx
import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { useBusManufacturers } from '../../hooks/useBuses'
import { useGovernorates } from '../../hooks/useLocations'

export interface BusesVisualFiltersProps {
  selectedBrandId?: string
  selectedCity?: string
  selectedTypeId?: string
  selectedCapacity?: number
  selectedPriceId?: string
  onSelectFilter: (type: string, value: any) => void
  onViewAll: () => void
}

export function BusesVisualFilters({
  selectedBrandId,
  selectedCity,
  selectedTypeId,
  selectedCapacity,
  selectedPriceId,
  onSelectFilter,
  onViewAll,
}: BusesVisualFiltersProps) {
  const { data: manufacturers = [] } = useBusManufacturers()
  const { data: governorates = [] } = useGovernorates()

  // Carousel rendering for makes, bus types, capacity ranges, cities, prices...
}
```

**السبب:** إنشاء مكوّن الفلاتر المرئية للحافلات لجلب الماركات الحقيقية من الـ API بدلاً من الثوابت الجامدة وتقديم كاروسيل تصفية سلس أعلى شاشة البحث.

---

### `src/hooks/useBuses.ts`

**قبل:**
```typescript
export function useBus(id: string) {
  return useQuery({
    queryKey: ['bus', id],
    queryFn: () => busesApi.getBusById(id),
    enabled: !!id,
  })
}
```

**بعد:**
```typescript
export function useBus(id: string) {
  return useQuery({
    queryKey: ['bus', id],
    queryFn: () => busesApi.getBusById(id),
    enabled: !!id,
  })
}

export function useBusManufacturers() {
  return useQuery<BusManufacturer[]>({
    queryKey: ['bus-manufacturers'],
    queryFn: () => busesApi.getManufacturers(),
    staleTime: 60 * 60 * 1000,
  })
}

export function useBusModels(manufacturerId: string) {
  return useQuery<BusModel[]>({
    queryKey: ['bus-models', manufacturerId],
    queryFn: () => busesApi.getModels(manufacturerId),
    enabled: !!manufacturerId,
    staleTime: 60 * 60 * 1000,
  })
}
```

**السبب:** توفير خطافات TanStack Query لجلب بيانات صانعي وموديلات الحافلات الحقيقية من الخادم.

---

### `src/components/filters/QuickFilterModal.tsx`

**قبل:**
```tsx
interface QuickFilterModalProps {
  visible: boolean;
  activeDropdown: string | null;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  brands: any[];
}
```

**بعد:**
```tsx
interface QuickFilterModalProps {
  visible: boolean;
  activeDropdown: string | null;
  onClose: () => void;
  filters: any;
  setFilters: (filters: any) => void;
  brands: any[];
  isBus?: boolean;
}

// دعم قوائم الحافلات:
{activeDropdown === 'busType' && (
  <FlatList data={BUS_TYPES} ... />
)}
{activeDropdown === 'capacity' && (
  <FlatList data={BUS_CAPACITIES} ... />
)}
```

**السبب:** تمكين النافذة المنبثقة المشتركة `QuickFilterModal` من دعم خصائص الحافلات دون الحاجة لتكرار 150+ سطر كود داخل صفحة تصفح الحافلات.

---

### `src/components/ui/BrowseEmptyState.tsx`

**قبل:**
ملف جديد

**بعد:**
```tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'
import { SkeletonCard } from './SkeletonCard'

export interface BrowseEmptyStateProps {
  isLoading: boolean
  isError: boolean
  activeFiltersCount: number
  onRetry: () => void
  onClearAll: () => void
  iconName?: keyof typeof Ionicons.glyphMap
  emptyTitle?: string
  emptySubtitle?: string
  errorText?: string
}

export function BrowseEmptyState({
  isLoading,
  isError,
  activeFiltersCount,
  onRetry,
  onClearAll,
  iconName = 'car-outline',
  emptyTitle = 'لا توجد نتائج مطابقة',
  emptySubtitle = 'جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى',
  errorText = 'حدث خطأ أثناء تحميل البيانات',
}: BrowseEmptyStateProps) {
  // Skeleton, Error, and Empty state layout with Clear All button
}
```

**السبب:** توحيد مكوّن الحالات الفارغة والهيكل العظمي للأقسام المختلفة بتصميم موحد.

---

### `src/components/cars/BrowseEmptyState.tsx`

**قبل:**
```tsx
// 129 سطراً من منطق الهيكل العظمي وحالة الخطأ وحالة عدم وجود نتائج
```

**بعد:**
```tsx
import React from 'react'
import {
  BrowseEmptyState as UIBrowseEmptyState,
  BrowseEmptyStateProps,
} from '../ui/BrowseEmptyState'

export function BrowseEmptyState(props: BrowseEmptyStateProps) {
  return (
    <UIBrowseEmptyState
      iconName="car-outline"
      emptyTitle="لا توجد سيارات مطابقة"
      emptySubtitle="جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى"
      errorText="حدث خطأ أثناء تحميل إعلانات السيارات"
      {...props}
    />
  )
}
```

**السبب:** تحويل مكوّن السيارات للاعتماد على المكوّن الموحّد مع الحفاظ على التوافق الخلفي.

---

### `src/components/ui/BrowseResultsBar.tsx`

**قبل:**
ملف جديد

**بعد:**
```tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'

export interface BrowseResultsBarProps {
  resultsCount: number
  entityName?: string
  iconName?: keyof typeof Ionicons.glyphMap
  activeFiltersCount: number
  onClearAll: () => void
}

export function BrowseResultsBar({
  resultsCount,
  entityName = 'نتيجة',
  iconName = 'car-sport-outline',
  activeFiltersCount,
  onClearAll,
}: BrowseResultsBarProps) {
  return (
    <View style={s.container}>
      <View style={s.countBadge}>
        <Ionicons name={iconName} size={14} color="#64748b" />
        <Text style={s.countText}>
          {resultsCount} {entityName}
        </Text>
      </View>

      {activeFiltersCount > 0 && (
        <TouchableOpacity
          onPress={onClearAll}
          style={s.clearChip}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={13} color="#ef4444" />
          <Text style={s.clearText}>مسح الفلاتر</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
```

**السبب:** توحيد بادج عدد النتائج (`#f8fafc` و `borderRadius: 6`) وزر مسح الفلاتر (`#FEF2F2` مع أيقونة السلة الحمراء) في مكوّن مشترك.

---

### `app/buses/browse.tsx`

**قبل:**
```tsx
// بحث يدوي بـ setTimeout
useEffect(() => {
  const timer = setTimeout(() => {
    setFilters(prev => ({ ...prev, search: searchQuery }));
  }, 400);
  return () => clearTimeout(timer);
}, [searchQuery]);

// أكثر من 150 سطر Modal مكرر داخلي
<Modal visible={!!activeDropdown} transparent animationType="fade">
  ...
</Modal>

// دالة renderEmptyState داخلية مكررة
const renderEmptyState = () => { ... }

// شريط نتائج غير موحد وزر مسح الفلاتر كنص أحمر بدون خلفية
```

**بعد:**
```tsx
// استخدام useDebounce الموحد
const debouncedSearchQuery = useDebounce(searchQuery, 500);
useEffect(() => {
  setFilters((prev) => ({ ...prev, search: debouncedSearchQuery }));
}, [debouncedSearchQuery]);

// استبدال الهيدر والبار بالفلاتر المرئية الجديدة وشريط النتائج الموحد
ListHeaderComponent={
  <View style={s.listHeader}>
    <BusesVisualFilters
      selectedBrandId={filters.make}
      selectedCity={filters.city}
      selectedTypeId={filters.busType}
      selectedCapacity={filters.capacityMin}
      selectedPriceId={filters.priceId}
      onSelectFilter={handleSelectFilter}
      onViewAll={() => setIsFilterVisible(true)}
    />

    {listings && listings.length > 0 && (
      <BrowseResultsBar
        resultsCount={listings.length}
        entityName="حافلة"
        iconName="bus-outline"
        activeFiltersCount={activeFiltersCount}
        onClearAll={handleClearAll}
      />
    )}
  </View>
}

// استبدال الـ Empty State بالمكوّن المشترك
ListEmptyComponent={() => (
  <BrowseEmptyState
    isLoading={isLoading}
    isError={isError}
    activeFiltersCount={activeFiltersCount}
    onRetry={refetch}
    onClearAll={handleClearAll}
    iconName="bus-outline"
    emptyTitle="لا توجد حافلات مطابقة"
    emptySubtitle="جرب تغيير الفلاتر أو كلمة البحث للعثور على نتائج أخرى"
    errorText="حدث خطأ أثناء تحميل الحافلات"
  />
)}

// إضافة ActionBanner في الفوتر
ListFooterComponent={
  <ActionBanner
    title="لديك حافلة للبيع؟"
    subtitle="انشر إعلانك الآن ووصل لآلاف المشترين"
    buttonText="أضف إعلانك"
    iconName="bus-outline"
    onPress={() => router.push('/buses/new' as any)}
  />
}

// استخدام QuickFilterModal الموحد وحذف المودال المكرر
<QuickFilterModal
  visible={!!activeDropdown}
  activeDropdown={activeDropdown}
  onClose={() => setActiveDropdown(null)}
  filters={filters}
  setFilters={setFilters}
  brands={manufacturers || []}
  isBus={true}
/>
```

**السبب:** استبدال المودال والدوال المكررة بمكونات موحدة، إضافة كاروسيل الفلاتر المرئية، ضبط البحث بالـ debounce، وإضافة بانر الإجراء في الفوتر.

---

## 4. ناتج الفحوصات البرمجية

### أ) فحص TypeScript الخام (`npx tsc --noEmit`)
جميع ملفات الحافلات والسيارات والمكونات المشتركة نظيفة بنسبة 100% (0 خطأ):
```text
app/equipment/operators/edit/[id].tsx(30,54): error TS2307: Cannot find module '../../../../src/types/operatorForm.types' or its corresponding type declarations.
app/equipment/operators/edit/[id].tsx(91,18): error TS7006: Parameter 'prev' implicitly has an 'any' type.
app/equipment/operators/edit/[id].tsx(92,16): error TS7006: Parameter 'prev' implicitly has an 'any' type.
app/equipment/operators/edit/[id].tsx(100,16): error TS7006: Parameter 'prev' implicitly has an 'any' type.
app/equipment/operators/edit/[id].tsx(257,30): error TS7006: Parameter 'prev' implicitly has an 'any' type.
src/__tests__/operatorWizard.test.ts(24,5): error TS2353: Object literal may only specify known properties, and 'profileImageUrl' does not exist in type 'OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(57,25): error TS2345: Argument of type '"profileImageUrl"' is not assignable to parameter of type 'keyof OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(68,34): error TS2339: Property 'profileImageUrl' does not exist on type 'OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(69,16): error TS2339: Property 'profileImageUrl' does not exist on type 'OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(69,63): error TS2339: Property 'profileImageUrl' does not exist on type 'OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(70,18): error TS2339: Property 'profileImageUrl' does not exist on type 'OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(71,37): error TS2339: Property 'profileImageUrl' does not exist on type 'OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(71,91): error TS2339: Property 'profileImageUrl' does not exist on type 'OperatorWizardFormData'.
src/components/operators/OperatorRoleStep.tsx(91,60): error TS2345: Argument of type '"profileImageUrl"' is not assignable to parameter of type 'keyof OperatorWizardFormData'.
```

### ب) ناتج اختبارات الاتجاه والـ Fabric التلقائي (`npm test src/__tests__/physicalDirection.spec.ts`)
```text
PASS src/__tests__/physicalDirection.spec.ts
  physicalDirection Single Source of Truth
    Under isRTL === true (Native Arabic environment)
      √ getPhysicalSide() returns "left" to counter Fabric mirroring (50 ms)
      √ physicalRightStyle(16) returns { left: 16 } to anchor on physical right (3 ms)
      √ physicalRowDirection() returns "row" (natural RTL flows right to left) (2 ms)
      √ getGestureDirectionMultiplier() returns 1 (direct 1:1 physical drag: right -> right, left -> left) (2 ms)
    Under isRTL === false (LTR environment)
      √ getPhysicalSide() returns "right" (1 ms)
      √ physicalRightStyle(16) returns { right: 16 } (1 ms)
      √ physicalRowDirection() returns "row-reverse" (1 ms)
      √ getGestureDirectionMultiplier() returns -1 (1 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        5.727 s
```

---

## 5. ملاحظات هندسية إضافية
- تم استخراج كود ميت غير مستخدم بالمرة في صفحة هبوط الحافلات (`ActionCard` و `actionsGrid` المنقولة خطأً من صفحة المعدات).
- تم الحفاظ الكامل على المنطق البيزنسي الفريد للحافلات (شارة العقد التشغيلي، التوجيه لـ `/buses/[id]`).
- تم تأسيس المكوّنات المشتركة الجديدة في مجلد `src/components/ui/` بحيث تستفيد منها الأقسام القادمة (المعدات والشاحنات) دون الحاجة لإعادة كتابة منطق الكروت وتصفية النتائج.
