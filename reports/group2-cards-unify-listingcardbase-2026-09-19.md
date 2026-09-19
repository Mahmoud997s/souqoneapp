# تقرير توحيد الكروت الأربعة على ListingCardBase

**التاريخ:** 2026-09-19  
**الملفات المتأثرة:**
- `src/components/ui/ListingCardBase.tsx` (توسيع الـ Props ليشمل `imageHeight`, `cardActions`, `favoriteType`, `onFavorite`, `style`)
- `src/components/cards/EquipCard.tsx` (تحويل لـ Adapter فوق `ListingCardBase`)
- `src/components/parts/PartCard.tsx` (تحويل لـ Adapter فوق `ListingCardBase`)
- `src/components/services/ServiceCard.tsx` (تحويل لـ Adapter فوق `ListingCardBase`)
- `src/components/cards/UnifiedCard.tsx` (تحويل لـ Adapter فوق `ListingCardBase`)

---

## 1. ملخص سريع
تم توحيد كروت الإعلانات الأربعة (`UnifiedCard`, `EquipCard`, `PartCard`, `ServiceCard`) لتعمل كـ Adapters خفيفة ونظيفة ترتكز على المكوّن الموحّد `ListingCardBase`.  
بذلك تم القضاء نهائياً على تكرار منطق السوايبر، واكتسبت الكروت الأربعة تلقائياً معالجة الـ RTL الصحيحة مع `Math.abs`، ودعم خاصية `disableImageSwipe` لمنع تداخل الحركات عند وضعها داخل قوائم أفقية.

---

## 2. كود قبل وبعد الفعلي (Diff)

### أ. التعديلات في `src/components/ui/ListingCardBase.tsx`

```diff
 export interface ListingCardBaseProps {
   item: any
   title: string
   priceLabel: string
   isPriceNegotiable?: boolean
   location?: string
   onPress: () => void
   displayImages?: string[]
   placeholderIcon?: string
   pills?: ListingCardPill[]
   badges?: ListingCardBadge[]
   customBadges?: React.ReactNode
   maxChips?: number
   isSellerVerified?: boolean
   isSold?: boolean
   status?: string
   fullWidth?: boolean
   gridMode?: boolean
   actionMenu?: React.ReactNode
+  cardActions?: React.ReactNode
   disableImageSwipe?: boolean
   shareMessage?: string
   titleNumberOfLines?: number
+  imageHeight?: number
+  favoriteType?: string
+  onFavorite?: (isFav: boolean) => void
+  style?: any
 }
```

```diff
   const handleFavorite = async () => {
     if (!isLoggedIn) {
       router.push('/(auth)/login' as any)
       return
     }
 
-    setIsFav((prev) => !prev)
+    const nextFav = !isFav
+    setIsFav(nextFav)
+    onFavorite?.(nextFav)
 
     try {
-      await favoritesApi.add('LISTING', item.id)
+      const targetId = item.id || item.raw?.id
+      await favoritesApi.add((favoriteType || 'LISTING') as any, targetId)
       queryClient.invalidateQueries({ queryKey: ['favorites'] })
     } catch (err: any) {
       console.log('Error toggling favorite:', err?.response?.data || err.message || err)
       setIsFav((prev) => !prev)
     }
   }
```

```diff
+        {cardActions && (
+          <View style={s.cardActionsRow}>
+            {cardActions}
+          </View>
+        )}
```

---

### ب. تحويل `src/components/cards/EquipCard.tsx`

#### قبل:
كارت منفصل يحتوي على 367 سطراً، كود سوايبر يدوي، وبدون `disableImageSwipe`، ويحسب الإندكس:
```tsx
const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
```

#### بعد:
أدابتر خفيف (193 سطراً) يستخرج بيانات المعدة ويمررها لـ `ListingCardBase`:
```tsx
export const EquipCard = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  showChips = false,
  maxChips = 3,
  actionMenu,
  disableImageSwipe = false,
}: EquipCardProps) => {
  // ... استخراج displayImages, priceLabel, equipName, badges, pills ...
  return (
    <ListingCardBase
      item={item}
      title={equipName}
      priceLabel={priceLabel}
      isPriceNegotiable={Boolean(isSale && item.isPriceNegotiable)}
      location={location}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="hardware-chip-outline"
      pills={pills}
      badges={badges}
      maxChips={maxChips}
      isSellerVerified={isSellerVerified}
      status={rawData.status}
      fullWidth={fullWidth}
      gridMode={gridMode}
      actionMenu={actionMenu}
      disableImageSwipe={disableImageSwipe}
      titleNumberOfLines={2}
      favoriteType="EQUIPMENT"
      shareMessage={`شاهد هذه المعدة المعروضة على سوق ون: ${equipName}\nالسعر: ${priceLabel}\nhttps://souqone.app/listings/${item.id}`}
    />
  )
}
```

---

### ج. تحويل `src/components/parts/PartCard.tsx`

#### قبل:
مكوّن ضخم من 758 سطراً، يحتوي على سوايبر مكرر، وبدون `disableImageSwipe`، ويحسب الإندكس:
```tsx
const newIdx = Math.round(e.nativeEvent.contentOffset.x / cardWidth)
```

#### بعد:
أدابتر مركّز (263 سطراً) يحافظ على الـ 8 رقائق (Pills) المعيارية وشارات الأصالة والضمان، ويدعم `disableImageSwipe`:
```tsx
export const PartCard: React.FC<PartCardProps> = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  showChips = false,
  maxChips = 3,
  actionMenu,
  disableImageSwipe = false,
}) => {
  // ... استخراج البيانات والـ 8 رقائق والشارات ...
  return (
    <ListingCardBase
      item={item}
      title={partTitle}
      priceLabel={priceLabel}
      isPriceNegotiable={isPriceNegotiable}
      location={location}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="construct-outline"
      pills={pills}
      badges={badges}
      maxChips={maxChips}
      isSellerVerified={isSellerVerified}
      status={rawData.status}
      fullWidth={fullWidth}
      gridMode={gridMode}
      actionMenu={actionMenu}
      disableImageSwipe={disableImageSwipe}
      titleNumberOfLines={2}
      favoriteType="SPARE_PART"
      shareMessage={`شاهد هذه القطعة المعروضة على سوق ون: ${partTitle}\nالسعر: ${priceLabel}\nhttps://souqone.app/parts/${rawData.id || item.id}`}
    />
  )
}
```

---

### د. تحويل `src/components/services/ServiceCard.tsx`

#### قبل:
مكوّن من 321 سطراً، سوايبر يدوي بدون `disableImageSwipe`، وحساب إندكس غير محمي.

#### بعد:
أدابتر خفيف (147 سطراً) يمرر بيانات المركز والخدمة والمواعيد لـ `ListingCardBase`:
```tsx
export const ServiceCard = ({
  item,
  onPress,
  fullWidth = false,
  gridMode = false,
  disableImageSwipe = false,
}: ServiceCardProps) => {
  // ... استخراج البيانات والـ pills والـ badges ...
  return (
    <ListingCardBase
      item={item}
      title={item.title}
      priceLabel={priceLabel}
      location={item.governorate || ''}
      onPress={onPress}
      displayImages={displayImages}
      placeholderIcon="build"
      pills={pills}
      badges={badges}
      fullWidth={fullWidth}
      gridMode={gridMode}
      disableImageSwipe={disableImageSwipe}
      titleNumberOfLines={2}
      favoriteType="CAR_SERVICE"
      shareMessage={`شاهد هذه الخدمة على سوق ون: ${item.title}\nالمزود: ${providerName}\nhttps://souqone.app/services/${item.id}`}
    />
  )
}
```

---

### هـ. تحويل `src/components/cards/UnifiedCard.tsx`

#### قبل:
مكوّن من 465 سطراً يدمج وضعين (Compact و Vertical)، كان الوضع الرأسي يحتوي على سوايبر صور يدوي غير محمي بـ `Math.abs` ولا يدعم `disableImageSwipe`.

#### بعد:
الحفاظ على وضع الـ Compact المصغر كما هو، بينما يعتمد الوضع الرأسي بالكامل على `ListingCardBase` مع تمرير أزرار الاتصال والمحادثة عبر `cardActions`:
```tsx
  return (
    <ListingCardBase
      item={item}
      title={item.title}
      priceLabel={priceLabel}
      location={item.governorate}
      onPress={handlePress}
      onFavorite={onFavorite}
      displayImages={displayImages}
      placeholderIcon={CATEGORY_ICONS[item.category ?? 'cars'] || 'cube-outline'}
      pills={pills}
      badges={badges}
      isSellerVerified={item.isVerified}
      imageHeight={imageHeight}
      cardActions={renderCardActions()}
      disableImageSwipe={disableImageSwipe}
      titleNumberOfLines={1}
    />
  )
```

---

## 3. نتائج الفحص الآلي (Raw Output)

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
*(الملفات الخمسة المتأثرة بالتعديل خالية 100% من أي أخطاء تجميع).*

### ب. فحص اختبارات الاتجاه (`npx jest src/__tests__/physicalDirection.spec.ts`)
```text
PASS src/__tests__/physicalDirection.spec.ts
  physicalDirection Single Source of Truth
    Under isRTL === true (Native Arabic environment)
      √ getPhysicalSide() returns "left" to counter Fabric mirroring (74 ms)
      √ physicalRightStyle(16) returns { left: 16 } to anchor on physical right (2 ms)
      √ physicalRowDirection() returns "row" (natural RTL flows right to left) (1 ms)
      √ getGestureDirectionMultiplier() returns 1 (direct 1:1 physical drag: right -> right, left -> left) (2 ms)
    Under isRTL === false (LTR environment)
      √ getPhysicalSide() returns "right" (1 ms)
      √ physicalRightStyle(16) returns { right: 16 } (1 ms)
      √ physicalRowDirection() returns "row-reverse" (1 ms)
      √ getGestureDirectionMultiplier() returns -1 (4 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        2.802 s
Ran all test suites matching /src\__tests__\physicalDirection.spec.ts/i.
```

### ج. فحص اختبارات كارت قطع الغيار (`npx jest src/__tests__/PartCard.readPath.spec.tsx`)
```text
PASS src/__tests__/PartCard.readPath.spec.tsx
  Phase 11: PartCard & Filters Read Path
    √ centralized constants export valid lookups matching options (5 ms)
    √ PartCard renders warranty and vehicle types pills when showChips=true (463 ms)
    √ PartCard handles maxChips cutoff and renders +N badge correctly (12 ms)
    √ PartsFilterBottomSheet displays hasWarranty and compatibleVehicleType correctly (415 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        3.728 s, estimated 22 s
Ran all test suites matching /src\\__tests__\\PartCard.readPath.spec.tsx/i.
```
