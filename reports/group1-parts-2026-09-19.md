# تقرير المجموعة 1 (3 من 12): قطع الغيار — تحويل القائمة الأفقية

**التاريخ**: 2026-09-19  
**الملف المعدل**: `src/components/parts/PartHorizontalList.tsx`  
**الملفات المفحوصة والمؤكدة**:
- `src/components/parts/PartSkeletonCard.tsx`
- `src/components/parts/PartCard.tsx`
- `app/parts/browse.tsx`
- `src/components/profile/my-listings/MyListingCardDispatcher.tsx`
- `app/(tabs)/index.tsx`
- `app/parts/index.tsx`

---

## 1. ملخص التحويل (Overview)
- تم تحويل القائمة الأفقية لقطع الغيار `PartHorizontalList.tsx` بالكامل من استخدام `ScrollView horizontal` القديم إلى `HorizontalScrollCard` المدعوم بـ `useGestureSwiper` و `physicalDirection.ts` لضمان سلاسة السحب واتجاه RTL الفيزيائي السليم.
- تم ضبط العرض الصريح لبطاقة قطع الغيار وحالة السكيلتون:
  ```tsx
  const CARD_WIDTH = Dimensions.get('window').width * 0.6;
  ```
- تم تمرير `disableImageSwipe={true}` لـ `PartCard` لمنع تعارض إيماءات تقليب صور الإعلان الأفقية مع سحب القائمة الأفقية نفسها.
- ينعكس هذا التحويل تلقائياً على الشاشات الثلاث التي تستخدم هذا المكون في صفحة هبوط قطع الغيار (`app/parts/index.tsx`):
  1. "قطع غيار مميزة"
  2. "قطع غيار أصلية"
  3. "أُضيف حديثاً"

---

## 2. فحص أداء السكيلتون `PartSkeletonCard`
- **التشخيص**:
  - يحتوي `PartSkeletonCard.tsx` على أنيميشن تدرج لوني (`backgroundColor`) عبر `Animated.loop` بتوقيت 850ms مع `useNativeDriver: false`.
  - يتكرر هذا الأنيميشن على 14 عنصراً داخلياً لكل بطاقة (أي 42 عنصراً لـ 3 بطاقات سكيلتون).
- **تحليل التأثير على الأداء عند وضعه داخل `HorizontalScrollCard`**:
  - يعتمد `HorizontalScrollCard` على إيماءات `react-native-gesture-handler` ومحرك `react-native-reanimated` الذي يُنفذ جميع حسابات السحب والانزلاق بالكامل على خيط واجهة المستخدم (`UI / Render Thread Worklets`).
  - أنيميشن السكيلتون يعمل على خيط جافاسكريبت (`JS Thread`) ومحصور بفترة وجيزة أثناء تحميل البيانات فقط (`isLoading`).
  - بالتالي، لا يوجد أي تعارض إيمائي أو تعليق لحركة السحب على شاشات الجوال.
- **التحسين البصري المطبق**:
  - تم تمرير `style={{ width: CARD_WIDTH, marginBottom: 0 }}` صراحة إلى `PartSkeletonCard` لمنع الاقتطاع العمودي أو التباعد السفلي الزائد الذي كان يسببه الـ `marginBottom: 12` الافتراضي في البطاقة.

---

## 3. تأكيد فحص أماكن استخدام `PartCard` الأخرى في التطبيق
تم فحص كافة أماكن استخدام `PartCard` عبر:
```bash
git grep -l "PartCard" -- "*.tsx"
```
**النتائج والتأكيد**:
1. `src/components/profile/my-listings/MyListingCardDispatcher.tsx` (قائمة رأسية):
   - لم يمرر `disableImageSwipe` (القيمة الافتراضية `false` — تقليب الصور متاح للمستخدم).
2. `app/parts/browse.tsx` (قائمة رأسية / شبكة البحث):
   - لم يمرر `disableImageSwipe` (القيمة الافتراضية `false` — تقليب الصور متاح للمستخدم).
3. `app/(tabs)/index.tsx` (القائمة الأفقية للرئيسية):
   - تم تمرير `disableImageSwipe={true}` سابقاً في تحويل الصفحة الرئيسية.
4. `src/components/parts/PartHorizontalList.tsx` (القائمة الأفقية لقطع الغيار):
   - تم تمرير `disableImageSwipe={true}` بنجاح.

---

## 4. الكود الفعلي الكامل قبل وبعد في `src/components/parts/PartHorizontalList.tsx`

### قبل التعديل:
```tsx
import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { PartCard } from './PartCard'
import { PartSkeletonCard } from './PartSkeletonCard'
import { EmptyState } from '../ui/EmptyState'
import { CardSystem } from '../../constants/cardSystem'

export const PartHorizontalList = ({ 
  title, 
  subTitle, 
  data, 
  isLoading, 
  emptyText, 
  onSeeAll, 
  onPressItem 
}: { 
  title: string, 
  subTitle?: string, 
  data: any[], 
  isLoading: boolean, 
  emptyText: string, 
  onSeeAll: () => void, 
  onPressItem: (item: any) => void 
}) => {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          {subTitle && <Text style={s.subTitle}>{subTitle}</Text>}
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={s.scrollView}
        contentContainerStyle={s.scrollContent}
      >
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <PartSkeletonCard key={i} />
          ))
        ) : data.length > 0 ? (
          data.map((item, idx) => (
            <PartCard 
              key={item.id ?? idx} 
              item={item} 
              onPress={() => onPressItem(item)} 
            />
          ))
        ) : (
          <View style={s.emptyCard}>
            <EmptyState 
              title={emptyText} 
              icon="construct-outline"
              compact 
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}
```

### بعد التعديل:
```tsx
import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { PartCard } from './PartCard'
import { PartSkeletonCard } from './PartSkeletonCard'
import { HorizontalScrollCard } from '../ui/HorizontalScrollCard'
import { EmptyState } from '../ui/EmptyState'
import { CardSystem } from '../../constants/cardSystem'

const CARD_WIDTH = Dimensions.get('window').width * 0.6

export const PartHorizontalList = ({ 
  title, 
  subTitle, 
  data, 
  isLoading, 
  emptyText, 
  onSeeAll, 
  onPressItem 
}: { 
  title: string, 
  subTitle?: string, 
  data: any[], 
  isLoading: boolean, 
  emptyText: string, 
  onSeeAll: () => void, 
  onPressItem: (item: any) => void 
}) => {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>{title}</Text>
          {subTitle && <Text style={s.subTitle}>{subTitle}</Text>}
        </View>
        <TouchableOpacity style={s.seeAllBtn} onPress={onSeeAll} activeOpacity={0.7}>
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          <HorizontalScrollCard
            key="loading-skeleton"
            data={[1, 2, 3]}
            cardWidth={CARD_WIDTH}
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item) => String(item)}
            renderItem={() => (
              <PartSkeletonCard style={{ width: CARD_WIDTH, marginBottom: 0 }} />
            )}
          />
        </View>
      ) : data.length > 0 ? (
        <View style={{ marginHorizontal: -Spacing.space5 }}>
          <HorizontalScrollCard
            key="loaded-cards"
            data={data}
            cardWidth={CARD_WIDTH}
            gap={Spacing.space3}
            paddingEnd={Spacing.space5}
            keyExtractor={(item, idx) => item.id ?? String(idx)}
            renderItem={({ item }) => (
              <PartCard 
                item={item} 
                onPress={() => onPressItem(item)} 
                disableImageSwipe={true}
              />
            )}
          />
        </View>
      ) : (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginHorizontal: -Spacing.space5 }}
          contentContainerStyle={s.scrollContent}
        >
          <View style={s.emptyCard}>
            <EmptyState 
              title={emptyText} 
              icon="construct-outline"
              compact 
            />
          </View>
        </ScrollView>
      )}
    </View>
  )
}
```

---

## 5. نتائج الفحوصات واختبارات الوحدة (Raw Verification)

### أ) فحص TypeScript
```bash
npx tsc --noEmit
```
**النتيجة**:
`src/components/parts/PartHorizontalList.tsx` خالي تماماً من أي خطأ في الأنواع (0 errors).

### ب) اختبارات Jest
```bash
npx jest src/__tests__/physicalDirection.spec.ts src/__tests__/useGestureSwiper.spec.ts src/__tests__/PartCard.readPath.spec.tsx
```
**النتيجة الخام**:
```text
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/physicalDirection.spec.ts
PASS src/__tests__/PartCard.readPath.spec.tsx (8.401 s)

Test Suites: 3 passed, 3 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        9.83 s, estimated 23 s
Ran all test suites matching /src\__tests__\\physicalDirection.spec.ts|src\__tests__\\useGestureSwiper.spec.ts|src\__tests__\\PartCard.readPath.spec.tsx/i.
```
