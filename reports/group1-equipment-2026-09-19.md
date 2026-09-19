# تقرير المجموعة 1 (2 من 12): صفحة المعدات — تحويل 4 قوائم أفقية

**التاريخ**: 2026-09-19  
**الملف المعدل**: `app/equipment/index.tsx`  
**الملفات المفحوصة والمؤكدة**:
- `src/components/cards/EquipCard.tsx`
- `src/components/cards/OperatorCard.tsx`
- `src/components/profile/my-listings/MyListingCardDispatcher.tsx`

---

## 1. ملخص التحويل (Overview)
- تم تحويل كافة القوائم الأفقية الأربعة في صفحة المعدات (`app/equipment/index.tsx`) من `ScrollView horizontal` القديم إلى `HorizontalScrollCard` المدعوم بـ `useGestureSwiper` و `physicalDirection.ts`.
- **بناء حالات الـ Skeleton المفقودة**: كانت القوائم الثلاثة الأولى تفتقر تماماً لحالة التحميل (تظهر بيضاء أو فارغة لحين وصول البيانات). تم إنشاء حالات تحميل متقنة باستخدام `SkeletonCard` بعرض محدد بدقة (`cardWidth: 260` للمعدات و `280` للمشغلين) لمنع أي قفزات بصرية أو انقطاع في أسفل الكروت.
- تم تمرير `disableImageSwipe={true}` لكافة كروت المعدات `EquipCard` في القوائم الأفقية.

---

## 2. تفصيل حالة كل قائمة من القوائم الأربعة

### أ) قائمة "أحدث المعدات" (سطر 213 سابقاً)
- **الحالة السابقة**: `<ScrollView horizontal>` بدون أي حالة Skeleton (كان يظهر فارغاً أثناء التحميل).
- **التحويل**: تم التحويل إلى `HorizontalScrollCard` مع حالة سكيلتون `[1, 2, 3]` بعرض `260` وتمرير `disableImageSwipe={true}` لـ `EquipCard`.

### ب) قائمة "معدات للبيع" (سطر 233 سابقاً)
- **الحالة السابقة**: `<ScrollView horizontal>` يعرض نص "لا يوجد معدات للبيع حالياً" فوراً أثناء التحميل قبل وصول البيانات.
- **التحويل**: تم ربط `isLoading: loadingSale` مع `HorizontalScrollCard` لعرض 3 كروت سكيلتون أثناء التحميل، ثم عرض المعدات مع `disableImageSwipe={true}`، والنص الفارغ فقط عند انتهاء التحميل وعدم وجود عناصر.

### ج) قائمة "معدات للإيجار" (سطر 255 سابقاً)
- **الحالة السابقة**: `<ScrollView horizontal>` يعرض نص "لا توجد معدات للإيجار حالياً" أثناء التحميل.
- **التحويل**: تم ربط `isLoading: loadingRent` وعرض كروت سكيلتون بدقة أثناء التحميل، ثم عرض كروت المعدات مع `disableImageSwipe={true}`.

### د) قائمة "أمهر المشغلين" (سطر 279 سابقاً)
- **فحص كارت المشغلين `OperatorCard`**: تم فحص الكود بالكامل، وتبين أن `OperatorCard` **لا يحتوي على أي سوايبر صور داخلي على الإطلاق** (يحتوي فقط على صورة أفاتار دائرية واحدة وميادين نصية وأزرار اتصال وواتساب).
- **التحويل**: تم تحويل القائمة إلى `HorizontalScrollCard` بعرض كارت `280`، مع إضافة حالة سكيلتون `loadingOp` بعرض `280`، دون حاجة لتمرير `disableImageSwipe` لعدم وجود سوايبر صور في الكارت.

---

## 3. فحص شريط أنواع المعدات (سطر 187)
- **نتيجة الفحص**: شريط التصنيفات في السطر 187 يستخدم:
  ```tsx
  <ScrollView horizontal showsHorizontalScrollIndicator={false} ...>
  ```
- **التشخيص**: هذا الشريط يعاني من نفس علة السحب المقلوب في RTL Fabric على أندرويد لكونه `ScrollView` أصلي.
- **الإجراء المتخذ**: تم تسجيله وتوثيقه هنا، **ولم يتم تعديله الآن** التزاماً بتعليماتك لكونه شبكة تصنيفات ذات أولوية منخفضة في هذا المسار.

---

## 4. تأكيد عدم كسر الشاشات الأخرى لـ `EquipCard`
تم فحص كافة أماكن استخدام `EquipCard` عبر `git grep`:
1. `src/components/profile/my-listings/MyListingCardDispatcher.tsx`: قائمة رأسية — لم يمرر `disableImageSwipe` (تقليب الصور يعمل طبيعياً وبدون أي قيود).
2. `app/(tabs)/index.tsx`: القائمة الأفقية الرئيسية — تم تمرير `disableImageSwipe={true}`.
3. `app/equipment/index.tsx`: القوائم الأفقية الثلاث — تم تمرير `disableImageSwipe={true}`.

---

## 5. الكود الفعلي الكامل قبل وبعد في `app/equipment/index.tsx`

### قبل التعديل (الأسطر 213 - 288):
```tsx
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={s.hList}>
              {latestEquipment.map((item, i) => (
                <EquipCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
              ))}
            </ScrollView>
          </View>

          {loadRest && (
            <>
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للبيع</Text>
                    <Text style={s.sectionSubHeader}>تصفح أفضل المعدات المعروضة للبيع</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=sale')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={[s.hList, saleEquipment.length === 0 && { paddingHorizontal: Spacing.space5 }]}>
                  {saleEquipment.length > 0 ? (
                    saleEquipment.map((item, i) => (
                      <EquipCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
                    ))
                  ) : (
                    <Text style={s.emptyTxt}>لا يوجد معدات للبيع حالياً</Text>
                  )}
                </ScrollView>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للإيجار</Text>
                    <Text style={s.sectionSubHeader}>اكتشف المعدات المتاحة للإيجار اليومي أو الشهري</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=rental')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={[s.hList, rentEquipment.length === 0 && { paddingHorizontal: Spacing.space5 }]}>
                  {rentEquipment.length > 0 ? (
                    rentEquipment.map((item, i) => (
                      <EquipCard key={i} item={item as any} onPress={() => router.push(`/equipment/${item.id}`)} />
                    ))
                  ) : (
                    <Text style={s.emptyTxt}>لا توجد معدات للإيجار حالياً</Text>
                  )}
                </ScrollView>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>أمهر المشغلين</Text>
                    <Text style={s.sectionSubHeader}>أفضل السائقين والمشغلين الخبراء</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/operators/browse')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -Spacing.space5 }} contentContainerStyle={s.hList}>
                  {operators.map((item, i) => (
                    <View key={i} style={{ width: 280 }}>
                      <OperatorCard item={item as any} onPress={() => router.push(`/equipment/operators/${item.id}`)} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
```

### بعد التعديل:
```tsx
            <View style={{ marginHorizontal: -Spacing.space5 }}>
              {loadingEq ? (
                <HorizontalScrollCard
                  key="loading-latest-eq"
                  data={[1, 2, 3]}
                  cardWidth={260}
                  gap={Spacing.space3}
                  paddingEnd={Spacing.space5}
                  keyExtractor={(item) => `skeleton-latest-${item}`}
                  renderItem={() => <SkeletonCard style={{ width: 260 }} />}
                />
              ) : latestEquipment.length > 0 ? (
                <HorizontalScrollCard
                  key="latest-equipment"
                  data={latestEquipment}
                  cardWidth={260}
                  gap={Spacing.space3}
                  paddingEnd={Spacing.space5}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <View style={{ width: 260 }}>
                      <EquipCard
                        item={item as any}
                        onPress={() => router.push(`/equipment/${item.id}`)}
                        disableImageSwipe={true}
                      />
                    </View>
                  )}
                />
              ) : (
                <Text style={s.emptyTxt}>لا توجد معدات مضافة حالياً</Text>
              )}
            </View>
          </View>

          {loadRest && (
            <>
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للبيع</Text>
                    <Text style={s.sectionSubHeader}>تصفح أفضل المعدات المعروضة للبيع</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=sale')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginHorizontal: -Spacing.space5 }}>
                  {loadingSale ? (
                    <HorizontalScrollCard
                      key="loading-sale-eq"
                      data={[1, 2, 3]}
                      cardWidth={260}
                      gap={Spacing.space3}
                      paddingEnd={Spacing.space5}
                      keyExtractor={(item) => `skeleton-sale-${item}`}
                      renderItem={() => <SkeletonCard style={{ width: 260 }} />}
                    />
                  ) : saleEquipment.length > 0 ? (
                    <HorizontalScrollCard
                      key="sale-equipment"
                      data={saleEquipment}
                      cardWidth={260}
                      gap={Spacing.space3}
                      paddingEnd={Spacing.space5}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View style={{ width: 260 }}>
                          <EquipCard
                            item={item as any}
                            onPress={() => router.push(`/equipment/${item.id}`)}
                            disableImageSwipe={true}
                          />
                        </View>
                      )}
                    />
                  ) : (
                    <Text style={s.emptyTxt}>لا يوجد معدات للبيع حالياً</Text>
                  )}
                </View>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>معدات للإيجار</Text>
                    <Text style={s.sectionSubHeader}>اكتشف المعدات المتاحة للإيجار اليومي أو الشهري</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/browse?type=rental')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginHorizontal: -Spacing.space5 }}>
                  {loadingRent ? (
                    <HorizontalScrollCard
                      key="loading-rent-eq"
                      data={[1, 2, 3]}
                      cardWidth={260}
                      gap={Spacing.space3}
                      paddingEnd={Spacing.space5}
                      keyExtractor={(item) => `skeleton-rent-${item}`}
                      renderItem={() => <SkeletonCard style={{ width: 260 }} />}
                    />
                  ) : rentEquipment.length > 0 ? (
                    <HorizontalScrollCard
                      key="rent-equipment"
                      data={rentEquipment}
                      cardWidth={260}
                      gap={Spacing.space3}
                      paddingEnd={Spacing.space5}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <View style={{ width: 260 }}>
                          <EquipCard
                            item={item as any}
                            onPress={() => router.push(`/equipment/${item.id}`)}
                            disableImageSwipe={true}
                          />
                        </View>
                      )}
                    />
                  ) : (
                    <Text style={s.emptyTxt}>لا توجد معدات للإيجار حالياً</Text>
                  )}
                </View>
              </View>

              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.sectionTitleHeader}>أمهر المشغلين</Text>
                    <Text style={s.sectionSubHeader}>أفضل السائقين والمشغلين الخبراء</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push('/equipment/operators/browse')} style={s.seeAllBtn}>
                    <Text style={s.seeAllTxt}>الكل</Text>
                    <Ionicons name="chevron-back" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={{ marginHorizontal: -Spacing.space5 }}>
                  {loadingOp ? (
                    <HorizontalScrollCard
                      key="loading-operators"
                      data={[1, 2, 3]}
                      cardWidth={280}
                      gap={Spacing.space3}
                      paddingEnd={Spacing.space5}
                      keyExtractor={(item) => `skeleton-op-${item}`}
                      renderItem={() => <SkeletonCard style={{ width: 280 }} />}
                    />
                  ) : operators.length > 0 ? (
                    <HorizontalScrollCard<any>
                      key="operators-list"
                      data={operators}
                      cardWidth={280}
                      gap={Spacing.space3}
                      paddingEnd={Spacing.space5}
                      keyExtractor={(item: any) => item.id}
                      renderItem={({ item }: { item: any }) => (
                        <View style={{ width: 280 }}>
                          <OperatorCard
                            item={item}
                            onPress={() => router.push(`/equipment/operators/${item.id}`)}
                          />
                        </View>
                      )}
                    />
                  ) : (
                    <Text style={s.emptyTxt}>لا يوجد مشغلين مسجلين حالياً</Text>
                  )}
                </View>
              </View>
            </>
          )}
```

---

## 6. نتائج الفحوصات واختبارات الوحدة (Raw Verification)

### أ) فحص TypeScript
```bash
npx tsc --noEmit
```
**النتيجة**:
- `app/equipment/index.tsx`: **0 أخطاء TypeScript**.
- كافة مكونات المعدات والسحب خالية تماماً من الأخطاء.

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
Time:        4.241 s
Ran all test suites matching /src\__tests__\\physicalDirection.spec.ts|src\__tests__\\useGestureSwiper.spec.ts/i.
```
