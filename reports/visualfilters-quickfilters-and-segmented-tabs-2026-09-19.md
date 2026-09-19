<div dir="rtl" style="text-align: right;">

# تقرير: تحسينات الفلاتر البصرية (QuickFilters و Segmented Control المتجاوب)

**تاريخ التقرير:** 19 سبتمبر 2026  
**الملفات المعدلة:**
- `src/components/ui/QuickFilters.tsx` (توحيد على `PhysicalHorizontalTrack`)
- `src/components/ui/VisualFiltersBase.tsx` (دعم Segmented Control المتجاوب: ثابت متساوي عند ≤ 3 تابات، وقابل للسحب عند ≥ 4 تابات)
- `src/__tests__/PhysicalHorizontalTrack.spec.ts` (إضافة اختبارات عتبة التابات المتجاوبة `isSegmentedTabsFixed`)

---

## 1. ملخص التحسينات الهندسية

1. **توحيد `QuickFilters.tsx` على محرك `PhysicalHorizontalTrack`**:
   - تم استبدال `ScrollView` القياسي بـ `PhysicalHorizontalTrack` لضمان الاتساق المعماري التام في كل المسارات الأفقية داخل التطبيق.
   - الحفاظ على نفس السلوك البصري 100%: لا يوجد `resetKey` على شريط الفلاتر السريعة، ومع ثبات مفاتيح العناصر `key={qf.id}` وعدد الفلاتر، لا يتم إعادة تعيين موضع السكرول إطلاقاً عند تفعيل أو إلغاء تفعيل أي فلتر.

2. **شريط التابات المتجاوب في `VisualFiltersBase.tsx` (Responsive Segmented Control)**:
   - **إذا كان عدد التابات ≤ 3**: يتحول الشريط تلقائياً إلى شريط ثابت هندسياً غير قابل للسحب (`flexDirection: 'row'`, `width: '100%'`)، ويأخذ كل تاب حصة متساوية تماماً عبر `flex: 1` و `numberOfLines={1}`، مع مراعاة حشو الحاوية والفواصل `gap: 4`.
   - **إذا كان عدد التابات ≥ 4**: يظل شريط التابات يعمل عبر `PhysicalHorizontalTrack` القابل للسحب بالسحب الفيزيائي وعرض كل تاب بحسب طول محتواه النصي وأيقونته.
   - تم تطبيق المنطق مركزياً داخل `VisualFiltersBase` ليعمل تلقائياً وديناميكياً على كافة الفيرتيكالز السبعة دون الحاجة لأي كود إضافي في الـ Adapters.

---

## 2. جدول حصر الفيرتيكالز السبعة وسلوك شريط التابات

| الفيرتيكال | المكوّن | عدد التابات | أسماء التابات | السلوك المطبق تلقائياً |
| :--- | :--- | :---: | :--- | :--- |
| **Cars** | `CarsVisualFilters` | 5 | الماركات، الموديلات، المدن، الأسعار، الفئات | **قابل للسحب** (`PhysicalHorizontalTrack`) |
| **Services** | `ServicesVisualFilters` | 4 | أنواع الخدمات، التخصصات، المدن، نوع المزود | **قابل للسحب** (`PhysicalHorizontalTrack`) |
| **Buses** | `BusesVisualFilters` | 5 | الماركات، الفئات، سعة الركاب، المدن، نطاقات الأسعار | **قابل للسحب** (`PhysicalHorizontalTrack`) |
| **Equipment** | `EquipmentVisualFilters` | 4 | الأقسام، المدن، الأسعار، الحالة | **قابل للسحب** (`PhysicalHorizontalTrack`) |
| **Parts** | `PartsVisualFilters` | 2 | الأقسام الرئيسية، الماركات المتوافقة | **شريط ثابت متساوي هندسياً** (`flex: 1` Segmented Control) |
| **Transport** | `TransportVisualFilters` | 5 | نوع الشحن، المحافظات، التوقيت، الميزانية، توفير عمال | **قابل للسحب** (`PhysicalHorizontalTrack`) |
| **MyListings** | `MyListingsVisualFilters` | 8 | الكل، سيارات، حافلات، معدات، مشغلون، قطع غيار، خدمات، وظائف | **قابل للسحب** (`PhysicalHorizontalTrack`) |

---

## 3. الكود الفعلي قبل وبعد (Before & After Code)

### أ) `src/components/ui/QuickFilters.tsx`

#### قبل (Before):
```tsx
import React from 'react';
import { View, ScrollView, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';

export interface QuickFilterItem {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isActive?: boolean;
}

export interface QuickFiltersProps {
  filters: QuickFilterItem[];
  onFilterPress: (id: string) => void;
  onClearFilter: (id: string) => void;
}

export function QuickFilters({ filters, onFilterPress, onClearFilter }: QuickFiltersProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <View style={s.quickFiltersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.quickFiltersContent}>
        {filters.map((qf) => {
          const isActive = qf.isActive;
          
          return (
            <TouchableOpacity
              key={qf.id}
              style={[s.quickFilterChip, isActive && s.quickFilterChipActive]}
              activeOpacity={0.8}
              onPress={() => onFilterPress(qf.id)}
            >
              {!isActive && qf.icon && (
                <Ionicons name={qf.icon} size={12.5} color={Colors.textMuted} />
              )}
              <Text style={[s.quickFilterTxt, isActive && s.quickFilterTxtActive]} numberOfLines={1}>
                {qf.label}
              </Text>
              {isActive ? (
                <TouchableOpacity
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    onClearFilter(qf.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={12.5} color={Colors.white} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={11} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
```

#### بعد (After):
```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { PhysicalHorizontalTrack } from './PhysicalHorizontalTrack';

export interface QuickFilterItem {
  id: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isActive?: boolean;
}

export interface QuickFiltersProps {
  filters: QuickFilterItem[];
  onFilterPress: (id: string) => void;
  onClearFilter: (id: string) => void;
}

export function QuickFilters({ filters, onFilterPress, onClearFilter }: QuickFiltersProps) {
  if (!filters || filters.length === 0) return null;

  return (
    <View style={s.quickFiltersContainer}>
      <PhysicalHorizontalTrack
        minHeight={34}
        contentContainerStyle={s.quickFiltersContent}
      >
        {filters.map((qf) => {
          const isActive = qf.isActive;
          
          return (
            <TouchableOpacity
              key={qf.id}
              style={[s.quickFilterChip, isActive && s.quickFilterChipActive]}
              activeOpacity={0.8}
              onPress={() => onFilterPress(qf.id)}
            >
              {!isActive && qf.icon && (
                <Ionicons name={qf.icon} size={12.5} color={Colors.textMuted} />
              )}
              <Text style={[s.quickFilterTxt, isActive && s.quickFilterTxtActive]} numberOfLines={1}>
                {qf.label}
              </Text>
              {isActive ? (
                <TouchableOpacity
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={(e) => {
                    e.stopPropagation();
                    onClearFilter(qf.id);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={12.5} color={Colors.white} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={11} color={Colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        })}
      </PhysicalHorizontalTrack>
    </View>
  );
}
```

---

### ب) `src/components/ui/VisualFiltersBase.tsx`

#### التعديلات الجوهرية (Diff Highlights):
```diff
+/**
+ * Pure function to determine whether segmented tabs should be fixed equal width
+ * (tabs count <= 3) or horizontally scrollable (tabs count >= 4).
+ */
+export function isSegmentedTabsFixed(tabsCount: number): boolean {
+  return tabsCount <= 3;
+}

...

+  const isFixedTabs = isSegmentedTabsFixed(tabs.length);
+
+  const renderTabItem = (tab: VisualFilterTab<TTabId>) => {
+    const isActive = activeTabId === tab.id;
+    return (
+      <TouchableOpacity
+        key={tab.id}
+        activeOpacity={0.8}
+        style={[
+          s.segmentTab,
+          isFixedTabs && s.fixedSegmentTab,
+          isActive && s.segmentTabActive,
+        ]}
+        onPress={() => handleTabPress(tab.id)}
+      >
+        {tab.icon && (
+          <Ionicons
+            name={tab.icon as any}
+            size={14}
+            color={isActive ? activeColor : '#64748b'}
+            style={s.tabIcon}
+          />
+        )}
+        <Text
+          style={[
+            s.segmentTabText,
+            isActive && [s.segmentTabTextActive, { color: activeColor }],
+          ]}
+          numberOfLines={1}
+        >
+          {tab.label}
+        </Text>
+      </TouchableOpacity>
+    );
+  };

   return (
     <View style={[s.container, isTransparent && { backgroundColor: 'transparent', borderBottomWidth: 0 }, containerStyle]}>
       {/* ── TABS ── */}
       <View style={s.segmentedWrapper}>
-        <PhysicalHorizontalTrack
-          resetKey={activeTabId}
-          minHeight={34}
-          contentContainerStyle={s.segmentedContainer}
-        >
-          {tabs.map((tab) => { ... })}
-        </PhysicalHorizontalTrack>
+        {isFixedTabs ? (
+          <View style={s.fixedSegmentedContainer}>
+            {tabs.map(renderTabItem)}
+          </View>
+        ) : (
+          <PhysicalHorizontalTrack
+            resetKey={activeTabId}
+            minHeight={34}
+            contentContainerStyle={s.segmentedContainer}
+          >
+            {tabs.map(renderTabItem)}
+          </PhysicalHorizontalTrack>
+        )}
       </View>

...

   segmentedContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 4,
   },
+  fixedSegmentedContainer: {
+    flexDirection: 'row',
+    alignItems: 'center',
+    width: '100%',
+    gap: 4,
+  },
   segmentTab: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 6,
     paddingHorizontal: 12,
     borderRadius: 6,
     gap: 5,
   },
+  fixedSegmentTab: {
+    flex: 1,
+    paddingHorizontal: 4,
+  },
```

---

## 4. ناتج الفحوصات الخام (Raw Verification Output)

### أ) ناتج فحص Jest:
```text
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/physicalDirection.spec.ts
PASS src/__tests__/carsBrowseFilters.spec.ts
PASS src/__tests__/servicesBrowseFilters.spec.ts
PASS src/__tests__/PhysicalHorizontalTrack.spec.ts (7.016 s)

Test Suites: 5 passed, 5 total
Tests:       44 passed, 44 total
Snapshots:   0 total
Time:        8.29 s
Ran all test suites matching /src\__tests__\physicalDirection.spec.ts|src\__tests__\useGestureSwiper.spec.ts|src\__tests__\PhysicalHorizontalTrack.spec.ts|src\__tests__\carsBrowseFilters.spec.ts|src\__tests__\servicesBrowseFilters.spec.ts/i.
```

### ب) ناتج فحص TypeScript (`npx tsc --noEmit`):
ملفات المشروع المعدلة (`QuickFilters.tsx` و `VisualFiltersBase.tsx` و `PhysicalHorizontalTrack.spec.ts`) خالية تماماً من أي أخطاء (0 أخطاء). الأخطاء المتبقية في المستودع سابقة ولا علاقة لها بالفلاتر أو المسار الأفقي:
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

</div>
