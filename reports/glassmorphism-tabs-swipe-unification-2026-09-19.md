# تقرير ترقية وتوحيد التابات الجلاسمورفزم إلى محرك السحب الفيزيائي الجديد

**التاريخ**: 2026-09-19  
**الملفات المعدلة**:
- `src/components/ui/GlassCategoriesGrid.tsx`
- `src/components/services/ServicesCategoriesGrid.tsx`
- `src/components/parts/PartsCategoriesGrid.tsx`
**ملف الاختبار الجديد**:
- `src/__tests__/GlassCategoriesGrid.spec.ts`
**الملفات المفحوصة والمؤكدة**:
- `src/components/cars/CategoriesGrid.tsx`
- `src/components/buses/landing/BusCategoriesGrid.tsx`
- `src/components/equipment/landing/EquipmentCategoriesGrid.tsx`

---

## 1. ملخص الترقية (Overview)
- تم تطوير المكون المشترك `GlassCategoriesGrid.tsx` ليدعم **النمط القابل للسحب (Scrollable Mode)** بالاعتماد على محرك السحب الفيزيائي الجديد (`physicalDirection` + `Gesture.Pan()` + `Reanimated`) المستقل تماماً عن نظام اتجاه الجهاز وعلة Fabric RTL.
- تم توحيد تابات **خدمات السيارات (`ServicesCategoriesGrid`)** وتابات **قطع الغيار (`PartsCategoriesGrid`)** بالاعتماد المباشر على `GlassCategoriesGrid` وإلغاء مكونات `ScrollView horizontal` القديمة التي كانت تسبب السحب المقلوب في أندرويد.
- الحفاظ الكامل بنسبة 100% على التوافق التراجعي لتابات الشاشات ذات الـ 4 أو 5 كبسولات (السيارات، الحافلات، المعدات) بحيث تظل شبكة ثابتة متوازنة في صف واحد.

---

## 2. المواصفات الهندسية المنفذة

### أ) هندسة محرك السحب للتابات (Physics & Geometry)
1. **تثبيت التاب الأول على اليمين الفيزيائي**:
   - استخدام `physicalRightStyle(PADDING_END + index * step)` لضمان أن التاب 0 يبدأ دائماً من اليمين الفيزيائي بغض النظر عن لغة النظام أو `I18nManager.isRTL`.
2. **حساب المدى الأقصى لمنع الفراغات (Zero Blank Space)**:
   $$\text{totalContentWidth} = \text{PADDING\_END} + N \times \text{tabWidth} + (N - 1) \times \text{gap} + \text{PADDING\_END}$$
   $$\text{maxScroll} = \max(0, \text{totalContentWidth} - \text{containerWidth})$$
   - هذا يضمن أنه عند التمرير لآخر تاب، تتوقف القائمة عند الحافة اليسرى تماماً دون ترك أي مساحة فارغة شائهة.
3. **المقاومة المطاطية (Rubber-banding)**:
   - مقاومة بنسبة `0.25` عند السحب لما قبل التاب الأول أو ما بعد التاب الأخير.
4. **الاندفاع الذاتي والقفز للتاب الأقرب (Velocity Projection & Snapping)**:
   - عند النقر السريع (Flick)، يتم إسقاط السرعة وتثبيت التاب الأقرب بنعومة عبر `withSpring` وضبطه داخل النطاق `[0, maxScroll]`.
5. **عتبات التفعيل لعدم إعاقة التفاعل**:
   - `activeOffsetX([-10, 10])`: لضمان عمل الضغط على التابات (`onPress`) فوراً.
   - `failOffsetY([-15, 15])`: للسماح بالتمرير الرأسي للشاشة بحرية كاملة.

### ب) دعم الأيقونات المتعددة
- دعم كل من `Ionicons` (المستخدمة في السيارات والحافلات والمعدات) و `MaterialCommunityIcons` (المستخدمة في الخدمات وقطع الغيار) عبر خاصية `iconType?: 'ion' | 'material'`.

---

## 3. الكود الفعلي بعد التعديل

### أ) `src/components/services/ServicesCategoriesGrid.tsx`
```tsx
import React from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

const CATEGORIES = [
  { id: 'MAINTENANCE', label: 'صيانة', icon: 'wrench', color: '#16a34a', bg: '#dcfce7' },
  { id: 'CLEANING', label: 'غسيل وتلميع', icon: 'water', color: '#2563eb', bg: '#dbeafe' },
  { id: 'INSPECTION', label: 'فحص', icon: 'magnify', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'BODYWORK', label: 'سمكرة وصبغ', icon: 'spray', color: '#ea580c', bg: '#ffedd5' },
  { id: 'MODIFICATION', label: 'تعديل', icon: 'tune', color: '#eab308', bg: '#fef9c3' },
  { id: 'TOWING', label: 'ونش وإنقاذ', icon: 'tow-truck', color: '#dc2626', bg: '#fee2e2' },
  { id: 'KEYS_LOCKS', label: 'مفاتيح', icon: 'key', color: '#0891b2', bg: '#cffafe' },
  { id: 'ACCESSORIES_INSTALL', label: 'إكسسوارات', icon: 'car-shift-pattern', color: '#b45309', bg: '#fef3c7' },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid', color: Colors.primary, bg: '#EFF6FF' },
]

export const ServicesCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/services/browse' as any)
    } else {
      router.push(`/services/browse?serviceType=${id}` as any)
    }
  }

  const tabs: GlassCategoryTabItem[] = CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    iconType: 'material',
    iconColor: cat.color,
    iconBg: cat.bg,
    onPress: () => handlePress(cat.id),
  }))

  return <GlassCategoriesGrid items={tabs} scrollable />
}
```

### ب) `src/components/parts/PartsCategoriesGrid.tsx`
```tsx
import React from 'react'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

const CATEGORIES = [
  { id: 'ENGINE', label: 'المحرك', icon: 'engine', color: '#ea580c', bg: '#ffedd5' },
  { id: 'BODY', label: 'الهيكل', icon: 'car-side', color: '#2563eb', bg: '#dbeafe' },
  { id: 'ELECTRICAL', label: 'الكهرباء', icon: 'car-electric', color: '#eab308', bg: '#fef9c3' },
  { id: 'SUSPENSION', label: 'المساعدات والتعليق', icon: 'car-esp', color: '#16a34a', bg: '#dcfce7' },
  { id: 'BRAKES', label: 'الفرامل', icon: 'car-brake-alert', color: '#dc2626', bg: '#fee2e2' },
  { id: 'INTERIOR', label: 'الداخلية', icon: 'car-seat', color: '#9333ea', bg: '#f3e8ff' },
  { id: 'TIRES', label: 'الإطارات', icon: 'tire', color: '#4b5563', bg: '#f3f4f6' },
  { id: 'BATTERIES', label: 'البطاريات', icon: 'car-battery', color: '#0891b2', bg: '#cffafe' },
  { id: 'OILS', label: 'الزيوت', icon: 'oil', color: '#b45309', bg: '#fef3c7' },
  { id: 'all', label: 'عرض الكل', icon: 'view-grid', color: Colors.primary, bg: '#EFF6FF' },
]

export const PartsCategoriesGrid = () => {
  const router = useRouter()

  const handlePress = (id: string) => {
    if (id === 'all') {
      router.push('/parts/browse' as any)
    } else {
      router.push(`/parts/browse?category=${id}` as any)
    }
  }

  const tabs: GlassCategoryTabItem[] = CATEGORIES.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon,
    iconType: 'material',
    iconColor: cat.color,
    iconBg: cat.bg,
    onPress: () => handlePress(cat.id),
  }))

  return <GlassCategoriesGrid items={tabs} scrollable />
}
```

---

## 4. نتائج الفحوصات واختبارات الوحدة (Raw Verification)

### أ) فحص TypeScript
```bash
npx tsc --noEmit
```
**النتيجة**:
كافة ملفات التابات الجلاسمورفزم (`GlassCategoriesGrid.tsx`, `ServicesCategoriesGrid.tsx`, `PartsCategoriesGrid.tsx`) خالية تماماً من أي خطأ (0 errors).

### ب) اختبارات Jest
```bash
npx jest src/__tests__/GlassCategoriesGrid.spec.ts src/__tests__/physicalDirection.spec.ts src/__tests__/useGestureSwiper.spec.ts
```
**النتيجة الخام**:
```text
PASS src/__tests__/physicalDirection.spec.ts
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/GlassCategoriesGrid.spec.ts

Test Suites: 3 passed, 3 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        4.75 s
Ran all test suites matching /src\__tests__\\GlassCategoriesGrid.spec.ts|src\__tests__\\physicalDirection.spec.ts|src\__tests__\\useGestureSwiper.spec.ts/i.
```
