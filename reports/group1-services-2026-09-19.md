# تقرير المجموعة 1 (4 من 12): خدمات السيارات — تحويل القائمة الأفقية وتوحيد الأداء

**التاريخ**: 2026-09-19  
**الملفات المعدلة**:
- `src/components/services/ServiceHorizontalList.tsx`
- `src/hooks/useServices.ts`
- `app/services/index.tsx`
**الملفات المفحوصة والمؤكدة**:
- `src/components/services/ServiceCard.tsx`
- `src/components/services/ServiceSkeletonCard.tsx`
- `app/services/browse.tsx`
- `src/components/profile/my-listings/MyListingCardDispatcher.tsx`
- `app/(tabs)/index.tsx`

---

## 1. ملخص التحويل (Overview)
- تم تحويل القائمة الأفقية لخدمات السيارات `ServiceHorizontalList.tsx` بالكامل من استخدام `ScrollView horizontal` القديم إلى `HorizontalScrollCard` المدعوم بـ `useGestureSwiper` و `physicalDirection.ts` لضمان اتجاه RTL الفيزيائي السليم وتفادي علة التمرير في معمارية Fabric.
- تم ضبط العرض الصريح لبطاقة الخدمات وحالة السكيلتون:
  ```tsx
  const CARD_WIDTH = Dimensions.get('window').width * 0.6;
  ```
- تم تمرير `disableImageSwipe={true}` لـ `ServiceCard` في القوائم الأفقية لمنع تعارض إيماءات تقليب صور الإعلان مع السحب الأفقي للقائمة.
- ينعكس هذا التحويل فوراً على القوائم الأفقية الأربعة في صفحة هبوط الخدمات (`app/services/index.tsx`):
  1. "خدمات متنقلة"
  2. "خدمات الصيانة"
  3. "غسيل وتلميع"
  4. "خدمات أخرى"
- تم توحيد كاش هوك `useServices.ts` بإضافة سياسة الكاش المعتمدة في سيارات وباصات (`staleTime: 5min`, `gcTime: 10min`, `retry: 1`).
- تم توحيد الهامش السفلي لشاشة الخدمات عبر `UNIFIED_BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, 12) + 8`.

---

## 2. فحص أداء السكيلتون `ServiceSkeletonCard`
- **التشخيص**:
  - يحتوي `ServiceSkeletonCard.tsx` على أنيميشن تدرج لوني (`backgroundColor`) عبر `Animated.loop` بتوقيت 850ms مع `useNativeDriver: false`.
- **تحليل التأثير على الأداء**:
  - بفضل تشغيل إيماءات وحسابات `HorizontalScrollCard` بالكامل على خيط واجهة المستخدم (`UI Thread Worklets`) عبر Reanimated و GestureHandler، لا تتأثر سلاسة السحب إطلاقاً بأنيميشن السكيلتون الذي يعمل على خيط جافاسكريبت (`JS Thread`).
  - تم تمرير `style={{ width: CARD_WIDTH, marginBottom: 0 }}` صراحة إلى `ServiceSkeletonCard` لإلغاء الـ `marginBottom: 12` الافتراضي وتثبيت العرض الهندسي الدقيق للبطاقة بدون اقتطاع رأسي.

---

## 3. تأكيد فحص أماكن استخدام `ServiceCard` الأخرى في التطبيق
تم فحص كافة أماكن استخدام `ServiceCard` عبر:
```bash
git grep -l "ServiceCard" -- "*.tsx"
```
**النتائج والتأكيد**:
1. `src/components/profile/my-listings/MyListingCardDispatcher.tsx` (قائمة رأسية):
   - لم يمرر `disableImageSwipe` (القيمة الافتراضية `false` — تقليب الصور متاح للمستخدم).
2. `app/services/browse.tsx` (قائمة رأسية):
   - لم يمرر `disableImageSwipe` (القيمة الافتراضية `false` — تقليب الصور متاح للمستخدم).
3. `app/(tabs)/index.tsx` (القائمة الأفقية للرئيسية):
   - يمرر `disableImageSwipe={true}` بالفعل.
4. `src/components/services/ServiceHorizontalList.tsx` (القوائم الأفقية للخدمات):
   - يمرر `disableImageSwipe={true}` بنجاح.

---

## 4. الكود الفعلي الكامل قبل وبعد في `src/components/services/ServiceHorizontalList.tsx`

### قبل التعديل:
```tsx
import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { ServiceCard } from './ServiceCard'
import { ServiceSkeletonCard } from './ServiceSkeletonCard'
import { EmptyState } from '../ui/EmptyState'
import { CardSystem } from '../../constants/cardSystem'

export const ServiceHorizontalList = ({ 
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
            <ServiceSkeletonCard key={i} />
          ))
        ) : data.length > 0 ? (
          data.map((item, idx) => (
            <ServiceCard 
              key={item.id ?? idx} 
              item={item} 
              onPress={() => onPressItem(item)} 
            />
          ))
        ) : (
          <View style={s.emptyCard}>
            <EmptyState 
              title={emptyText} 
              icon="document-text-outline"
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
import { ServiceCard } from './ServiceCard'
import { ServiceSkeletonCard } from './ServiceSkeletonCard'
import { HorizontalScrollCard } from '../ui/HorizontalScrollCard'
import { EmptyState } from '../ui/EmptyState'
import { CardSystem } from '../../constants/cardSystem'

const CARD_WIDTH = Dimensions.get('window').width * 0.6

export const ServiceHorizontalList = ({ 
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
              <ServiceSkeletonCard style={{ width: CARD_WIDTH, marginBottom: 0 }} />
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
              <ServiceCard 
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
              icon="document-text-outline"
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
كافة ملفات الخدمات (`ServiceHorizontalList.tsx`, `useServices.ts`, `app/services/index.tsx`) خالية تماماً من أي خطأ (0 errors).

### ب) اختبارات Jest
```bash
npx jest src/__tests__/physicalDirection.spec.ts src/__tests__/useGestureSwiper.spec.ts
```
**النتيجة الخام**:
```text
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/physicalDirection.spec.ts

Test Suites: 2 passed, 2 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        3.833 s
Ran all test suites matching /src\__tests__\\physicalDirection.spec.ts|src\__tests__\\useGestureSwiper.spec.ts/i.
```
