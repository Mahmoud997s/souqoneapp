# تقرير حذف البانرات الترويجية والإعلانية واستكمال تنظيف الكود

**تاريخ التقرير:** 19 سبتمبر 2026  
**نطاق العمل:** حذف البانرات الترويجية والإعلانية غير المستعملة، تنظيف كود الصفحة الرئيسية، حذف الملف المهجور للمعدات، واستكمال تحويل `MyListingSectionSlider` إلى `HorizontalScrollCard`.

---

## 1. قائمة الملفات المحذوفة نهائياً (Deleted Files)

تم حذف الملفات الخمسة التالية نهائياً بعد التحقق من عدم وجود أي استيراد (`import`) لها في أي مكان بالمشروع:

1. `src/components/cars/PromoBanners.tsx` (كروت عروض التأمين وفحص السيارات الترويجية)
2. `src/components/equipment/EquipmentPromoBanners.tsx` (كروت ترويجية لإضافة المعدات والتسجيل كمشغل)
3. `src/components/buses/landing/BusPromoBanner.tsx` (بانر عروض وخصومات الحافلات)
4. `src/components/transport/landing/CarrierCTABanner.tsx` (بانر قديم غير مستخدم لدعوة الناقلين)
5. `src/components/equipment/EquipmentHorizontalList.tsx` (المكون القديم المهجور للمعدات - المعتمد هو `landing/EquipmentHorizontalList.tsx`)

---

## 2. التعديل الفعلي (قبل / بعد) في `app/(tabs)/index.tsx`

تم حذف مصفوفة `PROMO_BANNERS` وسلايدر البانرات والأنيميشن الخاص به وجميع ستايلاته المرتبطة، مع الحفاظ الكامل على بقية أقسام الصفحة الرئيسية:

### قبل (Before):
```tsx
// 1. الاستيراد
import Animated, { interpolate, Extrapolation, useAnimatedStyle, FadeInDown, FadeInRight } from 'react-native-reanimated'

// 2. المصفوفة
const PROMO_BANNERS = [
  { id: '1', title: 'خصم 20% على قطع الغيار', sub: 'استخدم كود خصم SOUQ20', icon: 'pricetag', colors: ['#E8781E', '#FBBF24'] },
  { id: '2', title: 'أضف إعلانك مجاناً', sub: 'لفترة محدودة، اعرض سيارتك بدون رسوم', icon: 'megaphone', colors: ['#3B82F6', '#8B5CF6'] },
]

// 3. JSX
{/* ── BANNERS ── */}
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bannersList} style={{ flexGrow: 0 }}>
  {PROMO_BANNERS.map((banner, index) => (
    <Animated.View key={banner.id} entering={FadeInRight.delay(index * 100).springify()}>
      <TouchableOpacity style={s.bannerCard} activeOpacity={0.9}>
        <LinearGradient colors={banner.colors as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.bannerGradient}>
          <View style={s.bannerTexts}>
            <Text style={s.bannerTitle}>{banner.title}</Text>
            <Text style={s.bannerSub}>{banner.sub}</Text>
          </View>
          <View style={s.bannerIconBgBlur}>
            <Ionicons name={banner.icon as any} size={45} color="rgba(255,255,255,0.3)" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  ))}
</ScrollView>

// 4. Styles
// Banners
bannersList: { paddingHorizontal: Spacing.space5, paddingBottom: Spacing.space5, gap: Spacing.space3 },
bannerCard: { width: SW * 0.85, height: 110, borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
bannerGradient: { flex: 1, padding: Spacing.space4, justifyContent: 'center', position: 'relative' },
bannerTexts: { zIndex: 2, paddingEnd: 40 },
bannerTitle: { fontFamily: 'Almarai_800ExtraBold',  fontSize: 18, color: Colors.white, marginBottom: 4, writingDirection: 'rtl' },
bannerSub: { fontFamily: 'Almarai_400Regular',  fontSize: 13, color: 'rgba(255,255,255,0.9)', writingDirection: 'rtl' },
bannerIconBgBlur: { position: 'absolute', left: -10, bottom: -15, transform: [{ rotate: '-15deg' }], width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
```

### بعد (After):
```tsx
// 1. الاستيراد النظيف
import Animated, { interpolate, Extrapolation, useAnimatedStyle, FadeInDown } from 'react-native-reanimated'

// 2. حذف PROMO_BANNERS بالكامل

// 3. حذف JSX الخاص بالبانرات والانتقال المباشر للأقسام والفئات (CATEGORIES)

// 4. حذف كتل الستايلات الخاصة بالبانرات بالكامل
```

---

## 3. التعديل الفعلي (قبل / بعد) في `src/components/profile/my-listings/MyListingSectionSlider.tsx`

تم تحويل السلايدر من `FlatList horizontal` تقليدي إلى `HorizontalScrollCard` مع دعم حالة التحميل `SkeletonCard` وتضمين كارت "عرض الكل" تلقائياً:

### قبل (Before):
```tsx
import { FlatList, ... } from 'react-native'
import { SeeAllHorizontalCard } from '../../ui/SeeAllHorizontalCard'

export function MyListingSectionSlider({ ... }) {
  if (!items || items.length === 0) return null

  return (
    <View style={s.section}>
      {/* Header */}
      ...
      {/* ── Horizontal List ── */}
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `${item.entityType}-${item.id}`}
        contentContainerStyle={s.sliderContent}
        ListFooterComponent={
          items.length > 0 ? (
            <View style={{ width: 170, marginStart: Spacing.space3 }}>
              <SeeAllHorizontalCard
                onPress={() => onSelectCategory(config.categoryId)}
                title="عرض الكل"
                subTitle={`جميع إعلانات ${config.title}`}
                cardWidth={170}
              />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <MyListingCardDispatcher ... fullWidth={false} />
        )}
      />
    </View>
  )
}
```

### بعد (After):
```tsx
import { Dimensions, ... } from 'react-native'
import { HorizontalScrollCard } from '../../ui/HorizontalScrollCard'
import { SkeletonCard } from '../../ui/SkeletonCard'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = SCREEN_WIDTH * 0.6
const GAP = Spacing.space3
const PADDING_END = Spacing.space5

export function MyListingSectionSlider({
  config,
  items,
  isLoading = false,
  ...
}: MyListingSectionSliderProps) {
  if (!isLoading && (!items || items.length === 0)) return null

  return (
    <View style={s.section}>
      {/* Header */}
      ...
      {/* ── Horizontal List ── */}
      {isLoading ? (
        <HorizontalScrollCard
          key="loading-skeleton"
          data={[1, 2, 3]}
          cardWidth={CARD_WIDTH}
          gap={GAP}
          paddingEnd={PADDING_END}
          keyExtractor={(item) => String(item)}
          renderItem={() => (
            <SkeletonCard style={{ width: CARD_WIDTH, height: 180 }} />
          )}
        />
      ) : (
        <HorizontalScrollCard
          key="loaded-cards"
          data={items}
          cardWidth={CARD_WIDTH}
          gap={GAP}
          paddingEnd={PADDING_END}
          keyExtractor={(item) => `${item.entityType}-${item.id}`}
          onSeeAll={() => onSelectCategory(config.categoryId)}
          seeAllTitle="عرض الكل"
          seeAllSubtitle={`جميع إعلانات ${config.title}`}
          renderItem={({ item }) => (
            <MyListingCardDispatcher
              item={item}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onCancelDeletionRequest={onCancelDeletionRequest}
              isEditSupported={isEditSupported(item.entityType)}
              fullWidth={false}
            />
          )}
        />
      )}
    </View>
  )
}
```

---

## 4. المكونات المستثناة المحفوظة (Untouched Functional Components)

تم الإبقاء عليها بالكامل دون أي تعديل:
- `ActionBanner.tsx` و `SectionFooterAction.tsx`
- `OperatorSmartBanner.tsx`
- `VerificationBanner.tsx`
- `ProfilePremiumBanner.tsx`
- `SecurityInfoBanner.tsx`
- `ListingBanner.tsx` و `NegotiationBanner.tsx`
- شارات الحالة الوظيفية (`pendingBanner`, `soldBanner`, `draftBanner`)
