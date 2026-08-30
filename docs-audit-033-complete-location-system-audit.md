# Complete Location System Audit

تاريخ: 2026-08-30 | Audit فقط — لا تعديلات | ريبوهات: `Souqoneapp` (mobile) + `SouqoneWepapp/apps/api` (backend)

---

## Summary Table

| Flow | Sends correct? | Backend requires? | Status | Side effect |
|---|---|---|---|---|
| Cars create/edit | ✅ `governorateId`/`wilayaId` numbers | required (create) | ✅ | — |
| Equipment create/edit | ✅ numbers | required (create) | ✅ | — |
| Equipment **browse filter** | ❌ string name | `@IsInt` (numeric) | 🔴 P0 | 400 on filter |
| Operators create/edit | ✅ numbers | required (create) | ✅ | — |
| Operators browse filter | ✅ numeric | optional numeric | ✅ | — |
| Transport request create | ✅ numbers | required | ✅ | — |
| Transport request **cards (list)** | ❌ legacy-only formatter | — (display) | 🟠 P1 | shows blank/wrong location on every request card |
| Parts create/edit | ✅ numbers, legacy stripped pre-submit | required (create) | ✅ | — |
| Services create/edit | ✅ numbers | required (create) | ✅ | — |
| Buses create/update | ❌ string only, no ID | required (create) | 🔴 P0 | every bus create/update rejected (400) |
| Buses **browse filter** | ❌ string name | `@IsNumberString` | 🔴 P0 | 400 on filter |
| Buses **detail display** | ⚠️ gate uses legacy formatter | — (display) | 🟠 P1 | location section hidden even w/ correct data |
| Jobs (driver-job) create | ❌ string only, no ID | required | 🔴 P0 | every job post rejected (400) |
| Jobs **cards + detail display** | ❌ legacy-only formatter | — (display) | 🟠 P1 | shows blank/wrong location everywhere |
| Driver profile create | ❌ string only, no ID | required | 🔴 P0 | onboarding rejected (400) |
| Employer profile create | ❌ string only, no ID | required | 🔴 P0 | onboarding rejected (400) |
| Carrier profile create | ❌ string only, no ID | required | 🔴 P0 | onboarding rejected (400) |
| User profile edit | ✅ numbers | optional | ✅ | — |
| Auth signup | ⚠️ legacy string only | legacy field still valid | 🟡 P2 | request succeeds, but new users never get `governorateId` |

---

## Part 1 — API Calls Analysis

Raw command run exactly as specified:
```
$ grep -rn "governorate\|wilaya\|GovernorateId\|WilayaId" \
  app/ src/api/ src/services/ --include="*.ts" --include="*.tsx" \
  | grep -v ".spec." | grep -v "browse\|filter\|search\|index\|browse"
```
(full raw output — 90+ lines — omitted here for length; every finding below is drawn directly from it plus targeted follow-up reads, each cited by file:line.)

### ✅ Correct — Cars
[app/cars/new.tsx:231-232](app/cars/new.tsx:231): `governorateId: formData.governorateId ? Number(...) : undefined`, same for `wilayaId`. Backend [create-listing.dto.ts:131,135](../SouqoneWepapp/apps/api/src/listings/dto/create-listing.dto.ts:131) requires both as numbers. **Match.**

### ✅ Correct — Equipment (create/edit)
[app/equipment/new.tsx:199-200](app/equipment/new.tsx:199): same `Number(formData.governorateId)` pattern. [app/equipment/edit/[id].tsx:27](app/equipment/edit/[id].tsx:27) redirects into the same `new.tsx` screen (`router.replace('/equipment/new')`), reusing this exact payload logic — edit is not a separate broken path. Backend [create-equipment-listing.dto.ts:129,133](../SouqoneWepapp/apps/api/src/equipment/dto/create-equipment-listing.dto.ts:129) requires both. **Match.**

### ✅ Correct — Operators (create/edit)
[app/equipment/operators/add.tsx:184-185](app/equipment/operators/add.tsx:184): `governorateId: govId, wilayaId: wilId || null`. Edit flow: `handleSubmit` → `buildOperatorPayload(formData)` → [src/utils/operator-payload.ts:47-48](src/utils/operator-payload.ts:47): `governorateId: Number(formData.governorateId), wilayaId: Number(formData.wilayaId)` → `updateMutation.mutate({id, data: payload})` [app/equipment/operators/edit/[id].tsx:144-146](app/equipment/operators/edit/[id].tsx:144). Backend requires both on create, optional on update. **Match.**

### ✅ Correct — Transport request create
[app/transport/new.tsx:140-146](app/transport/new.tsx:140): `fromGovernorateId`, `fromWilayaId`, `toGovernorateId`, `toWilayaId` all sent as-is from the store (already numbers per `transportWizardStore.ts`). Backend [create-transport-request.dto.ts:58,96](../SouqoneWepapp/apps/api/src/transport/dto/create-transport-request.dto.ts:58) requires both pairs. **Match.**

### ✅ Correct — Parts / Services (generic "post" flow)
[app/post/step4.tsx:145-148](app/post/step4.tsx:145) sets `governorateId`/`wilayaId` (numbers) via `GovernorateWilayaSelect`'s callback, and additionally keeps `governorate`/`city` strings "temporarily" (their own comment). [app/post/step5.tsx](app/post/step5.tsx) builds the submit payload including both, but its `forbiddenFields` array explicitly deletes `'governorate'`/`'city'` at [lines 101-102](app/post/step5.tsx:101) before the real API call, and its `numericFields` list coerces `'governorateId'`/`'wilayaId'` to numbers at [lines 170-171](app/post/step5.tsx:170). **The actual network payload only ever contains the ID fields — match, verified by tracing the full function, not just the grep hit.**

### ✅ Correct — User profile edit
[src/hooks/useEditProfile.ts:279-280](src/hooks/useEditProfile.ts:279): `governorateId: governorateId ?? undefined, wilayaId: wilayaId ?? undefined` → `usersApi.updateProfile()`, typed as `number` in [src/api/users.ts:9-10](src/api/users.ts:9). Backend [update-profile.dto.ts:27,32](../SouqoneWepapp/apps/api/src/users/dto/update-profile.dto.ts:27) — optional numbers. **Match.**

### 🔴 P0 — Buses create/update: BROKEN
[app/buses/new.tsx:111-132](app/buses/new.tsx:111) builds the full `payload` object sent unmodified to `busesApi.create(payload)` / `busesApi.update(id, payload)` at [lines 172,222](app/buses/new.tsx:172). It contains `governorate: data.governorate` ([line 126](app/buses/new.tsx:126)) and `city: data.city` — and nothing else location-related. Confirmed with a targeted, separate grep:
```
$ grep -n "governorateId\|wilayaId" app/buses/new.tsx src/store/busWizardStore.ts
(no matches — exit 1)
```
`busWizardStore.ts`'s state interface doesn't even declare a `governorateId` field. Backend [create-bus-listing.dto.ts:134-140](../SouqoneWepapp/apps/api/src/buses/dto/create-bus-listing.dto.ts:134): `governorateId!: number` and `wilayaId!: number`, both required, no `@IsOptional()`. Global `ValidationPipe` runs with `whitelist: true, forbidNonWhitelisted: true` ([apps/api/src/main.ts:49-53](../SouqoneWepapp/apps/api/src/main.ts:49)). **Mismatch — the request is missing two required fields AND carries two fields (`governorate`, `city`) the DTO doesn't declare, which `forbidNonWhitelisted` also rejects. Guaranteed 400.**

### 🔴 P0 — Jobs (driver-job posting): BROKEN
[app/jobs/create-step4.tsx:60-80](app/jobs/create-step4.tsx:60), the full `jobsApi.create({...})` payload, contains `governorate: store.governorate` ([line 75](app/jobs/create-step4.tsx:75)) and nothing else location-related:
```
$ grep -n "governorateId\|wilayaId" app/jobs/create-step4.tsx app/jobs/create-step3.tsx src/store/jobPostStore.ts
(no matches — exit 1)
```
Backend [create-job.dto.ts:82,87](../SouqoneWepapp/apps/api/src/jobs/dto/create-job.dto.ts:82) requires both as numbers, and (per the earlier location audit this session) `CreateJobDto` has no `governorate`/`city` string fields at all. **Mismatch — same double failure as Buses. Guaranteed 400.**

### 🔴 P0 — Driver Profile onboarding: BROKEN
[src/components/jobs/DriverOnboardingForm.tsx:49-55](src/components/jobs/DriverOnboardingForm.tsx:49): `createDriver.mutateAsync({..., governorate, ...})` — a plain `governorate` string state variable ([line 30](src/components/jobs/DriverOnboardingForm.tsx:30)), no `governorateId` anywhere in the file (grep exit 1). Backend `create-driver-profile.dto.ts:46,51` requires `governorateId!`/`wilayaId!`. **Guaranteed 400.**

### 🔴 P0 — Employer Profile onboarding: BROKEN
[src/components/jobs/EmployerOnboardingForm.tsx:33-36](src/components/jobs/EmployerOnboardingForm.tsx:33): `createEmployer.mutateAsync({..., governorate: empGov, ...})`, same pattern, zero `governorateId`. Backend `create-employer-profile.dto.ts:28,33` requires both. **Guaranteed 400.**

### 🔴 P0 — Carrier Profile onboarding: BROKEN
[app/transport/carrier-onboarding.tsx:31-47](app/transport/carrier-onboarding.tsx:31): payload includes `governorate` (destructured from `carrierWizardStore`), no `governorateId` anywhere under `app/transport/`:
```
$ grep -rn "governorateId\|wilayaId" app/transport/
(no matches — exit 1)
```
`src/store/carrierWizardStore.ts` has no `governorateId` field either. Backend [create-carrier-profile.dto.ts:26,31](../SouqoneWepapp/apps/api/src/transport/dto/create-carrier-profile.dto.ts:26) requires both. **Guaranteed 400.**

### 🔴 P0 — Buses browse filter: BROKEN
[app/buses/browse.tsx:310](app/buses/browse.tsx:310): `setFilters({ ...filters, governorate: item.labelAr })` — sets the filter to a **governorate name string** (e.g. `"مسقط"`), not an ID. Full-file check confirms `governorateId` never appears in this file at all (exit 1). Backend `query-bus-listings.dto.ts:22-23`: `@IsNumberString() governorateId?: string` — requires a numeric-looking string. `buses.service.ts:171`: `if (query.governorateId) where.governorateId = parseInt(query.governorateId)`. Sending `"مسقط"` fails `@IsNumberString()` validation before even reaching the service. **Any user who taps a governorate filter chip on Buses browse gets a 400, not filtered results.**

### 🔴 P0 — Equipment browse filter: BROKEN
[app/equipment/browse.tsx:367,411](app/equipment/browse.tsx:367): same pattern, `governorate: (item as any).governorate` / `governorate: item.labelAr` — string, never `governorateId`. Full-file check: exit 1 for `governorateId`. Backend `query-equipment-listings.dto.ts:11-12`: `@Type(() => Number) @IsInt() @IsPositive() governorateId?: number` — `Number("مسقط")` → `NaN`, fails `@IsInt()`. **Same 400-on-filter outcome.**

---

## Part 2 — Store Analysis

Command as specified (case-sensitive, misses camelCase `fromGovernorateId`/`toGovernorateId` — see caveat below):
```
$ grep -rn "governorate\|wilaya" src/store/ --include="*.ts" | grep -v ".spec."
```
**Methodology note:** the literal pattern is lowercase and case-sensitive, so it silently misses `transportWizardStore.ts` (whose fields are `fromGovernorateId`/`toGovernorateId`, capital G). Re-run case-insensitively to get a complete picture — shown below per store.

| Store | Fields | Type | Screens using it | Sends to API correctly? |
|---|---|---|---|---|
| `busWizardStore.ts` | `governorate: string` only ([line 33](src/store/busWizardStore.ts:33)) | string | `app/buses/new.tsx`, `BusStep5Location.tsx` | ❌ no ID field exists at all |
| `carrierWizardStore.ts` | `governorate: string` only ([line 8](src/store/carrierWizardStore.ts:8)) | string | `app/transport/carrier-onboarding.tsx`, `CarrierStep3Location.tsx`, `EditCarrierProfileModal.tsx` | ❌ no ID field exists at all |
| `carWizardStore.ts` | `governorateId`/`wilayaId` ([lines 55-56](src/store/carWizardStore.ts:55)) | number \| null | `app/cars/new.tsx`, edit via `listings/[id].tsx` | ✅ |
| `equipmentPostStore.ts` | `governorate: string` ([line 29](src/store/equipmentPostStore.ts:29)) | string | **none** — 0 imports anywhere in `app/` or `src/` | N/A — dead code |
| `equipmentWizardStore.ts` | `governorateId`/`wilayaId` **+** `governorate: string` ([lines 57-59](src/store/equipmentWizardStore.ts:57)) | number \| null + string | `app/equipment/new.tsx`, `app/equipment/edit/[id].tsx` | ✅ (ID fields are what's actually sent; string is a display cache — see `equipmentWizardStore.ts:190`: `governorate: listing.governorateRef?.nameAr \|\| listing.governorate \|\| ''`) |
| `jobPostStore.ts` | `governorate: string` only ([line 21](src/store/jobPostStore.ts:21)) | string | `app/jobs/create-step3.tsx`, `create-step4.tsx` | ❌ no ID field exists at all |
| `operatorWizardStore.ts` | `governorateId`/`wilayaId`/`governorateName`/`wilayaName` ([lines 18-21](src/store/operatorWizardStore.ts:18)) | number \| null + display strings | `app/equipment/operators/add.tsx`, `edit/[id].tsx` | ✅ |
| `postStore.ts` | `governorate: string` **+** `governorateId?`/`wilayaId?` ([lines 11,13-14](src/store/postStore.ts:11)) | string + number | `app/post/step4.tsx`, `step5.tsx`, `edit/[id].tsx` | ✅ (verified — legacy string stripped before submit, see Part 1) |
| `transportWizardStore.ts` | `fromGovernorateId`/`fromWilayaId`/`toGovernorateId`/`toWilayaId` (+ NameAr display strings) ([lines 10-20](src/store/transportWizardStore.ts:10)) | number \| null + display strings | `app/transport/new.tsx` | ✅ |

**Pattern:** every store that mixes `governorateId` (number) alongside a `governorate`/`*NameAr` string field uses the string **only as a cached display label**, never as the thing actually sent to the API (verified per-store above). Every store that has **only** the legacy string field (`busWizardStore`, `carrierWizardStore`, `jobPostStore`, and the orphaned `equipmentPostStore`) corresponds 1:1 to a broken create flow found in Part 1.

---

## Part 3 — Display Analysis

Command as specified:
```
$ grep -rn "governorate\|wilaya\|locationDisplay\|formatLocation\|getPostGovLabel" \
  src/components/ --include="*.tsx" \
  | grep -v ".spec." | grep -v "GovernorateWilayaSelect\|LocationPicker"
```
This surfaced the card-mapping layer, so the real analysis was traced into [src/utils/mappers.ts](src/utils/mappers.ts), which is where every card's `governorate` field is actually computed (components themselves just render `card.governorate` — the comment at [mappers.ts:88-91](src/utils/mappers.ts:88) confirms this is deliberate: *"Card components should read the pre-translated `item.governorate` field directly."*).

**`formatLocation(item)`** ([mappers.ts:93-100](src/utils/mappers.ts:93)) is the correct, "smart" function: if `item.governorateRef` exists, it uses `governorateRef.nameAr`/`wilayaRef.nameAr`; only if absent does it fall back to the legacy-only `formatOmanLocation(item.governorate, item.city)`. This is good design — the bug is that several call sites bypass it or feed it the wrong object.

| Mapper / call site | Uses `formatLocation(item)` with the real item? | Verdict |
|---|---|---|
| `mapListingToCard` ([:149](src/utils/mappers.ts:149)) | ✅ | correct |
| `mapServiceToCard` ([:215](src/utils/mappers.ts:215)) | ✅ | correct |
| `mapPartToCard` ([:305](src/utils/mappers.ts:305)) | ✅ | correct |
| `mapBusToCard` ([:374](src/utils/mappers.ts:374)) | ✅ | correct (list/card view only — see detail-page bug below) |
| `mapEquipmentToCard` ([:448](src/utils/mappers.ts:448)) | ✅ | correct (list/card view only — see detail-page bug below) |
| `mapOperatorToCard` ([:496](src/utils/mappers.ts:496)) | ✅ | correct |
| `mapJobToCard` ([:165-166,191](src/utils/mappers.ts:165)) | ❌ uses `resolveLocationGov(item.governorate)` directly — never touches `item.governorateRef` | 🟠 **P1 bug** |
| `mapTransportToCard` ([:509-510](src/utils/mappers.ts:509)) | ❌ builds a synthetic `{ governorate: item.fromGovernorate, city: item.fromCity }` object with no `Ref` fields, so `formatLocation`'s `governorateRef` branch can never fire | 🟠 **P1 bug** |

### Detail-page display bug (3 verticals, same pattern)

Three detail screens compute a **gating variable** with the wrong (legacy-only) formatter, then use that variable to decide whether to render the location section at all — while the actual text inside, if rendered, correctly calls `formatLocation(raw)`:

- [app/buses/[id].tsx:147](app/buses/[id].tsx:147): `const governorate = formatOmanLocation(raw.governorate, raw.city)`, used at [lines 579,584](app/buses/[id].tsx:579) as `{(governorate || city || raw.locationNote || ...) ? <Section>...{formatLocation(raw)}...</Section> : null}`.
- [app/equipment/[id].tsx:117](app/equipment/[id].tsx:117): identical pattern, used at [lines 374,379](app/equipment/[id].tsx:374).
- [app/jobs/[id].tsx:145](app/jobs/[id].tsx:145): `{(formatOmanLocation(raw.governorate, raw.city)) && (<View>...{formatLocation(raw)}...</View>)}` — same gate/content split, one line.

**Consequence:** for any record whose location came from the new `governorateId`/`governorateRef` path but has no legacy `governorate`/`city` string set (which — per Part 1/2 — is **every** Equipment listing created via the current, correctly-working create flow, plus any Bus/Job record that somehow got a governorateId without the legacy string), the gate evaluates to falsy and the **entire location section silently never renders** — `formatLocation(raw)` is never even reached, despite being fully capable of producing the correct text. [app/listings/[id].tsx:146](app/listings/[id].tsx:146) shows the correct pattern for comparison: `const governorate = formatLocation(raw)` — same variable, right formatter, used at [lines 525,530](app/listings/[id].tsx:525) — no bug there.

---

## Part 4 — Component Inventory

Commands as specified:
```
$ grep -rn "import.*LocationPicker\b" src/ app/ --include="*.tsx" | grep -v ".spec." | grep -v "MapLocationPicker\|LocationPickerModal"
$ grep -rn "import.*GovernorateWilayaSelect" src/ app/ --include="*.tsx" | grep -v ".spec."
```

| File | Component used | Vertical | Flow type | Broken as a result? |
|---|---|---|---|---|
| [src/components/buses/wizard/BusStep5Location.tsx:10](src/components/buses/wizard/BusStep5Location.tsx:10) | `LocationPicker` | Buses | create/edit | ✅ Yes — feeds `busWizardStore.governorate` (string), which is exactly what breaks the create payload (Part 1) |
| [src/components/jobs/DriverOnboardingForm.tsx:13](src/components/jobs/DriverOnboardingForm.tsx:13) | `LocationPicker` | Jobs (driver) | profile create | ✅ Yes — same mechanism |
| [src/components/jobs/EmployerOnboardingForm.tsx:11](src/components/jobs/EmployerOnboardingForm.tsx:11) | `LocationPicker` | Jobs (employer) | profile create | ✅ Yes — same mechanism |
| [app/jobs/create-step3.tsx:18](app/jobs/create-step3.tsx:18) | `LocationPicker` | Jobs (job post) | create | ✅ Yes — same mechanism |
| [src/components/transport/carrier/CarrierStep3Location.tsx:8](src/components/transport/carrier/CarrierStep3Location.tsx:8) | `LocationPicker` | Transport (carrier) | onboarding | ✅ Yes — same mechanism |
| [src/components/transport/EditCarrierProfileModal.tsx:9](src/components/transport/EditCarrierProfileModal.tsx:9) | `LocationPicker` | Transport (carrier) | profile edit | ⚠️ Likely — same store shape, not independently traced to an update call this session |
| [app/(auth)/register.tsx:28](app/(auth)/register.tsx:28) | `LocationPicker` | Auth | signup | ❌ No — backend's legacy `User.governorate` string column still accepts it (see Part 5) |

| File | Component used | Vertical | Flow type |
|---|---|---|---|
| [src/components/cars/wizard/CarStep4Location.tsx:9](src/components/cars/wizard/CarStep4Location.tsx:9) | `GovernorateWilayaSelect` | Cars | create/edit |
| [src/components/equipment/wizard/EquipmentStep4Location.tsx:9](src/components/equipment/wizard/EquipmentStep4Location.tsx:9) | `GovernorateWilayaSelect` | Equipment | create/edit |
| [src/components/operators/OperatorRatesLocationStep.tsx:7](src/components/operators/OperatorRatesLocationStep.tsx:7) | `GovernorateWilayaSelect` | Operators | create/edit |
| [src/components/transport/wizard/TransportStep2Location.tsx:7](src/components/transport/wizard/TransportStep2Location.tsx:7) | `GovernorateWilayaSelect` (×2) | Transport (request) | create |
| [app/post/step4.tsx:20](app/post/step4.tsx:20) | `GovernorateWilayaSelect` | Parts/Services | create/edit |
| [app/profile/edit-profile.tsx](app/profile/edit-profile.tsx) | (uses `governorateId` props directly to a modal, not `GovernorateWilayaSelect` itself — see Part 1, still correct) | Auth/Profile | edit |

**Coverage is exactly inverse to Part 1's broken list**: every vertical still on `LocationPicker` has a broken (or, for Auth, degraded) API call; every vertical on `GovernorateWilayaSelect` sends correct data.

---

## Part 5 — Side Effects

### 🔴 Buses create/update (P0)
1. **Submit result:** hard 400 from the global `ValidationPipe` — two required fields missing (`governorateId`, `wilayaId`) plus two rejected unknown fields (`governorate`, `city`, since `forbidNonWhitelisted: true`). The mobile catch block at [app/buses/new.tsx:180-186](app/buses/new.tsx:180) reads `err.response?.data?.message` and shows it in a `dialogService.alert('حدث خطأ', ...)` — so the user sees a generic Arabic validation-error dialog, not a silent failure.
2. **Recovery:** none available by retrying the same form — the payload shape never changes, so every attempt fails identically. The user cannot self-recover; only a code fix unblocks this.
3. **Existing data:** not affected — this only blocks *new* creates/updates, it doesn't corrupt anything already in the DB.
4. **Search/discovery:** compounding effect — because no bus listing can be created at all right now, Bus browse/search has nothing new to show; combined with the browse-filter bug (also P0), a user also can't filter whatever old bus listings exist by governorate.

### 🔴 Jobs / Driver profile / Employer profile / Carrier profile (P0, same shape)
Identical to Buses: hard 400, dialog shown, no self-recovery, existing data untouched. For Jobs specifically this means **no new job can be posted from mobile**, and **no driver or employer can complete onboarding** — a compounding failure across the entire Jobs vertical, not just listings.

### 🔴 Buses / Equipment browse filters (P0)
1. **Submit result:** the `GET /buses`/`GET /equipment` request itself 400s the moment a governorate filter is active (`@IsNumberString`/`@IsInt` reject the name string). Whether the UI shows this as a visible error or a silently-empty list depends on each screen's react-query error handling — not traced further this session, but the network response itself is a hard failure either way, not "zero matching results."
2. **Recovery:** user can clear the filter and browse unfiltered — the rest of the browse screen (pagination, other filters) is unaffected, but the governorate filter specifically is unusable.
3. **Existing data:** unaffected.
4. **Search/discovery:** direct impact — this is itself a discovery feature being broken.

### 🟠 Job / Transport cards & Bus/Equipment/Job detail pages (P1)
1. **Submit result:** n/a — these are read paths, nothing is submitted.
2. **Recovery:** n/a for the user — there's nothing to retry; the data exists correctly in the backend response and is simply never rendered.
3. **Existing data:** unaffected — this is purely a client-side rendering gap, the backend's `governorateRef`/`wilayaRef` includes (confirmed present in a separate audit this session for jobs/buses/equipment/transport `findAll`/`findOne` queries) are correct.
4. **Search/discovery:** indirect but real — a transport-request card showing no `from → to` (the single most important piece of information on that card) or a job/bus/equipment card silently missing its location makes location-based browsing effectively unusable for those verticals even once the create-side bugs are fixed, since the data would exist but never display.

### 🟡 Auth signup (P2)
1. **Submit result:** succeeds — backend's `User.governorate: String?` legacy column is still actively written by `auth.service.ts` (confirmed in an earlier audit this session).
2. **Recovery:** n/a, nothing fails.
3. **Existing data:** no corruption, but every new signup accumulates more users with `governorateId: null` — a growing data-quality gap.
4. **Search/discovery:** no direct effect on listings search, but any future feature that filters/matches *users* by governorate (e.g. "drivers near you") would silently exclude all users who signed up through this path.

### ⚠️ Cross-session connection — pending migration makes the Buses/Jobs situation worse
A separate audit earlier this session found an **unapplied** migration, [`20260830150500_remove_legacy_governorate_city_from_bus_job/migration.sql`](../SouqoneWepapp/apps/api/prisma/migrations/20260830150500_remove_legacy_governorate_city_from_bus_job/migration.sql), which drops the `governorate`/`city` columns from `bus_listings` and `driver_jobs` entirely. Today, that migration is still pending (per `prisma migrate status`), so **existing** bus listings and jobs that were created before this session (via whatever method actually got them into the DB) still have their legacy `governorate`/`city` strings intact, and the detail-page display bug (Part 3) only affects *new* records that lack them. **Once that migration deploys, every bus listing and every job — old and new alike — loses the legacy columns, and the mobile display bug in Part 3 becomes universal for both verticals**, not just for new records. This audit did not re-verify whether that migration has since been applied — flagged here only to connect the two findings, not asserted as currently live.

---

## Part 6 — Backend DTOs

Command as specified:
```
$ grep -rn "governorateId\|wilayaId\|fromGovernorateId\|toGovernorateId" apps/api/src/ --include="*.dto.ts" | grep -v ".spec."
```
(69 matches; summarized per vertical below, every row traceable to the raw grep output.)

| Vertical | Create | Update | Query |
|---|---|---|---|
| Listings (Cars) | **required** `!` ([create-listing.dto.ts:131,135](../SouqoneWepapp/apps/api/src/listings/dto/create-listing.dto.ts:131)) | optional | optional |
| Buses | **required** `!` ([create-bus-listing.dto.ts:136,140](../SouqoneWepapp/apps/api/src/buses/dto/create-bus-listing.dto.ts:136)) | optional | optional (`@IsNumberString`) |
| Equipment | **required** `!` ([create-equipment-listing.dto.ts:129,133](../SouqoneWepapp/apps/api/src/equipment/dto/create-equipment-listing.dto.ts:129)) | optional | optional (`@IsInt`) |
| Operators | **required** `!` ([create-operator-listing.dto.ts:52,56](../SouqoneWepapp/apps/api/src/equipment/dto/create-operator-listing.dto.ts:52)) | optional | optional |
| Jobs (driver-job) | **required** `!` ([create-job.dto.ts:82,87](../SouqoneWepapp/apps/api/src/jobs/dto/create-job.dto.ts:82)) | optional | optional |
| Driver Profile | **required** `!` ([create-driver-profile.dto.ts:46,51](../SouqoneWepapp/apps/api/src/jobs/dto/create-driver-profile.dto.ts:46)) | optional | optional |
| Employer Profile | **required** `!` ([create-employer-profile.dto.ts:28,33](../SouqoneWepapp/apps/api/src/jobs/dto/create-employer-profile.dto.ts:28)) | optional | — |
| Parts | **required** `!` ([create-part.dto.ts:66,70](../SouqoneWepapp/apps/api/src/parts/dto/create-part.dto.ts:66)) | (no dedicated Update DTO — `Partial<CreatePartDto>`, see separate audit this session) | optional |
| Services | **required** `!` ([create-service.dto.ts:64,68](../SouqoneWepapp/apps/api/src/services/dto/create-service.dto.ts:64)) | (same gap as Parts) | optional |
| Transport Request | **required** `!` both from/to ([create-transport-request.dto.ts:58,96](../SouqoneWepapp/apps/api/src/transport/dto/create-transport-request.dto.ts:58)) | optional | optional |
| Carrier Profile | **required** `!` ([create-carrier-profile.dto.ts:26,31](../SouqoneWepapp/apps/api/src/transport/dto/create-carrier-profile.dto.ts:26)) | optional | optional |
| Search (global) | — | — | optional ([search-query.dto.ts:34,40](../SouqoneWepapp/apps/api/src/search/dto/search-query.dto.ts:34)) |
| User Profile | (no separate create — signup uses legacy `governorate` string) | optional ([update-profile.dto.ts:27,32](../SouqoneWepapp/apps/api/src/users/dto/update-profile.dto.ts:27)) | — |

**Every single Create DTO across all 7 verticals + Driver/Employer/Carrier profiles requires `governorateId`/`wilayaId` as mandatory numbers.** There is no vertical where the backend accepts a legacy string in place of the ID on create — meaning every mobile flow still on `LocationPicker` (Part 4) is, without exception, sending a payload shape the backend cannot accept for creation.

---

## Complete Issue List (ordered by severity)

🔴 **P0 — breaks functionality completely**
1. Bus listing create/update always 400s — [app/buses/new.tsx:126](app/buses/new.tsx:126), [busWizardStore.ts](src/store/busWizardStore.ts) (no ID field), [BusStep5Location.tsx:27](src/components/buses/wizard/BusStep5Location.tsx:27)
2. Job posting always 400s — [app/jobs/create-step4.tsx:75](app/jobs/create-step4.tsx:75), [jobPostStore.ts](src/store/jobPostStore.ts), [app/jobs/create-step3.tsx:56](app/jobs/create-step3.tsx:56)
3. Driver profile onboarding always 400s — [DriverOnboardingForm.tsx:49-55](src/components/jobs/DriverOnboardingForm.tsx:49)
4. Employer profile onboarding always 400s — [EmployerOnboardingForm.tsx:33-36](src/components/jobs/EmployerOnboardingForm.tsx:33)
5. Carrier profile onboarding always 400s — [app/transport/carrier-onboarding.tsx:47](app/transport/carrier-onboarding.tsx:47), [carrierWizardStore.ts](src/store/carrierWizardStore.ts)
6. Buses browse governorate filter always 400s — [app/buses/browse.tsx:310](app/buses/browse.tsx:310)
7. Equipment browse governorate filter always 400s — [app/equipment/browse.tsx:367,411](app/equipment/browse.tsx:367)

🟠 **P1 — wrong data saved/shown**
8. `mapJobToCard` ignores `governorateRef`, always uses legacy string — [mappers.ts:165-166,191](src/utils/mappers.ts:165)
9. `mapTransportToCard` strips `Ref` fields before calling `formatLocation`, always uses legacy string — [mappers.ts:509-510](src/utils/mappers.ts:509)
10. Bus detail page hides its entire location section for records without legacy strings — [app/buses/[id].tsx:147,579,584](app/buses/[id].tsx:147)
11. Equipment detail page — same bug, and directly affects listings created via the *currently-working* create flow — [app/equipment/[id].tsx:117,374,379](app/equipment/[id].tsx:117)
12. Job detail page — same gate/content split — [app/jobs/[id].tsx:145](app/jobs/[id].tsx:145)

🟡 **P2 — data quality gap / code hygiene, no functional break**
13. Auth signup never populates `User.governorateId` FK — [app/(auth)/register.tsx:82,186](app/(auth)/register.tsx:82)
14. `app/post/edit/[id].tsx` uses inconsistent null vs. undefined fallback for `governorateId`/`wilayaId` between its car branch (lines 164-165) and generic branch (lines 220-221)
15. `equipmentPostStore.ts` is dead code — a `governorate: string`-only store with zero imports anywhere in the app
16. `BusStep5Location.tsx` sets `errors.governorate` on change ([line 33](src/components/buses/wizard/BusStep5Location.tsx:33)) but displays `errors.governorateId` ([line 40](src/components/buses/wizard/BusStep5Location.tsx:40)) — a validation-error display that can never actually show
17. Jobs and Transport browse screens have no governorate filter implemented at all (not broken, just absent — worth noting since 4 of 7 verticals now have *some* form of location filtering and these two don't)
