# تقرير: ترقية عارض صور الخطوة الخامسة (step5.tsx) وحذف الأكواد الميتة

- **التاريخ:** 2026-09-20
- **المستودع:** `Souqoneapp` (تطبيق الموبايل)
- **الفرع:** `master`

---

## 1. تفاصيل التعديلات على `app/post/step5.tsx`

تم استبدال الـ `ScrollView` ذي الـ `pagingEnabled` بحساب يدوي للمؤشر `Math.round(x / cardWidth)`، بمكون `CardImageSwiper` المعتمد على `react-native-gesture-handler` و `react-native-reanimated` لضمان تجربة مستخدم فيزيائية سليمة تماماً تحت بيئة الـ RTL.

### كود قبل التعديل:
```tsx
          {/* ── 1. معرض الصور (Un-zoomed & Refined) ── */}
          {allImages.length > 0 ? (
            <View style={s.galleryCard}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x
                  const idx = Math.round(x / cardWidth)
                  setActiveImageIndex(idx)
                }}
              >
                {allImages.map((uri, index) => (
                  <View key={index} style={[s.slideWrap, { width: cardWidth }]}>
                    <Image source={{ uri }} style={s.slideImg} contentFit="cover" />
                  </View>
                ))}
              </ScrollView>
              <View style={s.photoCounterBadge}>
                <Ionicons name="camera" size={12} color={Colors.white} />
                <Text style={s.photoCounterTxt}>
                  {activeImageIndex + 1} / {allImages.length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.noImageCard}>
              <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
              <Text style={s.noImageTxt}>لم يتم إرفاق صور لهذا الإعلان</Text>
            </View>
          )}
```

### كود بعد التعديل:
```tsx
          {/* ── 1. معرض الصور (Un-zoomed & Refined) ── */}
          {allImages.length > 0 ? (
            <View style={s.galleryCard}>
              <CardImageSwiper
                images={allImages}
                cardWidth={cardWidth}
                imageHeight={195}
                onActiveIndexChange={setActiveImageIndex}
              />
              <View style={s.photoCounterBadge} pointerEvents="none">
                <Ionicons name="camera" size={12} color={Colors.white} />
                <Text style={s.photoCounterTxt}>
                  {activeImageIndex + 1} / {allImages.length}
                </Text>
              </View>
            </View>
          ) : (
            <View style={s.noImageCard}>
              <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
              <Text style={s.noImageTxt}>لم يتم إرفاق صور لهذا الإعلان</Text>
            </View>
          )}
```

---

## 2. قائمة الملفات المحذوفة (Dead Code)

بعد التأكد التام عبر `git grep` من عدم وجود أي استدعاء أو استخدام لها في المشروع:

1. `src/components/equipment/EquipmentCategoriesGrid.tsx`
   - سبب الحذف: ملف قديم مهجور؛ تستخدم شاشة المعدات النسخة المطورة `src/components/equipment/landing/EquipmentCategoriesGrid.tsx`.
2. `src/components/cars/BrandCarousel.tsx`
   - سبب الحذف: مكوّن مهجور غير مستخدم في أي مكان بالتطبيق (تم استبداله سابقاً بـ `CarsVisualFilters`).
3. `src/components/filters/ActiveFiltersRow.tsx`
   - سبب الحذف: مكوّن مهجور غير مستخدم في أي مكان، وكان يحتوي على خطأ `row-reverse` يكسر اتجاه الـ RTL التلقائي.

---

## 3. نتائج الفحوصات

### أ. اختبارات Jest:
```text
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/physicalDirection.spec.ts

Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        11.444 s
```

### ب. فحص TypeScript:
- لا توجد أي أخطاء متعلقة بـ `app/post/step5.tsx` أو الملفات المحذوفة.
