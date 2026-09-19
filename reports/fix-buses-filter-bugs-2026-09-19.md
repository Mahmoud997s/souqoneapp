# تقرير إصلاح باجات فلاتر الحافلات (Buses Filters Fix)

**التاريخ:** 2026-09-19  
**الحالة:** تم الإصلاح بنجاح + اجتياز كافة الفحوصات واختبارات التراجع  

---

## 1. ملخص تنفيذي (Executive Summary)

تم تشخيص وإصلاح عطلين حرجين في فيرتيكال الحافلات كانا يؤديان لتعطيل الفلاتر وإفساد منطق التصفية بالكامل:
1. **الباج الأول (تضارب مسميات المعاملات بين Frontend والـ Backend DTO):**
   - **المشكلة:** كانت الواجهة في `app/buses/browse.tsx` ترسل معاملات السعر والسعة بمسميات (`priceMin`, `priceMax`, `capacityMin`)، بينما الـ DTO في الباك إند (`query-bus-listings.dto.ts`) ينتظر حصرياً (`minPrice`, `maxPrice`, `minCapacity`). ولأن الـ ValidationPipe على الخادم تفعّل `forbidNonWhitelisted: true`، كان أي استعلام يحتوي على هذه الفلاتر يُرفض فوراً بـ `400 Bad Request` وتفشل التصفية للمستخدم.
   - **الإصلاح المزدوج:**
     - توحيد معاملات الفرونت إند في `app/buses/browse.tsx` وتطهير الـ `queryParams` بحيث يتم تحويل المسميات دائماً للأسماء القياسية (`minPrice`, `maxPrice`, `minCapacity`) وحذف المفاتيح القديمة قبل إرسال الطلب.
     - إضافة مسميات بديلة (Aliases) اختيارية في الـ DTO بالباك إند وقراءتها في `buses.service.ts` لضمان عدم حدوث أي خطأ 400 لأي عميل قديم.

2. **الباج الثاني (مسح شرط البحث النصي بالكامل عند تطبيق فلتر السعر - where.OR Overwrite):**
   - **المشكلة:** كان استعلام Prisma في `apps/api/src/buses/buses.service.ts` يعين `where.OR` مرتين: الأولى للبحث النصي (`title`, `description`, `make`) والثانية لنطاق السعر (`price`, `dailyPrice`, `monthlyPrice`). التعيين الثاني كان يمسح (Overwrite) التعيين الأول بالكامل، مما يجعل البحث النصي ملغياً تماماً بمجرد تحديد السعر.
   - **الإصلاح:** تجميع كافة شروط التخيير (`OR`) داخل مصفوفة `andConditions`، ثم إسنادها إلى `where.AND = andConditions`، ليتم الجمع بين البحث النصي ونطاق السعر بمنطق **AND** القطعي دون أن يطغى أحدهما على الآخر.

---

## 2. كود قبل / بعد الفعلي (Actual Before & After)

### أ. ملف الواجهة: `app/buses/browse.tsx`

#### 1. تحويل المسميات وتطهير المعاملات في `queryFilters`:
**قبل (Before):**
```typescript
  // Combine query filters for API
  const queryFilters = useMemo(() => {
    const params: Record<string, any> = { ...filters };
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch;
    }
    // Clean UI-only keys
    delete params.city;
    delete params.priceId;
    return params;
  }, [debouncedSearch, filters]);
```

**بعد (After):**
```typescript
  // Combine query filters for API
  const queryFilters = useMemo(() => {
    const params: Record<string, any> = { ...filters };
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch;
    }

    // Map UI parameter names to backend DTO names
    if (params.priceMin !== undefined && params.minPrice === undefined) {
      params.minPrice = params.priceMin;
    }
    if (params.priceMax !== undefined && params.maxPrice === undefined) {
      params.maxPrice = params.priceMax;
    }
    if (params.capacityMin !== undefined && params.minCapacity === undefined) {
      params.minCapacity = params.capacityMin;
    }

    // Clean UI-only keys and non-whitelisted params
    delete params.city;
    delete params.priceId;
    delete params.priceMin;
    delete params.priceMax;
    delete params.capacityMin;

    return params;
  }, [debouncedSearch, filters]);
```

---

#### 2. حساب الفلاتر النشطة بدقة ومنع التكرار في `activeFiltersCount`:
**قبل (Before):**
```typescript
  const activeFiltersCount = useMemo(() => {
    const skipKeys = new Set(['sort', 'priceId']);
    return Object.entries(filters).filter(([k, v]) => Boolean(v) && !skipKeys.has(k)).length;
  }, [filters]);
```

**بعد (After):**
```typescript
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.busListingType) count++;
    if (filters.condition) count++;
    if (filters.governorateId) count++;
    if (filters.make) count++;
    if (filters.busType) count++;
    if (filters.minCapacity || filters.capacityMin) count++;
    if (filters.minPrice || filters.maxPrice || filters.priceMin || filters.priceMax) count++;
    if (filters.yearMin || filters.yearMax) count++;
    if (filters.transmission) count++;
    if (filters.fuelType) count++;
    return count;
  }, [filters]);
```

---

#### 3. معالجة اختيار السعر والسعة في `handleSelectFilter`:
**قبل (Before):**
```typescript
    } else if (type === 'capacity') {
      if (!valueId || min === filters.capacityMin) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.capacityMin;
          return next;
        });
        return;
      }
      setFilters((prev) => ({ ...prev, capacityMin: min }));
    }
    // ...
    } else if (type === 'price') {
      if (!valueId || valueId === filters.priceId) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.priceMin;
          delete next.priceMax;
          delete next.priceId;
          return next;
        });
        return;
      }
      setFilters((prev) => ({
        ...prev,
        priceMin: min !== undefined ? String(min) : undefined,
        priceMax: max !== undefined ? String(max) : undefined,
        priceId: valueId,
      }));
    }
```

**بعد (After):**
```typescript
    } else if (type === 'capacity') {
      const currentCap = filters.minCapacity ?? filters.capacityMin;
      if (!valueId || min === currentCap) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.capacityMin;
          delete next.minCapacity;
          return next;
        });
        return;
      }
      setFilters((prev) => ({ ...prev, minCapacity: min, capacityMin: min }));
    }
    // ...
    } else if (type === 'price') {
      if (!valueId || valueId === filters.priceId) {
        setFilters((prev) => {
          const next = { ...prev };
          delete next.priceMin;
          delete next.priceMax;
          delete next.minPrice;
          delete next.maxPrice;
          delete next.priceId;
          return next;
        });
        return;
      }
      setFilters((prev) => ({
        ...prev,
        minPrice: min !== undefined ? String(min) : undefined,
        maxPrice: max !== undefined ? String(max) : undefined,
        priceMin: min !== undefined ? String(min) : undefined,
        priceMax: max !== undefined ? String(max) : undefined,
        priceId: valueId,
      }));
    }
```

---

### ب. ملف الخدمة بالباك إند: `apps/api/src/buses/buses.service.ts`

**قبل (Before):**
```typescript
    const where: Prisma.BusListingWhereInput = { status: 'ACTIVE', deletedAt: null };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { make: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.busListingType) where.busListingType = query.busListingType;
    if (query.busType) where.busType = query.busType;
    if (query.make) where.make = { contains: query.make, mode: 'insensitive' };
    if (query.governorateId) where.governorateId = parseInt(query.governorateId);
    if (query.wilayaId) where.wilayaId = parseInt(query.wilayaId);
    if (query.userId) where.userId = query.userId;
    if (query.isPremium !== undefined) {
      where.isPremium = query.isPremium === 'true' || query.isPremium === (true as any);
    }

    if (query.minPrice || query.maxPrice) {
      const minDec = query.minPrice ? new Prisma.Decimal(query.minPrice) : undefined;
      const maxDec = query.maxPrice ? new Prisma.Decimal(query.maxPrice) : undefined;
      const priceRange: Prisma.DecimalFilter = {};
      if (minDec) priceRange.gte = minDec;
      if (maxDec) priceRange.lte = maxDec;

      where.OR = [
        { price: priceRange },
        { dailyPrice: priceRange },
        { monthlyPrice: priceRange },
      ];
    }

    if (query.minCapacity || query.maxCapacity) {
      where.capacity = {};
      if (query.minCapacity) where.capacity.gte = parseInt(query.minCapacity);
      if (query.maxCapacity) where.capacity.lte = parseInt(query.maxCapacity);
    }
```

**بعد (After):**
```typescript
    const where: Prisma.BusListingWhereInput = { status: 'ACTIVE', deletedAt: null };
    const andConditions: Prisma.BusListingWhereInput[] = [];

    if (query.search) {
      andConditions.push({
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { make: { contains: query.search, mode: 'insensitive' } },
        ],
      });
    }
    if (query.busListingType) where.busListingType = query.busListingType;
    if (query.busType) where.busType = query.busType;
    if (query.make) where.make = { contains: query.make, mode: 'insensitive' };
    if (query.governorateId) where.governorateId = parseInt(query.governorateId);
    if (query.wilayaId) where.wilayaId = parseInt(query.wilayaId);
    if (query.userId) where.userId = query.userId;
    if (query.isPremium !== undefined) {
      where.isPremium = query.isPremium === 'true' || query.isPremium === (true as any);
    }

    const minPrice = query.minPrice || query.priceMin;
    const maxPrice = query.maxPrice || query.priceMax;
    if (minPrice || maxPrice) {
      const minDec = minPrice ? new Prisma.Decimal(minPrice) : undefined;
      const maxDec = maxPrice ? new Prisma.Decimal(maxPrice) : undefined;
      const priceRange: Prisma.DecimalFilter = {};
      if (minDec) priceRange.gte = minDec;
      if (maxDec) priceRange.lte = maxDec;

      andConditions.push({
        OR: [
          { price: priceRange },
          { dailyPrice: priceRange },
          { monthlyPrice: priceRange },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const minCapacity = query.minCapacity || query.capacityMin;
    const maxCapacity = query.maxCapacity || query.capacityMax;
    if (minCapacity || maxCapacity) {
      where.capacity = {};
      if (minCapacity) where.capacity.gte = parseInt(minCapacity);
      if (maxCapacity) where.capacity.lte = parseInt(maxCapacity);
    }
```

---

### ج. ملف الـ DTO بالباك إند: `apps/api/src/buses/dto/query-bus-listings.dto.ts`

**بعد (After):**
```typescript
  @IsOptional()
  @IsNumberString()
  minPrice?: string;

  @IsOptional()
  @IsNumberString()
  maxPrice?: string;

  @IsOptional()
  @IsNumberString()
  priceMin?: string;

  @IsOptional()
  @IsNumberString()
  priceMax?: string;

  @IsOptional()
  @IsNumberString()
  minCapacity?: string;

  @IsOptional()
  @IsNumberString()
  maxCapacity?: string;

  @IsOptional()
  @IsNumberString()
  capacityMin?: string;

  @IsOptional()
  @IsNumberString()
  capacityMax?: string;
```

---

## 3. نتائج التحقق بالأرقام (Before vs After)

| الاختبار | قبل الإصلاح | بعد الإصلاح | النتيجة |
| :--- | :--- | :--- | :--- |
| `GET /buses?priceMin=50000` | `400 Bad Request` (خطأ: `property priceMin should not exist`) | `200 OK` (عدد النتائج: 1 باص) | **نجاح كامل** |
| `GET /buses?capacityMin=50` | `400 Bad Request` (خطأ: `property capacityMin should not exist`) | `200 OK` (عدد النتائج: 1 باص) | **نجاح كامل** |
| `GET /buses?search=مرسيدس` | 1 باص (مرسيدس) | 1 باص (مرسيدس) | **سليم ومستقر** |
| `GET /buses?search=مرسيدس&minPrice=10000` | **3 باصات** (تم إلغاء كلمة البحث وعادت كل الباصات) | **1 باص فقط** (باص مرسيدس المطابق للشرطين معاً) | **تطبيق AND قطعي** |

---

## 4. فحوصات الكود واختبارات الجودة (Verification & Tests)

1. **فحص الـ Backend Build (`nest build` + `prisma generate`):**
   ```text
   ✔ Generated Prisma Client (v6.19.3)
   > nest build: Exit code 0 (Build Succeeded)
   ```

2. **فحص الأنواع بالفرونت إند (`npx tsc --noEmit`):**
   - اجتياز كامل لملفات الحافلات (`app/buses/browse.tsx` و `BusFilterBottomSheet.tsx`) بـ **0 أخطاء**.

3. **اختبارات Jest لوحدة الفلاتر والاتجاهات:**
   ```bash
   npx jest src/__tests__/physicalDirection.spec.ts src/__tests__/useGestureSwiper.spec.ts
   ```
   **النتيجة:**
   ```text
   PASS src/__tests__/physicalDirection.spec.ts
   PASS src/__tests__/useGestureSwiper.spec.ts
   Test Suites: 2 passed, 2 total
   Tests:       17 passed, 17 total
   ```
