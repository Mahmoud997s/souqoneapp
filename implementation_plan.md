# خطة تطوير قسم الوظائف — Mobile App (Full Web Parity)

> **الهدف:** رفع قسم الوظائف في الـ React Native App لمستوى الـ Web App بالكامل.
> **المرجع الأساسي:** [`JOBS_SYSTEM_ARCHITECTURE.md`](file:///c:/Users/DELL/Desktop/m/docs/JOBS_SYSTEM_ARCHITECTURE.md) + [`jobs-feature-inventory.md`](file:///c:/Users/DELL/Desktop/m/docs/jobs-feature-inventory.md) + [`jobs-user-flows.md`](file:///c:/Users/DELL/Desktop/m/docs/jobs-user-flows.md)

---

## User Review Required

> [!IMPORTANT]
> **قواعد الحفاظ على الكود الحالي:**
> لن يتم تغيير أي `StyleSheet.create` موجود، ولن يتغير أي `fontFamily` أو `writingDirection: 'rtl'`، ولن يتغير أي مسار توجيه حالي (`app/jobs/index.tsx`, `[id].tsx`, `apply/[id].tsx`). كل ما سيتم هو الإضافة فقط.

> [!IMPORTANT]
> **التحقق (Verification) Admin-side:**
> دور الـ Admin لمراجعة مستندات التحقق من السائقين موجود فقط في الـ Web Dashboard. في تطبيق الموبايل، السائق يستطيع فقط **رفع** المستندات وعرض الحالة، ولا توجد شاشة Admin للموبايل في هذا البلان.

---

## الفيتشرز التسعة المستهدفة

من الـ [Feature Inventory](file:///c:/Users/DELL/Desktop/m/docs/jobs-feature-inventory.md) تم تحديد 9 فيتشرز كاملة:

| رقم | الفيتشر | الحالة في الموبايل | الهدف |
|-----|---------|-------------------|-------|
| F-1 | **Onboarding (Driver/Employer Profile)** | ❌ غائب | إضافة كاملة |
| F-2 | **تصفح الوظائف مع فلاتر متقدمة** | ⚠️ جزئي (فلاتر بسيطة محلية) | تطوير + ربط بالـ API |
| F-3 | **قسم دليل السائقين (Driver Directory)** | ❌ غائب | إضافة كاملة |
| F-4 | **تفاصيل الوظيفة + نموذج التقديم المتقدم** | ⚠️ جزئي (بدون role-check) | تطوير + business rules |
| F-5 | **إنشاء وظيفة (Wizard 4 خطوات)** | ❌ غائب (يعتمد على web) | إضافة كاملة |
| F-6 | **Dashboard (My Posts + My Proposals)** | ❌ غائب | إضافة كاملة |
| F-7 | **إدارة الطلبات (قبول/رفض/سحب)** | ❌ غائب | إضافة كاملة |
| F-8 | **تحقق السائق (Verification Flow)** | ❌ غائب | إضافة كاملة |
| F-9 | **ملف السائق العام (Driver Public Profile)** | ❌ غائب | إضافة كاملة |

---

## استراتيجية المكونات القابلة لإعادة الاستخدام ومنع التكرار (DRY Architecture)

لمنع تكرار الكود وتبسيطه وصيانته بسهولة، سنقوم بإنشاء المكونات والوظائف المشتركة كعناصر عامة قابلة لإعادة الاستخدام في كامل قسم الوظائف:

### 1. المكونات البصرية المشتركة (Shared UI Components)
سنقوم ببناء المكونات التالية في مجلد `src/components/jobs/` لتستخدم في شاشات وكروت متعددة:

* **`RatingBadges.tsx` (شارة التقييم والمقاييس):**
  * **المدخلات (Props):** `rating`, `completionRate`, `responseTime`, `completedJobs`, `size`
  * **أماكن الاستخدام:** `JobCard` (في حال عرض الخدمة), `DriverCard` (دليل السائقين), `ProposalCard` (قائمة المتقدمين)، وشاشة `DriverProfile` (الملف العام).
  * **الهدف:** توحيد طريقة عرض وحساب نسب التقييم والأرقام لمنع أي تباين بصري.
* **`LicenseChips.tsx` (قائمة وسوم الرخص):**
  * **المدخلات (Props):** `licenseTypes` (مصفوفة)
  * **أماكن الاستخدام:** `JobCard`, `DriverCard`, شاشة `DriverProfile` العامة، وشاشة الـ `Onboarding`.
  * **الهدف:** توحيد ستايل الشرائح الملونة (Chips) التي تمثل أنواع رخص القيادة ورموزها التعبيرية.
* **`JobBadge.tsx` (بادج نوع الوظيفة):**
  * **المدخلات (Props):** `type` ('HIRING' | 'OFFERING')
  * **أماكن الاستخدام:** `JobCard` وشاشة تفاصيل الوظيفة `[id].tsx`.
* **`StatusPill.tsx` (حبة الحالة للوظيفة أو الطلب):**
  * **المدخلات (Props):** `status` (JobStatus | ApplicationStatus)
  * **أماكن الاستخدام:** `JobCard` (حالة الوظيفة ACTIVE/CLOSED)، و `ProposalCard` (حالة الطلب PENDING/ACCEPTED/REJECTED)، و `dashboard.tsx`.
* **`VerificationBadge.tsx` (علامة ✓ التوثيق):**
  * **المدخلات (Props):** `size` (اختياري)
  * **أماكن الاستخدام:** كروت السائقين `DriverCard`, كروت الطلبات `ProposalCard`, وشاشة الملف العام للسائق.

### 2. معالجة وتوحيد منطق الأعمال (Shared Business Logic & Hooks)
* **`useCanApply.ts` (Hook مخصص للتحقق من إمكانية التقديم):**
  * سنقوم باستخراج شروط التقديم (`canApply`) بالكامل في Hook واحد مشترك لمنع تكرار التحقق من الأدوار والامتيازات في شاشة التفاصيل `[id].tsx` وشاشة تقديم الطلب `apply/[id].tsx`.
* **`useJobActions.ts` (Hook مخصص لعمليات التحكم بالوظيفة):**
  * توحيد منطق قبول الطلب، رفضه، سحبه، أو إغلاق الوظيفة في Hook مشترك يستخدمه كل من `ProposalCard` و `dashboard.tsx` لمنع تكرار الـ React Query mutations وحالات الـ Loader المرافقة لها.

---

## Proposed Changes — مقسمة بالطبقات

---

### Layer 1 — Types & Constants

#### [NEW] `src/types/jobs.types.ts`
أنواع TypeScript لكل النماذج المستخدمة:
```typescript
JobType = 'HIRING' | 'OFFERING'
EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACT'
SalaryPeriod = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'NEGOTIABLE'
JobStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED'
ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
LicenseType = 'LIGHT' | 'HEAVY' | 'TRANSPORT' | 'BUS' | 'MOTORCYCLE'
VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
interface DriverProfile { ... }
interface EmployerProfile { ... }
interface DriverJob { ... }
interface JobApplication { ... }
```

#### [NEW] `src/constants/jobs.ts`
ثوابت الترجمة العربية للأنواع:
```typescript
LICENSE_TYPE_LABELS, EMPLOYMENT_TYPE_LABELS, JOB_TYPE_LABELS,
JOB_STATUS_LABELS, APPLICATION_STATUS_LABELS, SALARY_PERIOD_LABELS
```

---

### Layer 2 — API Layer

#### [MODIFY] `src/api/jobs.ts`
إضافة الـ endpoints الجديدة مع الحفاظ على `getAll`, `getById`, `create`, `apply`, `getApplicants`:

```typescript
// Driver Profile
driverProfileCreate, driverProfileGet, driverProfileUpdate

// Employer Profile
employerProfileCreate, employerProfileGet, employerProfileUpdate

// My listings & applications
getMyJobs, getMyApplications

// Application management
updateApplicationStatus, withdrawApplication

// Driver directory
getAllDrivers, getDriverById

// Job management
closeJob, deleteJob

// Verification
submitVerification, getVerificationStatus
```

---

### Layer 3 — Hooks (React Query)

#### [NEW] `src/hooks/useDriverProfile.ts`
```typescript
useMyDriverProfile() — GET /jobs/driver-profile/me
useCreateDriverProfile() — POST /jobs/driver-profile
useUpdateDriverProfile() — PATCH /jobs/driver-profile
```

#### [NEW] `src/hooks/useEmployerProfile.ts`
```typescript
useMyEmployerProfile() — GET /jobs/employer-profile/me
useCreateEmployerProfile() — POST /jobs/employer-profile
useUpdateEmployerProfile() — PATCH /jobs/employer-profile
```

#### [NEW] `src/hooks/useJobsDashboard.ts`
```typescript
useMyJobs(params?) — GET /jobs/my
useMyApplications() — GET /jobs/my-applications
useJobApplications(jobId) — GET /jobs/:id/applications
useCloseJob() — PATCH /jobs/:id { status: 'CLOSED' }
useDeleteJob() — DELETE /jobs/:id
useUpdateApplicationStatus() — PATCH /jobs/applications/:id
useWithdrawApplication() — POST /jobs/applications/:id/withdraw
```

#### [NEW] `src/hooks/useDrivers.ts`
```typescript
useDrivers(params?) — GET /jobs/drivers
useDriver(id) — GET /jobs/drivers/:id
```

#### [NEW] `src/hooks/useVerification.ts`
```typescript
useVerificationStatus() — GET /jobs/verification/status
useSubmitVerification() — POST /jobs/verification/submit
```

---

### Layer 4 — Zustand Stores

#### [NEW] `src/store/jobProfileStore.ts`
```typescript
interface JobProfileStore {
  driverProfile: DriverProfile | null
  employerProfile: EmployerProfile | null
  activeRole: 'driver' | 'employer' | null
  setDriverProfile(p)
  setEmployerProfile(p)
  setActiveRole(r)
}
```
يحافظ على بيانات الملفات الشخصية بعد جلبها لأول مرة.

#### [NEW] `src/store/jobPostStore.ts`
إدارة حالة wizard إنشاء الوظيفة (4 خطوات):
```typescript
interface JobPostStore {
  jobType, title, description, employmentType,
  salary, salaryPeriod, licenseTypes[],
  experienceYears, languages[], vehicleTypes[],
  governorate, city, contactPhone, contactEmail,
  set(), reset()
}
```

---

### Layer 5 — Components

#### [NEW] `src/components/cards/JobCard.tsx` (يحل محل الحالي)
> **ملاحظة:** الـ [JobCard](file:///c:/Users/DELL/Desktop/Souqoneapp/src/components/cards/JobCard.tsx) الحالي لا يعرض `jobType badge`، `applicationCount`، ولا `viewCount`.

الكارت الجديد يعرض:
- Badge: HIRING (أزرق) / OFFERING (أخضر)
- Status pill: ACTIVE / CLOSED / EXPIRED
- اسم الناشر + صورة مصغرة
- الموقع + نوع الدوام + الراتب
- عدد المتقدمين + عدد المشاهدات
- تاريخ نسبي (timeAgo)

#### [NEW] `src/components/cards/DriverCard.tsx`
كارت لعرض السائق في دليل السائقين:
- صورة أفاتار + اسم + علامة ✓ توثيق
- Badge: متاح/غير متاح
- التقييم + نسبة إتمام المهام + وقت الاستجابة
- رخص القيادة (chips)
- زر "عرض الملف"

#### [NEW] `src/components/cards/ProposalCard.tsx`
كارت عرض طلبات التوظيف:
- صورة + اسم المتقدم + توثيقه
- رسالة الطلب (قابلة للتوسع)
- حالة الطلب (badge بألوان)
- أزرار قبول/رفض (لصاحب الوظيفة)
- زر سحب (للمتقدم)

#### [NEW] `src/components/jobs/RatingBadges.tsx`
شارات التقييم المشتركة:
- ⭐ التقييم / 🎯 نسبة الإتمام / ⚡ وقت الاستجابة / ✅ الوظائف المنجزة

#### [NEW] `src/components/jobs/VerificationBanner.tsx`
بانر تنبيه داخل الـ Dashboard يظهر فقط إذا السائق غير موثق (`!isVerified`).

### تفاصيل مطابقة ستايل الكروت والبادجات "بالملي" (Visual Parity & Styling Details)

لضمان مطابقة الكروت والبادجات مع الـ Web App تماماً دون أي اختلاف بصري، سنقوم بترجمة ستايلات Tailwind CSS إلى React Native Stylesheet باستخدام ثوابت الألوان (`Colors`) والمسافات (`Spacing`) المعتمدة في التطبيق:

#### 1. تصميم حاوية الكارت (`card-base`)
* **الويب:** `card-base rounded-2xl p-4 border border-outline-variant shadow-card`
* **الموبايل (React Native):**
  ```typescript
  cardBase: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border, // #E2E6EC
    padding: Spacing.space4, // 16
    marginBottom: Spacing.space4,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  }
  ```

#### 2. بادجات نوع الوظيفة (`badge-hiring` & `badge-offering`)
* **الويب (`badge-hiring`):** خلفية داكنة كحلي (`Colors.primaryDark` / `#0B2447`) مع خط عريض باللون الأبيض.
* **الويب (`badge-offering`):** خلفية برتقالية (`Colors.accent` / `#E8781E`) مع خط عريض باللون الأبيض.
* **الموبايل (React Native):**
  ```typescript
  badgeHiring: {
    backgroundColor: Colors.primaryDark, // #0B2447
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeOffering: {
    backgroundColor: Colors.accent, // #E8781E
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',
  }
  ```

#### 3. بادج حالة الطلب/الوظيفة (`status-pill` & `available-badge`)
* **الويب (`status-pill`):** خلفية رمادية شفافة (`rgba(0,0,0,0.06)`) مع نقطة ملونة تحدد الحالة.
* **الموبايل (React Native):**
  ```typescript
  statusPill: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPillText: {
    color: Colors.text, // #111827
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',
  },
  statusPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  }
  ```
* **بادج حالة السائق (`isAvailable`):**
  * **متاح الآن:** خلفية خضراء فاتحة `#F0FDF4` وإطار أخضر `#BBF7D0` ونص أخضر غامق `#15803D`.
  * **غير متاح:** خلفية رمادية `Colors.surface` وإطار رمادي ونص `Colors.text2`.

#### 4. شارات التقييم والمؤشرات (`RatingBadges`)
* **الويب:** شارات رمادية صغيرة مستديرة للتقييم، ونسبة إتمام المهام، ووقت الاستجابة، والوظائف المكتملة.
* **الموبايل (React Native):**
  ```typescript
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  ratingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface, // #F5F7FA
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  ratingItemText: {
    color: Colors.text2, // #4B5563
    fontSize: 11,
    fontFamily: 'Almarai_700Bold',
  }
  ```

#### 5. وسوم الرخص وأنواع الدوام (`License / Employment Tags`)
* **وسم الرخصة:** خلفية رمادية داكنة خفيفة `#F0F2F6` ونص كحلي أساسي `Colors.primary` (`#004ac6`).
* **وسم الدوام:** خلفية رمادية `Colors.surface` ونص رمادي `Colors.text2` مع أيقونة ساعة رمادية.

---

### Layer 6 — Screens (Routing)

#### [NEW] `app/jobs/onboarding.tsx`
شاشة الـ Onboarding بخطوتين:
1. **الخطوة 1:** اختيار الدور (سائق / صاحب عمل) — بطاقتان تفاعليتان
2. **الخطوة 2 (سائق):** نموذج مقسم لـ 4 أقسام:
   - أنواع الرخص (license chips)
   - سنوات الخبرة + هل لديه سيارة؟
   - اللغات + الجنسية
   - النبذة التعريفية + معلومات التواصل
3. **الخطوة 2 (صاحب عمل):** نموذج مختصر:
   - اسم الشركة + الصناعة + حجم الشركة
   - النبذة + الموقع + التواصل

**الـ Logic:**
- إذا البروفايلان موجودان → redirect للـ Dashboard
- إذا بروفايل واحد موجود → عرض خيار الانتقال للـ Dashboard أو إنشاء الآخر

#### [NEW] `app/jobs/dashboard.tsx`
لوحة التحكم الشخصية:

**الحالات:**
- لا يوجد بروفايل → شاشة فارغة + زر "إنشاء بروفايل"
- بروفايل واحد → عرض إعلاناته أو طلباته
- بروفايلان → Role Switcher tabs في الأعلى

**المكونات داخلها:**
- `VerificationBanner` (للسائق غير الموثق)
- **تبويبات الحالة:** ACTIVE / CLOSED / EXPIRED للإعلانات، أو PENDING / ACCEPTED / REJECTED للطلبات
- **My Posts List** (قائمة إعلاناتي) أو **My Proposals List** (قائمة طلباتي)

#### [NEW] `app/jobs/create.tsx` (wizard step 1/4)
#### [NEW] `app/jobs/create-step2.tsx` (wizard step 2/4)
#### [NEW] `app/jobs/create-step3.tsx` (wizard step 3/4)
#### [NEW] `app/jobs/create-step4.tsx` (wizard step 4/4)

Wizard إنشاء وظيفة بـ 4 خطوات يستخدم `jobPostStore`:

| الخطوة | المحتوى |
|--------|---------|
| Step 1 | نوع الوظيفة: HIRING / OFFERING |
| Step 2 | العنوان + الوصف + نوع الدوام + الراتب |
| Step 3 | المتطلبات: أنواع الرخص + الخبرة + اللغات + الجنسية |
| Step 4 | الموقع (governorate/city) + معلومات التواصل |

**Submit:** `POST /jobs` → redirect للـ `app/jobs/[id]`

#### [NEW] `app/jobs/verification.tsx`
شاشة التحقق من هوية السائق:
- عرض الحالة الحالية (PENDING / APPROVED / REJECTED + سبب الرفض)
- نموذج رفع صورة الرخصة + الهوية الوطنية
- زر الإرسال يرسل لـ `POST /jobs/verification/submit`

#### [NEW] `app/jobs/drivers/index.tsx`
دليل السائقين مع فلترة:
- قائمة `DriverCard` من `GET /jobs/drivers`
- فلاتر: governorate + licenseType + isAvailable
- حالة loading (SkeletonCard) + حالة فارغة

#### [NEW] `app/jobs/drivers/[id].tsx`
ملف السائق العام:
- صورة + اسم + توثيق + متاح/غير متاح
- تقييمات + إحصائيات (RatingBadges)
- رخص القيادة + أنواع المركبات + اللغات
- النبذة + الموقع
- زر "التواصل" (opens chat if authenticated)

---

### Layer 7 — تطوير الشاشات الموجودة

#### [MODIFY] `app/jobs/index.tsx` (شاشة التصفح)
- استبدال الفلاتر المحلية بـ query params ترسل للـ API
- إضافة فلتر `licenseType` و `minSalary` / `maxSalary`
- إضافة Pagination (infinite scroll أو أزرار next/prev)
- إضافة زر مسح الفلاتر "مسح الكل"
- إضافة زر "الدليل" للانتقال لـ `/jobs/drivers`
- استبدال `UnifiedCard` بـ `JobCard` الجديد

#### [MODIFY] `app/jobs/[id].tsx` (تفاصيل الوظيفة)
- تطبيق `canApply` logic:
  ```
  HIRING  → السائق فقط (hasDriverProfile)
  OFFERING → صاحب العمل فقط (hasEmployerProfile)
  ليس المالك + لم يتقدم مسبقاً + ACTIVE
  ```
- زر "التقدم" يفتح bottom sheet بدلاً من navigation (لتجربة أسرع)
- عرض عدد المتقدمين + عدد المشاهدات
- لصاحب الوظيفة: زر "عرض الطلبات" ينتقل لشاشة dashboard
- زر "إغلاق الوظيفة" لصاحب الوظيفة (ACTIVE فقط)

#### [MODIFY] `app/jobs/apply/[id].tsx` (نموذج التقديم)
- إضافة التحقق من الدور قبل السماح بالتقديم
- الرسالة: 10-500 حرف (Validation)
- `resumeUrl`: URL اختياري بدلاً من رفع الملف المحلي

---

### Layer 8 — Navigation Integration

#### [MODIFY] `app/(tabs)/_layout.tsx` / `app/_layout.tsx`
لا تغيير في التبويبات. لكن:
- إضافة `app/jobs/onboarding` في الـ Stack Navigator
- إضافة `app/jobs/dashboard` في الـ Stack Navigator
- إضافة `app/jobs/create` (و steps) في الـ Stack Navigator
- إضافة `app/jobs/verification` في الـ Stack Navigator
- إضافة `app/jobs/drivers/` directory في الـ Navigator

---

## الترتيب الزمني للتنفيذ (Sprints)

```
Sprint 1 — الأساس (Layer 1-3):
  ✓ jobs.types.ts + jobs constants
  ✓ jobs.ts API layer (complete)
  ✓ كل الـ Hooks الجديدة
  ✓ Zustand stores

Sprint 2 — المكونات (Layer 5):
  ✓ JobCard الجديد
  ✓ DriverCard
  ✓ ProposalCard
  ✓ RatingBadges
  ✓ VerificationBanner

Sprint 3 — شاشات الـ Onboarding & Verification (Layer 6):
  ✓ onboarding.tsx
  ✓ verification.tsx

Sprint 4 — Dashboard (Layer 6):
  ✓ dashboard.tsx

Sprint 5 — Wizard إنشاء الوظيفة (Layer 6):
  ✓ create.tsx + create-step2 + create-step3 + create-step4

Sprint 6 — دليل السائقين (Layer 6):
  ✓ drivers/index.tsx
  ✓ drivers/[id].tsx

Sprint 7 — تطوير الشاشات الموجودة (Layer 7):
  ✓ تطوير jobs/index.tsx
  ✓ تطوير jobs/[id].tsx
  ✓ تطوير jobs/apply/[id].tsx

Sprint 8 — التكامل والاختبار:
  ✓ ربط الإشعارات بشاشات الوظائف
  ✓ اختبار كامل بالـ user flows الثلاثة
```

---

## Verification Plan

### User Flows للاختبار
1. **Flow A (Employer):** إنشاء بروفايل صاحب عمل → نشر وظيفة HIRING → استقبال طلب → قبوله → إغلاق الوظيفة
2. **Flow B (Driver):** إنشاء بروفايل سائق → رفع مستندات للتحقق → التقديم على وظيفة → سحب الطلب
3. **Flow C (Driver Offering):** سائق ينشر عرض خدمة → صاحب عمل يتقدم → السائق يقبله

### TypeScript Check
```bash
npx tsc --noEmit
```

### Manual Verification
- كل البيزنس رولز على الـ API (`canApply`, `status transitions`, `ownership checks`)
- التحقق أن الشاشات القديمة لم تتغير بصرياً
- التحقق أن الـ RTL و الخطوط (Almarai) لم تتأثر
