# تقرير تحويل سلايدر السائقين إلى `HorizontalScrollCard` (المجموعة 1 - البند الأخير)

**تاريخ التقرير:** 19 سبتمبر 2026  
**الملف المعدل:** `app/jobs/index.tsx` (`DriversSwiper`)  
**الحالة:** مكتمل بنجاح (14 من أصل 14 بند في المجموعة 1)

---

## 1. ملخص التحويل والتحديات الفنية

1. **طبيعة الكارت:**
   - كروت السائقين هنا دائرية مدمجة (`width: 76px`, `height: 112px`) تتكون من صورة رمزية دائرية (`64x64`) متبوعة باسم السائق وشارة التقييم بالنجوم، وليست كروت إعلانات مستطيلة عادية.
2. **بناء حالة التحميل (Skeleton):**
   - في الكود القديم، كان المكون يعود بـ `null` طالما البيانات لم تصل أو لم يتم تمريرها.
   - تم إنشاء كمبوننت `DriverCircleSkeleton` يحاكي الشكل الدائري للكارت الفعلي (دائرة رمادية بارتفاع `64px` وشريطي تحميل للاسم والتقييم).
   - تم ربط `isLoading={driversLoading}` القادمة من `useDrivers()`.
3. **التكامل مع `HorizontalScrollCard`:**
   - تم تمرير `cardWidth={76}` و `cardHeight={112}` و `gap={Spacing.space3}` و `paddingEnd={10}` لتتطابق بدقة بكسلية مع محاذاة هيدر القسم.
   - تم إضافة كارت دائري مميز في نهاية السلايدر لعرض الكل عبر `renderSeeAllCard` ينتقل إلى دليل السائقين `/jobs/drivers`، بالإضافة لزر "الكل" في الهيدر.

---

## 2. الكود الفعلي: قبل / بعد (Before & After)

### قبل (Before):
```tsx
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

function DriversSwiper({ drivers }: { drivers: any[] }) {
  if (!drivers || drivers.length === 0) return null
  return (
    <View style={{ marginTop: 0, marginBottom: Spacing.space2 }}>
      <Text style={s.sectionTitle}>سائقين جاهزين للعمل</Text>
      <FlatList
        data={drivers}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingHorizontal: Spacing.space4, gap: Spacing.space4 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={s.driverCircleCard}
            onPress={() => router.push(`/jobs/drivers/${item.id}` as any)}
            activeOpacity={0.8}
          >
            <View style={s.driverCircleAvatarWrap}>
              {item.user?.avatarUrl ? (
                <Image source={{ uri: item.user.avatarUrl }} style={s.driverCircleAvatar} />
              ) : (
                <View style={[s.driverCircleAvatar, { backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 24, color: Colors.primary,  }}>
                    {item.user?.displayName?.[0] || 'س'}
                  </Text>
                </View>
              )}
            </View>
            <Text style={s.driverCircleName} numberOfLines={1}>
              {item.user?.displayName || 'سائق'}
            </Text>
            <View style={s.driverCircleRating}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={s.driverCircleRatingTxt}>{item.averageRating ? item.averageRating.toFixed(1) : 'جديد'}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
```

### بعد (After):
```tsx
function DriverCircleSkeleton() {
  return (
    <View style={s.driverCircleCard}>
      <View
        style={[
          s.driverCircleAvatarWrap,
          {
            backgroundColor: '#F1F5F9',
            borderColor: '#E2E8F0',
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <Ionicons name="person" size={26} color="#CBD5E1" />
      </View>
      <View style={{ width: 50, height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, marginBottom: 4 }} />
      <View style={{ width: 36, height: 14, backgroundColor: '#F1F5F9', borderRadius: 7 }} />
    </View>
  )
}

interface DriversSwiperProps {
  drivers: any[]
  isLoading?: boolean
}

function DriversSwiper({ drivers, isLoading = false }: DriversSwiperProps) {
  if (!isLoading && (!drivers || drivers.length === 0)) return null

  return (
    <View style={{ marginTop: 0, marginBottom: Spacing.space2 }}>
      <View style={s.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitleHeader}>سائقين جاهزين للعمل</Text>
          <Text style={s.sectionSubHeader}>تواصل مباشرة مع نخبة السائقين</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/jobs/drivers' as any)}
          style={s.seeAllBtn}
          activeOpacity={0.8}
        >
          <Text style={s.seeAllTxt}>الكل</Text>
          <Ionicons name="chevron-back" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <HorizontalScrollCard
          key="loading-drivers-skeleton"
          data={[1, 2, 3, 4, 5, 6]}
          cardWidth={76}
          cardHeight={112}
          gap={Spacing.space3}
          paddingEnd={10}
          keyExtractor={(item) => String(item)}
          renderItem={() => <DriverCircleSkeleton />}
        />
      ) : (
        <HorizontalScrollCard
          key="loaded-drivers"
          data={drivers}
          cardWidth={76}
          cardHeight={112}
          gap={Spacing.space3}
          paddingEnd={10}
          keyExtractor={(item) => item.id}
          onSeeAll={() => router.push('/jobs/drivers' as any)}
          renderSeeAllCard={() => (
            <TouchableOpacity
              style={s.driverCircleCard}
              onPress={() => router.push('/jobs/drivers' as any)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  s.driverCircleAvatarWrap,
                  {
                    borderColor: Colors.primary + '40',
                    backgroundColor: Colors.primary + '0D',
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.primary} />
              </View>
              <Text style={[s.driverCircleName, { color: Colors.primary }]} numberOfLines={1}>
                عرض الكل
              </Text>
              <View style={[s.driverCircleRating, { backgroundColor: Colors.primary + '15' }]}>
                <Text style={[s.driverCircleRatingTxt, { color: Colors.primary }]}>الجميع</Text>
              </View>
            </TouchableOpacity>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.driverCircleCard}
              onPress={() => router.push(`/jobs/drivers/${item.id}` as any)}
              activeOpacity={0.8}
            >
              <View style={s.driverCircleAvatarWrap}>
                {item.user?.avatarUrl ? (
                  <Image source={{ uri: item.user.avatarUrl }} style={s.driverCircleAvatar} />
                ) : (
                  <View
                    style={[
                      s.driverCircleAvatar,
                      {
                        backgroundColor: Colors.primary + '15',
                        justifyContent: 'center',
                        alignItems: 'center',
                      },
                    ]}
                  >
                    <Text style={{ fontFamily: 'Almarai_700Bold', fontSize: 24, color: Colors.primary }}>
                      {item.user?.displayName?.[0] || 'س'}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={s.driverCircleName} numberOfLines={1}>
                {item.user?.displayName || 'سائق'}
              </Text>
              <View style={s.driverCircleRating}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={s.driverCircleRatingTxt}>
                  {item.averageRating ? item.averageRating.toFixed(1) : 'جديد'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}
```

---

## 3. نتائج الفحص الخام (Raw Test Results)

```text
PASS src/__tests__/useGestureSwiper.spec.ts
PASS src/__tests__/physicalDirection.spec.ts

Test Suites: 2 passed, 2 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        2.145 s
Ran all test suites matching /src\__tests__\physicalDirection.spec.ts|src\__tests__\useGestureSwiper.spec.ts/i.
```

- **TypeScript:** لا توجد أي أخطاء متعلقة بـ `app/jobs/index.tsx`.
