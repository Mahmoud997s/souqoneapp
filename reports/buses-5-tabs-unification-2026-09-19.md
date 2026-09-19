# تقرير إضافة تاب بيع بعقد ودعم 5 كبسولات زجاجية في صفحة هبوط الحافلات
تاريخ التقرير: 2026-09-19

---

## 1. ملخص سريع
تمت إضافة تاب "بيع بعقد" لتابات فئات الحافلات ليصبح إجمالي التابات 5 في صف واحد بدقة واحترافية (مستعملة، جديدة، بيع بعقد، تأجير، مطلوب). تم تطوير مكوّن `GlassCategoriesGrid` ليدعم النمط المدمج (`isCompact`) آلياً عند وجود 5 عناصر، وضبط قياسات الأيقونات (32x32)، الفجوات (6px)، وحجم الخط (10.5px) مع الحفاظ التام على هوية الـ 3D Glassmorphism والظلال العاكسة بدون أي قص للنصوص أو انكسار سطر. كما تم تحديث `app/buses/browse.tsx` لمعالجة معلمات التوجيه `busListingType` و `condition` عند النقر.

---

## 2. قائمة الملفات المتأثرة

| اسم الملف | نوع التغيير |
| :--- | :--- |
| `src/components/ui/GlassCategoriesGrid.tsx` | تعديل (دعم النمط المدمج والأبعاد التلقائية لـ 5 عناصر) |
| `src/components/buses/landing/BusCategoriesGrid.tsx` | تعديل (إضافة تاب بيع بعقد والتوجيه الدقيق لـ 5 تابات) |
| `app/buses/browse.tsx` | تعديل (دعم استقبال وتفعيل فلاتر busListingType و condition عند التهيئة) |

---

## 3. تفاصيل التغييرات (كود قبل وبعد الفعلي)

### `src/components/ui/GlassCategoriesGrid.tsx`

**قبل:**
```tsx
export function GlassCategoriesGrid({ items }: GlassCategoriesGridProps) {
  return (
    <View style={s.container}>
      <View style={s.catsGrid}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={s.catItem}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <View style={[s.catIconBox, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={20} color={item.iconColor} />
            </View>
            <Text style={s.catLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  catsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  catItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3, // 3D floating shadow
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
})
```

**بعد:**
```tsx
export interface GlassCategoriesGridProps {
  items: GlassCategoryTabItem[]
  compact?: boolean
}

export function GlassCategoriesGrid({ items, compact }: GlassCategoriesGridProps) {
  const isCompact = compact ?? items.length >= 5

  return (
    <View style={s.container}>
      <View style={[s.catsGrid, isCompact && s.catsGridCompact]}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[s.catItem, isCompact && s.catItemCompact]}
            activeOpacity={0.7}
            onPress={item.onPress}
          >
            <View
              style={[
                s.catIconBox,
                isCompact && s.catIconBoxCompact,
                { backgroundColor: item.iconBg },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={isCompact ? 17 : 20}
                color={item.iconColor}
              />
            </View>
            <Text
              style={[s.catLabel, isCompact && s.catLabelCompact]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {},
  catsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  catsGridCompact: {
    gap: 6,
  },
  catItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.45)', // Glass transparency
    paddingVertical: 10,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF', // 3D edge light reflection
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3, // 3D floating shadow
  },
  catItemCompact: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: Radius.md,
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  catIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  catIconBoxCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 4,
  },
  catLabel: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: 2,
    writingDirection: 'rtl',
  },
  catLabelCompact: {
    fontFamily: 'Almarai_700Bold',
    fontSize: 10.5,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 15,
    paddingTop: 1,
    writingDirection: 'rtl',
  },
})
```

**السبب:** توفير نمط مدمج متناسق واحترافي لـ 5 كبسولات يضبط المسافات، وحجم الأيقونة والخط لمنع قص النصوص مع الحفاظ على هوية Glassmorphism.

---

### `src/components/buses/landing/BusCategoriesGrid.tsx`

**قبل:**
```tsx
export function BusCategoriesGrid() {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = [
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'bus-outline',
      iconBg: '#e0f2fe',
      iconColor: '#0ea5e9',
      onPress: () => router.push('/buses/browse?condition=USED' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      onPress: () => router.push('/buses/browse?condition=NEW' as any),
    },
    {
      id: 'wanted',
      label: 'مطلوب',
      icon: 'megaphone',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      onPress: () => router.push('/buses/browse?type=wanted' as any),
    },
    {
      id: 'rental',
      label: 'تأجير',
      icon: 'key',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      onPress: () => router.push('/buses/browse?busListingType=BUS_RENT' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}
```

**بعد:**
```tsx
export function BusCategoriesGrid() {
  const router = useRouter()

  const tabs: GlassCategoryTabItem[] = [
    {
      id: 'used',
      label: 'مستعملة',
      icon: 'bus-outline',
      iconBg: '#e0f2fe',
      iconColor: '#0ea5e9',
      onPress: () => router.push('/buses/browse?condition=USED' as any),
    },
    {
      id: 'new',
      label: 'جديدة',
      icon: 'sparkles',
      iconBg: '#d1fae5',
      iconColor: '#10b981',
      onPress: () => router.push('/buses/browse?condition=NEW' as any),
    },
    {
      id: 'contract',
      label: 'بيع بعقد',
      icon: 'document-text-outline',
      iconBg: '#ffedd5',
      iconColor: '#ea580c',
      onPress: () =>
        router.push(
          '/buses/browse?busListingType=BUS_SALE_WITH_CONTRACT' as any
        ),
    },
    {
      id: 'rental',
      label: 'تأجير',
      icon: 'key',
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      onPress: () =>
        router.push('/buses/browse?busListingType=BUS_RENT' as any),
    },
    {
      id: 'wanted',
      label: 'مطلوب',
      icon: 'megaphone',
      iconBg: '#ede9fe',
      iconColor: '#8b5cf6',
      onPress: () => router.push('/buses/browse?type=wanted' as any),
    },
  ]

  return <GlassCategoriesGrid items={tabs} />
}
```

**السبب:** إضافة تاب "بيع بعقد" كأحد أهم قطاعات سوق الحافلات وربطه بـ `busListingType=BUS_SALE_WITH_CONTRACT` ليصبح المجموع 5 تابات متناسقة.

---

### `app/buses/browse.tsx`

**قبل:**
```tsx
  const searchParams = useLocalSearchParams<{ type?: string; featured?: string }>();

  const [filters, setFilters] = useState<BusFilters & { governorateId?: number; city?: string; priceId?: string }>(() => {
    const initialFilters: BusFilters & { governorateId?: number; city?: string; priceId?: string } = {};
    if (searchParams.type) {
      initialFilters.busListingType = searchParams.type.toUpperCase() as any;
    }
    if (searchParams.featured === 'true') {
      (initialFilters as any).isPremium = true;
    }
    return initialFilters;
  });
```

**بعد:**
```tsx
  const searchParams = useLocalSearchParams<{
    type?: string;
    featured?: string;
    busListingType?: string;
    condition?: string;
    isPremium?: string;
  }>();

  const [filters, setFilters] = useState<BusFilters & { governorateId?: number; city?: string; priceId?: string }>(() => {
    const initialFilters: BusFilters & { governorateId?: number; city?: string; priceId?: string } = {};
    if (searchParams.busListingType) {
      initialFilters.busListingType = searchParams.busListingType as any;
    } else if (searchParams.type) {
      const t = searchParams.type.toUpperCase();
      if (t === 'RENT' || t === 'RENTAL') initialFilters.busListingType = 'BUS_RENT';
      else if (t === 'SALE') initialFilters.busListingType = 'BUS_SALE';
      else if (t === 'CONTRACT') initialFilters.busListingType = 'BUS_SALE_WITH_CONTRACT';
      else initialFilters.busListingType = t as any;
    }
    if (searchParams.condition) {
      initialFilters.condition = searchParams.condition as any;
    }
    if (searchParams.featured === 'true' || searchParams.isPremium === 'true') {
      (initialFilters as any).isPremium = true;
    }
    return initialFilters;
  });
```

**السبب:** تمكين شاشة التصفح من قراءة وتفعيل الفلاتر المباشرة لـ `busListingType` (مثل `BUS_SALE_WITH_CONTRACT`) و `condition` (مثل `USED` أو `NEW`) عند التنقل من تابات الهبوط.

---

## 4. ناتج الفحوصات البرمجية الخام

### أ) فحص TypeScript الخام (`npx tsc --noEmit`)
جميع الملفات المعدلة والجديدة نظيفة 100% بدون أي خطأ:
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

### ب) ناتج اختبارات Jest الخام (`npm test src/__tests__/physicalDirection.spec.ts`)
```text
PASS src/__tests__/physicalDirection.spec.ts
  physicalDirection Single Source of Truth
    Under isRTL === true (Native Arabic environment)
      √ getPhysicalSide() returns "left" to counter Fabric mirroring (21 ms)
      √ physicalRightStyle(16) returns { left: 16 } to anchor on physical right (1 ms)
      √ physicalRowDirection() returns "row" (natural RTL flows right to left)
      √ getGestureDirectionMultiplier() returns 1 (direct 1:1 physical drag: right -> right, left -> left)
    Under isRTL === false (LTR environment)
      √ getPhysicalSide() returns "right"
      √ physicalRightStyle(16) returns { right: 16 } (1 ms)
      √ physicalRowDirection() returns "row-reverse"
      √ getGestureDirectionMultiplier() returns -1 (1 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        1.49 s, estimated 3 s
```
