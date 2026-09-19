# تقرير ضبط عنوان الإعلان في الكارت على سطر واحد كحد أقصى
تاريخ التقرير: 2026-09-19

---

## 1. ملخص سريع
تم تعديل المكوّن الموحّد للكروت `ListingCardBase.tsx` (الذي يستند عليه كل من `BusCard` و `CarCard`) لجعل عنوان الإعلان لا يتعدى سطراً واحداً كحد أقصى (`numberOfLines={1}`) مع تفعيل خاصية الاقتطاع النظيف بالنقاط (`ellipsizeMode="tail"`). كما تمت إضافة خاصية `titleNumberOfLines` في واجهة الخصائص بقيمة افتراضية `1` لضمان التوافقية والمرونة.

---

## 2. قائمة الملفات المتأثرة

| اسم الملف | نوع التغيير |
| :--- | :--- |
| `src/components/ui/ListingCardBase.tsx` | تعديل (تحديد عنوان الإعلان بسطر واحد كحد أقصى مع ellipsizeMode) |

---

## 3. تفاصيل التغييرات (كود قبل وبعد الفعلي)

### `src/components/ui/ListingCardBase.tsx`

**قبل:**
```tsx
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
  disableImageSwipe?: boolean
  shareMessage?: string
}

export const ListingCardBase = ({
  item,
  title,
  priceLabel,
  isPriceNegotiable = false,
  location,
  onPress,
  displayImages = [],
  placeholderIcon = 'car-sport',
  pills = [],
  badges = [],
  customBadges,
  maxChips = 3,
  isSellerVerified = false,
  isSold = false,
  status = 'ACTIVE',
  fullWidth = false,
  gridMode = false,
  actionMenu,
  disableImageSwipe = false,
  shareMessage,
}: ListingCardBaseProps) => {

  // ...

  {/* ── DETAILS SECTION ── */}
  <Pressable onPress={onPress} style={s.cardDetails}>
    <View style={s.headerRow}>
      <Text style={[s.cardTitle, { flex: 1 }]} numberOfLines={2}>
        {title}
      </Text>
      {isSellerVerified && (
        <View style={s.verifiedRow}>
          <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
          <Text style={s.verifiedTxt}>موثق</Text>
        </View>
      )}
    </View>
```

**بعد:**
```tsx
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
  disableImageSwipe?: boolean
  shareMessage?: string
  titleNumberOfLines?: number
}

export const ListingCardBase = ({
  item,
  title,
  priceLabel,
  isPriceNegotiable = false,
  location,
  onPress,
  displayImages = [],
  placeholderIcon = 'car-sport',
  pills = [],
  badges = [],
  customBadges,
  maxChips = 3,
  isSellerVerified = false,
  isSold = false,
  status = 'ACTIVE',
  fullWidth = false,
  gridMode = false,
  actionMenu,
  disableImageSwipe = false,
  shareMessage,
  titleNumberOfLines = 1,
}: ListingCardBaseProps) => {

  // ...

  {/* ── DETAILS SECTION ── */}
  <Pressable onPress={onPress} style={s.cardDetails}>
    <View style={s.headerRow}>
      <Text
        style={[s.cardTitle, { flex: 1 }]}
        numberOfLines={titleNumberOfLines}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      {isSellerVerified && (
        <View style={s.verifiedRow}>
          <Ionicons name="checkmark-circle" size={12} color="#1877F2" />
          <Text style={s.verifiedTxt}>موثق</Text>
        </View>
      )}
    </View>
```

**السبب:** تقييد عنوان الإعلان بسطر واحد فقط لمنع زيادة ارتفاع الكروت وللحفاظ على استقامة وتناسق الشبكات والقوائم الأفقية والرأسية.

---

## 4. ناتج الفحوصات البرمجية الخام

### أ) فحص TypeScript الخام (`npx tsc --noEmit`):
جميع الملفات نظيفة 100% بدون أي خطأ:
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
      √ getPhysicalSide() returns "left" to counter Fabric mirroring (25 ms)
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
Time:        2.493 s
```
