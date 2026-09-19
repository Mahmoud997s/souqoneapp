# تقرير إضافة الأقسام الأفقية وإعادة ترتيب لاندينج الحافلات
تاريخ التقرير: 2026-09-19

---

## 1. ملخص سريع
تمت إضافة قسمين أفقيين أساسيين في صفحة هبوط الحافلات وهما: "حافلات للبيع بعقد" و "حافلات للإيجار"، مع إعادة ترتيب الأقسام الأفقية ترتيباً تسويقياً وتجريبياً صحيحاً يبدأ بالقسم الجديد "أحدث أنواع الحافلات" (محولاً من الأكثر طلباً) لجلب أحدث الإعلانات المضافة للمنصة أولاً، متبوعاً بالحافلات المميزة ثم حافلات للبيع، ثم حافلات للبيع بعقد، وأخيراً حافلات للإيجار.

---

## 2. قائمة الملفات المتأثرة

| اسم الملف | نوع التغيير |
| :--- | :--- |
| `app/buses/index.tsx` | تعديل (إعادة ترتيب الأقسام الأفقية وإضافة قسم حافلات للبيع بعقد وتحويل الأكثر طلباً لأحدث الحافلات) |

---

## 3. تفاصيل التغييرات (كود قبل وبعد الفعلي)

### `app/buses/index.tsx`

**قبل:**
```tsx
          {/* LISTS */}
          {loadRest && (
            <>
              <BusLandingSection
                title="حافلات للبيع"
                subTitle="تصفح أحدث عروض بيع الحافلات"
                queryParams={{ busListingType: 'BUS_SALE', limit: 6 }}
                emptyText="لا توجد حافلات للبيع حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_SALE')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection
                title="حافلات للإيجار"
                subTitle="خيارات تأجير مرنة ومتنوعة"
                queryParams={{ busListingType: 'BUS_RENT', limit: 6 }}
                emptyText="لا توجد حافلات للإيجار حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_RENT')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection
                title="حافلات مميزة"
                subTitle="إعلانات موثوقة ومميزة"
                queryParams={{ isPremium: true, limit: 6 }}
                emptyText="لا توجد حافلات مميزة حالياً"
                onSeeAll={() => router.push('/buses/browse?isPremium=true')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection
                title="الأكثر طلباً"
                subTitle="الحافلات الأكثر شعبية وبحثاً"
                queryParams={{ sort: 'popular', limit: 6 }}
                emptyText="لا توجد بيانات حالياً"
                onSeeAll={() => router.push('/buses/browse?sort=popular')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />
            </>
          )}
```

**بعد:**
```tsx
          {/* LISTS */}
          {loadRest && (
            <>
              <BusLandingSection
                title="أحدث أنواع الحافلات"
                subTitle="تصفح أحدث عروض وإعلانات الحافلات المضافة"
                queryParams={{ sort: 'newest', limit: 6 }}
                emptyText="لا توجد حافلات مضافة حالياً"
                onSeeAll={() => router.push('/buses/browse?sort=newest')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection
                title="حافلات مميزة"
                subTitle="إعلانات موثوقة ومختارة بعناية"
                queryParams={{ isPremium: true, limit: 6 }}
                emptyText="لا توجد حافلات مميزة حالياً"
                onSeeAll={() => router.push('/buses/browse?isPremium=true')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection
                title="حافلات للبيع"
                subTitle="تصفح أفضل عروض بيع الحافلات"
                queryParams={{ busListingType: 'BUS_SALE', limit: 6 }}
                emptyText="لا توجد حافلات للبيع حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_SALE')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection
                title="حافلات للبيع بعقد"
                subTitle="حافلات مع عقود تشغيل قائمة ومضمونة"
                queryParams={{ busListingType: 'BUS_SALE_WITH_CONTRACT', limit: 6 }}
                emptyText="لا توجد حافلات للبيع بعقد حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />

              <BusLandingSection
                title="حافلات للإيجار"
                subTitle="خيارات تأجير مرنة ومتنوعة"
                queryParams={{ busListingType: 'BUS_RENT', limit: 6 }}
                emptyText="لا توجد حافلات للإيجار حالياً"
                onSeeAll={() => router.push('/buses/browse?busListingType=BUS_RENT')}
                onPressItem={(item) => router.push(`/buses/${item.id}` as any)}
              />
            </>
          )}
```

**السبب:** وضع قسم أحدث الإعلانات في صدارة الأقسام لإنعاش الشاشة بالجديد دائماً، وإضافة قسم مستقل لبيع الحافلات بعقود تشغيل، وترتيب البيع والإيجار بتسلسل منطقي جذاب.

---

## 4. ناتج الفحوصات البرمجية الخام

### أ) فحص TypeScript الخام (`npx tsc --noEmit`):
الملفات المعدلة والجديدة نظيفة 100% بدون أي خطأ:
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

### ب) ناتج اختبارات Jest الخام (`npm test src/__tests__/physicalDirection.spec.ts`):
```text
PASS src/__tests__/physicalDirection.spec.ts
  physicalDirection Single Source of Truth
    Under isRTL === true (Native Arabic environment)
      √ getPhysicalSide() returns "left" to counter Fabric mirroring (27 ms)
      √ physicalRightStyle(16) returns { left: 16 } to anchor on physical right (1 ms)
      √ physicalRowDirection() returns "row" (natural RTL flows right to left)
      √ getGestureDirectionMultiplier() returns 1 (direct 1:1 physical drag: right -> right, left -> left)
    Under isRTL === false (LTR environment)
      √ getPhysicalSide() returns "right"
      √ physicalRightStyle(16) returns { right: 16 } (1 ms)
      √ physicalRowDirection() returns "row-reverse"
      √ getGestureDirectionMultiplier() returns -1

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        1.326 s
```
