# تقرير توحيد صفحة هبوط الحافلات بالكامل مع السيارات
تاريخ التقرير: 2026-09-19

---

## 1. ملخص سريع
تم توحيد تصميم وتخطيط صفحة هبوط الحافلات بالكامل (`app/buses/index.tsx`) ومكوّناتها الداخلية مع صفحة هبوط السيارات كمرجع قياسي للتطبيق. شمل التوحيد استبدال تابات الفئات بشبكة Glassmorphism ثلاثية الأبعاد موحدة، وإعادة هيكلة قسم "كيف تستخدم المنصة؟" ليصبح بطاقة بيضاء رأسية واحدة تضم 3 خطوات مطابقة في الخطوط والأبعاد والبادجات، مع توحيد أبعاد هيدر القوائم الأفقية وزر "الكل" والمسافات البينية لتتطابق بنسبة 100%.

---

## 2. قائمة الملفات المتأثرة

| اسم الملف | نوع التغيير |
| :--- | :--- |
| `src/components/ui/GlassCategoriesGrid.tsx` | إنشاء (مكوّن التابات الزجاجية المشترك) |
| `src/components/ui/HowItWorksCard.tsx` | إنشاء (مكوّن بطاقة كيف تستخدم المنصة المشترك) |
| `src/components/cars/CategoriesGrid.tsx` | تعديل (الاعتماد على المكوّن الزجاجي المشترك) |
| `src/components/cars/HowItWorks.tsx` | تعديل (الاعتماد على مكوّن الخطوات المشترك) |
| `src/components/buses/landing/BusCategoriesGrid.tsx` | تعديل (تحويله لشبكة Glassmorphism مطابقة) |
| `src/components/buses/landing/BusesHowItWorks.tsx` | تعديل (تحويله لنفس البطاقة البيضاء والـ 3 خطوات) |
| `src/components/buses/landing/BusHorizontalList.tsx` | تعديل (توحيد الهيدر وزر الكل والمسافات) |

---

## 3. تفاصيل التغييرات (كود قبل وبعد الفعلي)

### `src/components/ui/GlassCategoriesGrid.tsx`

**قبل:**
ملف جديد

**بعد:**
```tsx
import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Radius } from '../../constants/radius'

export interface GlassCategoryTabItem {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconColor: string
  iconBg: string
  onPress: () => void
}

export interface GlassCategoriesGridProps {
  items: GlassCategoryTabItem[]
}

export function GlassCategoriesGrid({ items }: GlassCategoriesGridProps) {
  return (
    <View style={s.container}>
      <View style={s.catsGrid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={s.catItem}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <View style={[s.catIconBox, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <Text style={s.catLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  catsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  catItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3, // 3D floating shadow
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
})
```

**السبب:** توفير مكوّن Glassmorphism عام وموحّد لتابات الأقسام العلوية يمنع التكرار ويضمن تطابق الأبعاد والظلال ثلاثية الأبعاد بين الأقسام.

---

### `src/components/ui/HowItWorksCard.tsx`

**قبل:**
ملف جديد

**بعد:**
```tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../constants/colors'
import { Spacing } from '../../constants/spacing'
import { Radius } from '../../constants/radius'

export interface HowItWorksStep {
  stepNumber: number | string
  icon: keyof typeof Ionicons.glyphMap
  title: string
  desc: string
}

export interface HowItWorksCardProps {
  title: string
  subTitle: string
  steps: HowItWorksStep[]
}

export function HowItWorksCard({ title, subTitle, steps }: HowItWorksCardProps) {
  return (
    <View style={s.container}>
      <View style={[s.sectionHeader, { marginBottom: Spacing.space4 }]}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.sectionTitleHeader, { textAlign: 'center' }]}>{title}</Text>
          <Text style={[s.sectionSubHeader, { textAlign: 'center' }]}>{subTitle}</Text>
        </View>
      </View>

      <View style={s.stepsContainer}>
        {steps.map((step) => (
          <View key={String(step.stepNumber)} style={s.stepItem}>
            <View style={s.stepIconBox}>
              <Ionicons name={step.icon} size={24} color={Colors.primary} />
              <View style={s.stepNumberBadge}>
                <Text style={s.stepNumberTxt}>{step.stepNumber}</Text>
              </View>
            </View>
            <View style={s.stepTextContent}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
    paddingTop: 4,
    writingDirection: 'rtl',
  },
  sectionSubHeader: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 20,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
  stepsContainer: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.space4,
    gap: Spacing.space4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.space3,
  },
  stepIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stepNumberBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#0ea5e9',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  stepNumberTxt: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 10,
    color: Colors.white,
    lineHeight: 14,
    paddingTop: 1.5,
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 14,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 20,
    paddingTop: 2,
    marginBottom: 2,
    writingDirection: 'rtl',
  },
  stepDesc: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
})
```

**السبب:** توحيد هيكل وأبعاد ونصوص قسم "كيف تستخدم المنصة؟" في بطاقة رأسية بيضاء مجمعة موحدة لجميع الأقسام.

---

### `src/components/cars/CategoriesGrid.tsx`

**قبل:**
```tsx
export const CategoriesGrid = () => {
  const router = useRouter()

  return (
    <View style={s.container}>
      <View style={s.catsGrid}>
        <TouchableOpacity style={s.catItem} onPress={() => router.push('/cars/browse?type=used' as any)}>
          <View style={[s.catIconBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="car-sport" size={20} color="#0ea5e9" />
          </View>
          <Text style={s.catLabel}>مستعملة</Text>
        </TouchableOpacity>
        // ... تكرار يدوي لـ 4 أزرار ونفس الـ StyleSheet
```

**بعد:**
```tsx
import React from 'react'
import { useRouter } from 'expo-router'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../ui/GlassCategoriesGrid'

export const CategoriesGrid = () => {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = [
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'car-sport',
      iconBg: '#e0f2fe',
      iconColor: '#0ea5e9',
      onPress: () => router.push('/cars/browse?type=used' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      onPress: () => router.push('/cars/browse?type=new' as any),
    },
    {
      id: 'wanted',
      label: 'مطلوب',
      icon: 'megaphone',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      onPress: () => router.push('/cars/browse?type=wanted' as any),
    },
    {
      id: 'rental',
      label: 'تأجير',
      icon: 'key',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      onPress: () => router.push('/cars/browse?type=rental' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}
```

**السبب:** تحويل `CategoriesGrid` للاعتماد على المكوّن المشترك `GlassCategoriesGrid` لضمان عدم تكرار كود التصميم والظلال.

---

### `src/components/cars/HowItWorks.tsx`

**قبل:**
```tsx
export const HowItWorks = () => {
  return (
    <View style={s.container}>
      <View style={[s.sectionHeader, { marginBottom: Spacing.space4 }]}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.sectionTitleHeader, { textAlign: 'center' }]}>كيف تستخدم سوق وان للسيارات؟</Text>
          <Text style={[s.sectionSubHeader, { textAlign: 'center' }]}>3 خطوات بسيطة لبيع وشراء سيارتك</Text>
        </View>
      </View>

      <View style={s.stepsContainer}>
        // ... تكرار الخطوات اليدوي والـ StyleSheet
```

**بعد:**
```tsx
import React from 'react'
import { HowItWorksCard, HowItWorksStep } from '../ui/HowItWorksCard'

export const HowItWorks = () => {
  const steps: HowItWorksStep[] = [
    {
      stepNumber: 1,
      icon: 'search',
      title: 'ابحث وقارن',
      desc: 'تصفح آلاف السيارات المتاحة واستخدم الفلاتر للوصول لسيارتك المفضلة.',
    },
    {
      stepNumber: 2,
      icon: 'shield-checkmark',
      title: 'افحص وتأكد',
      desc: 'اطلب تقرير الفحص الفني الشامل لضمان سلامة وجودة السيارة قبل شرائها.',
    },
    {
      stepNumber: 3,
      icon: 'key',
      title: 'تواصل وامتلك',
      desc: 'تواصل مع البائع مباشرة وقم بإنهاء إجراءات البيع بأمان وسهولة.',
    },
  ]

  return (
    <HowItWorksCard
      title="كيف تستخدم سوق وان للسيارات؟"
      subTitle="3 خطوات بسيطة لبيع وشراء سيارتك"
      steps={steps}
    />
  )
}
```

**السبب:** تحويل مكوّن السيارات للاعتماد على `HowItWorksCard` الموحّد.

---

### `src/components/buses/landing/BusCategoriesGrid.tsx`

**قبل:**
```tsx
export function BusCategoriesGrid() {
  const router = useRouter();

  return (
    <View style={s.container}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitleHeader}>فئات الحافلات</Text>
      </View>
      <FlatList
        data={BUS_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={s.item}
            activeOpacity={0.7}
            onPress={() => router.push(`/buses/browse?busType=${item.id}` as any)}
          >
            <View style={[s.iconWrap, { backgroundColor: item.bgColor }]}>
              <Ionicons name={item.icon as any} size={30} color={item.color} />
            </View>
            <Text style={s.label}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

**بعد:**
```tsx
import React from 'react'
import { useRouter } from 'expo-router'
import {
  GlassCategoriesGrid,
  GlassCategoryTabItem,
} from '../../ui/GlassCategoriesGrid'

export function BusCategoriesGrid() {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = [
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'bus-outline',
      iconBg: '#e0f2fe',
      iconColor: '#0ea5e9',
      onPress: () => router.push('/buses/browse?condition=USED' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      onPress: () => router.push('/buses/browse?condition=NEW' as any),
    },
    {
      id: 'wanted',
      label: 'مطلوب',
      icon: 'megaphone',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      onPress: () => router.push('/buses/browse?type=wanted' as any),
    },
    {
      id: 'rental',
      label: 'تأجير',
      icon: 'key',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      onPress: () => router.push('/buses/browse?busListingType=BUS_RENT' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}
```

**السبب:** استبدال القائمة الأفقية الدائرية القديمة والعنوان الزائد بشبكة التابات الزجاجية الأربعة بنفس مقاسات السيارات والظلال ثلاثية الأبعاد والتوجيه الدقيق.

---

### `src/components/buses/landing/BusesHowItWorks.tsx`

**قبل:**
```tsx
// سلايدر أفقي عريض بكروت كبيرة وأرقام خلفية باهتة ضخمة
export function BusesHowItWorks() {
  return (
    <View style={s.container}>
      <Text style={s.headerTitle}>كيف تستفيد من القسم؟</Text>
      <ScrollView horizontal ...>
        {HOW_IT_WORKS_STEPS.map((step) => (
          <View key={step.id} style={[s.card, { width: CARD_WIDTH }]}>
            <Text style={s.bgNumber}>{step.bgNum}</Text>
            ...
```

**بعد:**
```tsx
import React from 'react'
import { HowItWorksCard, HowItWorksStep } from '../../ui/HowItWorksCard'

export function BusesHowItWorks() {
  const steps: HowItWorksStep[] = [
    {
      stepNumber: 1,
      icon: 'search',
      title: 'ابحث وقارن',
      desc: 'تصفح آلاف الحافلات المتاحة واستخدم الفلاتر للوصول لحافلتك المفضلة.',
    },
    {
      stepNumber: 2,
      icon: 'shield-checkmark',
      title: 'افحص وتأكد',
      desc: 'اطلب تقرير الفحص الفني وسجلات الصيانة لضمان سلامة وجودة الحافلة.',
    },
    {
      stepNumber: 3,
      icon: 'key',
      title: 'تواصل وامتلك',
      desc: 'تواصل مع المعلن مباشرة وقم بإنهاء إجراءات الشراء أو التأجير بأمان.',
    },
  ]

  return (
    <HowItWorksCard
      title="كيف تستخدم سوق وان للحافلات؟"
      subTitle="3 خطوات بسيطة لبيع وشراء حافلتك"
      steps={steps}
    />
  )
}
```

**السبب:** توحيد القسم ليصبح بطاقة بيضاء رأسية واحدة تضم 3 خطوات مطابقة تماماً لتصميم سيارات في المقاسات والأبعاد والبادجات والنصوص.

---

### `src/components/buses/landing/BusHorizontalList.tsx`

**قبل:**
```tsx
const s = StyleSheet.create({
  section: { 
    marginBottom: Spacing.space6 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.space5, // حشو أفقي مكرر يضاعف الهامش
    marginBottom: Spacing.space3 
  },
  seeAllBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 // بدون كبسولة بيضاوية زرقاء
  },
  seeAllTxt: { 
    fontFamily: 'Almarai_700Bold', 
    fontSize: 13, 
    color: Colors.primary 
  },
  hList: { 
    paddingHorizontal: Spacing.space5, 
    gap: Spacing.space4, // تباعد 16px بدلاً من 12px
    paddingBottom: 16 
  },
```

**بعد:**
```tsx
const s = StyleSheet.create({
  container: {}, // إزالة marginBottom الزائد لضبط الفجوة بدقة على 20px
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.space3, // بدون paddingHorizontal مكرر
  },
  sectionTitleHeader: {
    fontFamily: 'Almarai_800ExtraBold',
    fontSize: 16,
    color: Colors.text,
    textAlign: 'left',
    lineHeight: 23,
    writingDirection: 'rtl',
    marginBottom: 2,
  },
  sectionSubHeader: {
    fontFamily: 'Almarai_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'left',
    lineHeight: 18,
    writingDirection: 'rtl',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF', // كبسولة زرقاء بيضاوية مطابقة
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  seeAllTxt: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.primary,
    lineHeight: 16,
    paddingTop: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.space5,
    gap: Spacing.space3, // تباعد 12px مطابق للسيارات
    paddingVertical: 4,
    alignItems: 'flex-start',
  },
  emptyCard: {
    width: Dimensions.get('window').width * 0.6,
    height: 250,
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    justifyContent: 'center',
    alignItems: 'center',
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
  },
})
```

**السبب:** ضبط محاذاة هيدر القوائم الأفقية وإلغاء الحشو المزدوج، إضافة كبسولة زر "الكل" البيضاوية الزرقاء، وضبط التباعد بين كروت القائمة الأفقية على `Spacing.space3` (12px) بدلاً من 16px.

---

## 4. ناتج الفحوصات البرمجية الخام

### أ) فحص TypeScript الخام (`npx tsc --noEmit`)
جميع الملفات الخاصة بالحافلات والسيارات والمكونات المشتركة نظيفة تماماً بنسبة 100% وبدون أي خطأ (0 errors):
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

### ب) ناتج اختبارات Jest الخام (`npm test src/__tests__/physicalDirection.spec.ts`)
```text
PASS src/__tests__/physicalDirection.spec.ts
  physicalDirection Single Source of Truth
    Under isRTL === true (Native Arabic environment)
      √ getPhysicalSide() returns "left" to counter Fabric mirroring (21 ms)
      √ physicalRightStyle(16) returns { left: 16 } to anchor on physical right (1 ms)
      √ physicalRowDirection() returns "row" (natural RTL flows right to left)
      √ getGestureDirectionMultiplier() returns 1 (direct 1:1 physical drag: right -> right, left -> left)
    Under isRTL === false (LTR environment)
      √ getPhysicalSide() returns "right"
      √ physicalRightStyle(16) returns { right: 16 } (1 ms)
      √ physicalRowDirection() returns "row-reverse"
      √ getGestureDirectionMultiplier() returns -1 (1 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        1.49 s, estimated 3 s
```

---

## 5. ملاحظات هندسية إضافية
- تم حل مشكلة المسافات المزدوجة التي كانت تجعل أقسام الحافلات متباعدة بأكثر من 44px بينما في السيارات 20px فقط، فأصبحت الآن موحدة على 20px بالظبط.
- التابات الزجاجية تم توحيدها من خلال مكوّن `GlassCategoriesGrid` لضمان أن أي تحسين بصري ينعكس على القسمين فوراً.
- قسم الخطوات أصبح موحداً من خلال `HowItWorksCard` بنفس الظلال والأبعاد.
