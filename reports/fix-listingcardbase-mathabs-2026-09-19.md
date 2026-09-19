# تقرير إصلاح باگ Math.abs في ListingCardBase.tsx

**التاريخ:** 2026-09-19  
**الملف المعدل:** `src/components/ui/ListingCardBase.tsx`

---

## 1. ملخص سريع
تم تصحيح حساب مؤشر الصورة النشطة (Active Dot Index) داخل سوايبر كروت الإعلانات `ListingCardBase` بإضافة `Math.abs()` على `contentOffset.x` لمنع خروج قيم سالبة في بيئات RTL على نظام Android.  
هذا التعديل يضمن تزامن وترقيم نقاط السلايدر (Pagination Dots) بدقة في كروت `CarCard` و `BusCard` المستندة إلى هذا المكوّن الأساسي.

---

## 2. كود قبل وبعد في `ListingCardBase.tsx`

### السطر المعني (السطر 181):

#### قبل التعديل:
```tsx
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
                  setActiveImgIdx(newIdx)
                }}
```

#### بعد التعديل:
```tsx
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(Math.abs(e.nativeEvent.contentOffset.x) / cardWidth)
                  setActiveImgIdx(newIdx)
                }}
```

### السياق الكامل للكود المحيط (الأسطر 170-199):
```tsx
          ) : cardWidth > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={[
                  s.swiperScrollView,
                  fullWidth && { height: CardSystem.fullWidthHeight, aspectRatio: undefined },
                ]}
                onMomentumScrollEnd={(e) => {
                  const newIdx = Math.round(Math.abs(e.nativeEvent.contentOffset.x) / cardWidth)
                  setActiveImgIdx(newIdx)
                }}
              >
                {displayImages.map((img, i) => (
                  <Pressable
                    key={i}
                    onPress={onPress}
                    style={{ width: cardWidth, height: '100%' }}
                  >
                    <Image
                      source={{ uri: img }}
                      style={s.imageFill}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
```

---

## 3. نتائج فحص الكود (Grep) للأماكن المتبقية بنفس النمط

أمر البحث الأول:
```bash
git grep -n "contentOffset.x / cardWidth" -- "*.tsx"
```
الناتج:
```text
src/components/cards/EquipCard.tsx:102:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
src/components/cards/UnifiedCard.tsx:187:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
src/components/parts/PartCard.tsx:225:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
src/components/services/ServiceCard.tsx:109:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
```

أمر البحث الثاني:
```bash
git grep -n "contentOffset.x /" -- "*.tsx"
```
الناتج:
```text
src/components/cards/EquipCard.tsx:102:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
src/components/cards/UnifiedCard.tsx:187:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
src/components/parts/PartCard.tsx:225:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
src/components/services/ServiceCard.tsx:109:                  const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
```

> **ملاحظة:** لم يتم تعديل هذه الملفات الأربعة (`EquipCard`, `UnifiedCard`, `PartCard`, `ServiceCard`) وسيتم علاجها في تاسكاتها المستقلة المخصصة لكل فيرتيكال.

---

## 4. نتائج الفحص الآلي (Raw Output)

### أ. فحص TypeScript (`npx tsc --noEmit`)
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
*(الملف المعدل `ListingCardBase.tsx` خالي تماماً من أي أخطاء نوعية).*

### ب. فحص Jest (`npx jest src/__tests__/physicalDirection.spec.ts`)
```text
PASS src/__tests__/physicalDirection.spec.ts
  physicalDirection Single Source of Truth
    Under isRTL === true (Native Arabic environment)
      √ getPhysicalSide() returns "left" to counter Fabric mirroring (29 ms)
      √ physicalRightStyle(16) returns { left: 16 } to anchor on physical right (2 ms)
      √ physicalRowDirection() returns "row" (natural RTL flows right to left) (1 ms)
      √ getGestureDirectionMultiplier() returns 1 (direct 1:1 physical drag: right -> right, left -> left) (1 ms)
    Under isRTL === false (LTR environment)
      √ getPhysicalSide() returns "right" (1 ms)
      √ physicalRightStyle(16) returns { right: 16 } (1 ms)
      √ physicalRowDirection() returns "row-reverse"
      √ getGestureDirectionMultiplier() returns -1

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        2.986 s
Ran all test suites matching /src\__tests__\physicalDirection.spec.ts/i.
```
