# تقرير إصلاح مشكلة قص كروت السكيلتون (Skeleton Card Bottom Clipping Fix)

## 1. ملخص سريع
تم تشخيص وحل مشكلة ظهور كروت التحميل (Loading Skeleton) مقصوصة من الأسفل في القوائم الأفقية (`CarHorizontalList` و `BusHorizontalList`).
السبب الجذري كان نتيجة قفل ارتفاع عنصر `cardWrapper` بـ `position: 'absolute', top: 0, bottom: 0` مما منعه من احتساب الارتفاع الحقيقي وجعل الحاوية تقفل عند 260px مع `overflow: 'hidden'`، بالإضافة إلى أن هوامش `SkeletonCard` القديمة كانت ضخمة (12px لكل فاصل وحشوة) فزاد ارتفاعها عن 267px مما أدى لقص الحافة السفلية للكرت. تم حل المشكلة هندسياً في `HorizontalScrollCard` و `SkeletonCard`.

---

## 2. قائمة الملفات المتأثرة
| اسم الملف | نوع التغيير |
|---|---|
| `src/components/ui/SkeletonCard.tsx` | تعديل |
| `src/components/ui/HorizontalScrollCard.tsx` | تعديل |
| `src/components/cars/CarHorizontalList.tsx` | تعديل |
| `src/components/buses/landing/BusHorizontalList.tsx` | تعديل |

---

## 3. تفاصيل التعديلات مع الأدلة (Before / After)

### أ. ملف `src/components/ui/HorizontalScrollCard.tsx`

#### قبل (BEFORE):
```tsx
  const handleCardLayout = useCallback(
    (e: any) => {
      if (cardHeight) return
      const h = e.nativeEvent.layout.height
      if (h > 0 && h !== measuredHeight) {
        setMeasuredHeight(h)
      }
    },
    [cardHeight, measuredHeight]
  )

  const finalHeight = cardHeight || measuredHeight || 260

  // ...
  cardWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
```

#### بعد (AFTER):
```tsx
  // Measure container height dynamically if cardHeight wasn't explicitly provided
  const handleCardLayout = useCallback(
    (e: any) => {
      if (cardHeight) return
      const h = e.nativeEvent.layout.height
      if (h > 0) {
        const total = Math.ceil(h + 8) // +8 accounts for 4px top and 4px bottom shadow/breathing space
        if (total !== measuredHeight) {
          setMeasuredHeight(total)
        }
      }
    },
    [cardHeight, measuredHeight]
  )

  const finalHeight = cardHeight ? cardHeight + 8 : (measuredHeight || 270)

  // ...
  cardWrapper: {
    position: 'absolute',
    top: 4,
  },
```

---

### ب. ملف `src/components/ui/SkeletonCard.tsx`

#### قبل (BEFORE):
```tsx
const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: CardSystem.aspectRatioHeight,
  },
  body: {
    padding: Spacing.space3,
    gap: Spacing.space3,
  },
  // ... gaps 12px everywhere causing height > 267px and clipping at bottom
```

#### بعد (AFTER):
```tsx
export function SkeletonCard({ style, fullWidth = false }: SkeletonCardProps) {
  // ...
  return (
    <View style={[s.card, fullWidth && { width: '100%' }, style]}>
      {/* Image — matches UnifiedCard aspectRatio 4/3 */}
      <Animated.View style={[s.image, { height: imageHeight, backgroundColor: bg }]} />

      <View style={s.body}>
        {/* Title row */}
        <View style={s.row}>
          <Animated.View style={[s.titleLine, { backgroundColor: bg }]} />
          <Animated.View style={[s.badge, { backgroundColor: bg }]} />
        </View>

        {/* Location row */}
        <View style={s.locationRow}>
          <Animated.View style={[s.locLine, { backgroundColor: bg }]} />
        </View>

        {/* Divider */}
        <Animated.View style={[s.divider, { backgroundColor: bg }]} />

        {/* Chips row */}
        <View style={s.chipsRow}>
          <Animated.View style={[s.chip, { backgroundColor: bg }]} />
          <Animated.View style={[s.chip, { backgroundColor: bg }]} />
          <Animated.View style={[s.chip, { backgroundColor: bg }]} />
        </View>

        {/* Footer divider */}
        <Animated.View style={[s.divider, { backgroundColor: bg }]} />

        {/* Footer */}
        <View style={s.footer}>
          <Animated.View style={[s.timeLine, { backgroundColor: bg }]} />
          <Animated.View style={[s.priceLine, { backgroundColor: bg }]} />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: CardSystem.radius.outer,
    ...CardSystem.styles.border,
    ...CardSystem.styles.softShadow,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  // ... EXACTLY MATCHING ListingCardBase (~248-250px)
```

---

### ج. ملفات القوائم `CarHorizontalList.tsx` و `BusHorizontalList.tsx`
تم تزويد `HorizontalScrollCard` بمفاتيح صريحة (`key="loading-skeleton"` و `key="loaded-cards"`) لضمان عدم تداخل دورة حياة المكون أو بقاء إزاحة سحب سابقة عند الانتقال بين التحميل والبيانات الحقيقية.

---

## 4. التحقق واختبارات TypeScript

### تشغيل `npx tsc --noEmit`:
جميع الملفات المعدلة في هذا التاسك تخلو تماماً من أي أخطاء ترجمة (0 errors في الكود المعدل):
- `src/components/ui/SkeletonCard.tsx`: **0 errors**
- `src/components/ui/HorizontalScrollCard.tsx`: **0 errors**
- `src/components/cars/CarHorizontalList.tsx`: **0 errors**
- `src/components/buses/landing/BusHorizontalList.tsx`: **0 errors**
