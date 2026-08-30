# Location Fixes Verification Report

تاريخ: 2026-08-30 | ريبو الموبايل: `Souqoneapp` | ريبو الباك إند: `SouqoneWepapp/apps/api` | Audit فقط — لا تعديلات

---

## Fix 1 — Transport Store

```
$ grep -n "setFromLocation\|setToLocation" src/store/transportWizardStore.ts
65:  setFromLocation: (govId: number, wilId: number, govName: string, wilName: string) => void;
66:  setToLocation: (govId: number, wilId: number, govName: string, wilName: string) => void;
90:  setFromLocation: (govId, wilId, govName, wilName) => set((state) => ({
100:  setToLocation: (govId, wilId, govName, wilName) => set((state) => ({

$ grep -n "fromGovernorateId\|fromWilayaId\|toGovernorateId\|toWilayaId" app/transport/new.tsx
58:        if (!data.fromGovernorateId) errs.fromGovernorateId = 'الرجاء تحديد موقع الانطلاق';
59:        if (!data.toGovernorateId) errs.toGovernorateId = 'الرجاء تحديد موقع الوصول';
109:      if (!data.fromGovernorateId || !data.toGovernorateId) missingFields.push('مواقع الانطلاق والوصول');
140:        fromGovernorateId: data.fromGovernorateId,
141:        fromWilayaId: data.fromWilayaId,
145:        toGovernorateId: data.toGovernorateId,
146:        toWilayaId: data.toWilayaId,

$ grep -rn "LocationPicker" src/components/transport/
src/components/transport/carrier/CarrierStep3Location.tsx:8:import { LocationPicker } from '../../ui/LocationPicker';
src/components/transport/carrier/CarrierStep3Location.tsx:23:        <LocationPicker
src/components/transport/EditCarrierProfileModal.tsx:9:import { LocationPicker } from '../ui/LocationPicker';
src/components/transport/EditCarrierProfileModal.tsx:102:              <LocationPicker
src/components/transport/wizard/TransportStep2Location.spec.tsx:18:jest.mock('../../ui/MapLocationPicker', ...)  ← matches "LocationPicker" substring inside "MapLocationPicker", not the real component
src/components/transport/wizard/TransportStep2Location.tsx:8:import { MapLocationPicker } from '../../ui/MapLocationPicker';  ← same, MapLocationPicker ≠ LocationPicker
```

**⚠️ PARTIAL.** The main transport-request wizard (`TransportStep2Location.tsx`, used by `app/transport/new.tsx`) is clean — actions exist, payload uses IDs, and its only "LocationPicker" hits are `MapLocationPicker` (a different, GPS-pin component, not the legacy governorate/city text picker). But `LocationPicker` (the legacy component) is **still actively imported and rendered** in two other files under the same `src/components/transport/` tree: [CarrierStep3Location.tsx:8,23](../Souqoneapp/src/components/transport/carrier/CarrierStep3Location.tsx) and [EditCarrierProfileModal.tsx:9,102](../Souqoneapp/src/components/transport/EditCarrierProfileModal.tsx). These belong to the **Carrier onboarding/profile** sub-flow, a separate flow from the transport-request wizard the fix targeted — see Fix 5 for why this is a functional problem, not just leftover code.

---

## Fix 2 — Cars Edit

```
$ grep -n "governorateId\|wilayaId" "app/listings/[id].tsx"
220:        governorateId: raw.governorateId ?? null,
221:        wilayaId: raw.wilayaId ?? null,
```

✅ Both fields present in the `setEditMode` call, with `?? null` (never leaves them `undefined`).

---

## Fix 3 — Parts/Services Edit

```
$ grep -n "governorateId\|wilayaId" "app/post/edit/[id].tsx"
164:            governorateId: listing.governorateId ? Number(listing.governorateId) : null,
165:            wilayaId: listing.wilayaId ? Number(listing.wilayaId) : null,
220:          governorateId: listing.governorateId ? Number(listing.governorateId) : undefined,
221:          wilayaId: listing.wilayaId ? Number(listing.wilayaId) : undefined,
```

✅ Present. Two separate blocks exist in this file: lines 157–204 are the **car-specific** branch (`useCarWizardStore.getState().setEditMode(...)`, fallback `null`), lines 210–228 are the **generic branch used by Parts/Services** (`set({...})` on `postStore`, fallback `undefined`). The task's check ("governorateId set in postStore on edit") is satisfied by the second block — both fields are present.

**Minor inconsistency (not a functional bug):** the two blocks use different fallbacks for a missing value — `null` (car branch) vs `undefined` (generic branch). Both are falsy and `GovernorateWilayaSelect` treats them identically, so this doesn't currently break anything, but it's worth aligning for consistency with Fix 2's `?? null` pattern.

---

## Fix 4 — ModernOperatorCard

```
$ grep -n "formatLocation\|getPostGovLabel\|getPostCityLabel" src/components/cards/ModernOperatorCard.tsx
15:import { formatLocation } from '../../utils/mappers'
62:    : formatLocation(raw) || 'موقع غير محدد'
```

✅ `formatLocation` is used; no `getPostGovLabel`/`getPostCityLabel` matches — legacy functions are gone from this file.

---

## Fix 5 — No Conflicts

### LocationPicker remaining usages

```
$ grep -rn "LocationPicker" src/ app/ --include="*.tsx" --include="*.ts" | grep -v ".spec." | grep -v "LocationPicker.tsx"
src/components/buses/wizard/BusStep5Location.tsx:10:import { LocationPicker } from '../../ui/LocationPicker';
src/components/buses/wizard/BusStep5Location.tsx:27:        <LocationPicker
src/components/cars/wizard/CarStep4Location.tsx:10,270: MapLocationPicker only (not LocationPicker) — clean
src/components/equipment/wizard/EquipmentStep4Location.tsx:10,265: MapLocationPicker only — clean
src/components/jobs/DriverOnboardingForm.tsx:13:import { LocationPicker } from '../ui/LocationPicker'
src/components/jobs/DriverOnboardingForm.tsx:127:            <LocationPicker
src/components/jobs/EmployerOnboardingForm.tsx:11:import { LocationPicker } from '../ui/LocationPicker'
src/components/jobs/EmployerOnboardingForm.tsx:103:            <LocationPicker
src/components/profile/LocationPickerModal.tsx: different component (LocationPickerModal), name-substring match only
src/components/transport/carrier/CarrierStep3Location.tsx:8,23: LocationPicker (see Fix 1)
src/components/transport/EditCarrierProfileModal.tsx:9,102: LocationPicker (see Fix 1)
src/components/transport/wizard/TransportStep2Location.tsx:8,93: MapLocationPicker only — clean
src/components/ui/MapLocationPicker.web.tsx: different component, name-substring match only
app/(auth)/register.tsx:28:import { LocationPicker } from '../../src/components/ui/LocationPicker'
app/(auth)/register.tsx:186:            <LocationPicker
app/jobs/create-step3.tsx:18:import { LocationPicker } from '../../src/components/ui/LocationPicker'
app/jobs/create-step3.tsx:56:            <LocationPicker
app/profile/edit-profile.tsx: LocationPickerModal, different component
```

**❌ Real (non-false-positive) `LocationPicker` usages, all in currently-shipping screens — not legacy/unused:**
| File | Vertical |
|---|---|
| [BusStep5Location.tsx:27](../Souqoneapp/src/components/buses/wizard/BusStep5Location.tsx:27) | Buses — create/edit wizard |
| [DriverOnboardingForm.tsx:127](../Souqoneapp/src/components/jobs/DriverOnboardingForm.tsx:127) | Jobs — driver profile |
| [EmployerOnboardingForm.tsx:103](../Souqoneapp/src/components/jobs/EmployerOnboardingForm.tsx:103) | Jobs — employer profile |
| [CarrierStep3Location.tsx:23](../Souqoneapp/src/components/transport/carrier/CarrierStep3Location.tsx:23) | Transport — carrier onboarding |
| [EditCarrierProfileModal.tsx:102](../Souqoneapp/src/components/transport/EditCarrierProfileModal.tsx:102) | Transport — carrier profile edit |
| [register.tsx:186](../Souqoneapp/app/(auth)/register.tsx:186) | Auth — signup |
| [create-step3.tsx:56](../Souqoneapp/app/jobs/create-step3.tsx:56) | Jobs — job posting |

Expected outcome ("should only be in legacy/unused files") is **not met**: 4 active verticals/flows (Buses, Jobs, Transport-Carrier, Auth) still run entirely on the legacy free-text `LocationPicker`.

### GovernorateWilayaSelect coverage

```
$ grep -rn "GovernorateWilayaSelect" src/ app/ --include="*.tsx" | grep -v ".spec." | grep -v "GovernorateWilayaSelect.tsx"
src/components/cars/wizard/CarStep4Location.tsx:9,203
src/components/equipment/wizard/EquipmentStep4Location.tsx:9,176
src/components/operators/OperatorRatesLocationStep.tsx:7,62
src/components/transport/wizard/TransportStep2Location.tsx:7,24,60
app/post/step4.tsx:20,140
```

Used by: **Cars, Equipment, Operators, Transport-request-wizard, Parts/Services (generic post flow)** — 5 surfaces. **Not used by: Buses, Jobs, Transport-Carrier, Auth** — the exact same 4 gaps found above. Migration to the new location system is roughly ⅝ complete across the app's location-capturing screens.

### Raw governorate strings remaining

```
$ grep -rn "governorate:" src/store/ app/ --include="*.ts" --include="*.tsx" | grep -v "governorateId\|governorateRef\|governorateName\|GovernorateWilaya\|.spec."
src/store/busWizardStore.ts:33,70          — state field + initial value (legacy)
src/store/carrierWizardStore.ts:8,28       — state field + initial value (legacy)
src/store/equipmentPostStore.ts:29,81      — state field + initial value (legacy, unused by the live equipment wizard — see below)
src/store/equipmentWizardStore.ts:59       — initial value (legacy)
src/store/jobPostStore.ts:21,46            — state field + initial value (legacy)
src/store/postStore.ts:11,42               — state field + initial value (legacy, kept intentionally — see below)
app/(auth)/register.tsx:82                 — governorate: governorate || undefined  (signup payload)
app/buses/browse.tsx:310                   — filter UI only, not a create/edit payload
app/buses/new.tsx:126                      — governorate: data.governorate  (CREATE PAYLOAD — see verdict)
app/equipment/browse.tsx:367,411           — filter UI only
app/equipment/index.tsx:39,47,54,61        — hardcoded homepage quick-filter labels, not a payload
app/equipment/new.tsx:356                  — governorate: govName  (display-name cache; governorateId is ALSO set at lines 354-355, and this create payload uses formData.governorateId at line 199 — see below)
app/jobs/create-step3.tsx:58               — onGovernorateChange local-store setter
app/jobs/create-step4.tsx:75               — governorate: store.governorate  (CREATE PAYLOAD — see verdict)
app/post/edit/[id].tsx:80,218              — postStore population on edit (legacy field kept alongside governorateId, see Fix 3)
app/post/step4.tsx:148                     — governorate: govNameAr  (local store only, stripped before submit — see below)
app/post/step5.tsx:71                      — governorate: store.governorate...  (present in the payload draft, but DELETED before the API call — see below)
```

**This list is not empty, and 3 of the hits are genuine, confirmed bugs — not leftover dead code:**

1. **`app/buses/new.tsx:126`** — the full create/update payload object (lines 111–132) sent to `busesApi.create(payload)` / `busesApi.update(id, payload)` contains `governorate: data.governorate` and `city: data.city`, and **nothing else location-related** — confirmed with a separate, targeted grep:
   ```
   $ grep -n "governorateId\|wilayaId" app/buses/new.tsx
   (no matches, exit 1)
   ```
   `src/store/busWizardStore.ts` doesn't even declare a `governorateId` field in its state interface (same empty grep result). The backend's [`CreateBusListingDto`](../SouqoneWepapp/apps/api/src/buses/dto/create-bus-listing.dto.ts:134) requires `governorateId!: number` and `wilayaId!: number` (`@IsInt() @IsPositive()`, no `@IsOptional()`), and the global `ValidationPipe` runs with `forbidNonWhitelisted: true`. **Every bus listing create/update from the mobile app will be rejected by the backend** — missing required fields, plus unrecognized `governorate`/`city` properties.

2. **`app/jobs/create-step4.tsx:75`** — same pattern. The full `jobsApi.create({...})` payload (lines 60-80) has `governorate: store.governorate` and no `governorateId`/`wilayaId` anywhere:
   ```
   $ grep -n "governorateId\|wilayaId" app/jobs/create-step4.tsx app/jobs/create-step3.tsx src/store/jobPostStore.ts
   (no matches, exit 1)
   ```
   Backend's `CreateJobDto` also requires `governorateId!`/`wilayaId!` as mandatory. **Job posting from mobile is broken the same way.**

3. **Transport Carrier onboarding** (`app/transport/carrier-onboarding.tsx` and related) — zero `governorateId`/`wilayaId` matches anywhere under `app/transport/`:
   ```
   $ grep -rn "governorateId\|wilayaId" app/transport/
   (no matches, exit 1)
   ```
   `src/store/carrierWizardStore.ts` has no `governorateId` field either. Backend's [`CreateCarrierProfileDto`](../SouqoneWepapp/apps/api/src/transport/dto/create-carrier-profile.dto.ts:26) requires `governorateId!`/`wilayaId!` as mandatory too. **Carrier profile creation from mobile is broken the same way.**

**Two hits that look concerning but are NOT bugs, confirmed by reading the full payload-construction logic:**
- `app/post/step4.tsx:148` and `app/post/step5.tsx:71` (Parts/Services): `step4.tsx` sets `governorateId`/`wilayaId` correctly via `GovernorateWilayaSelect`'s callback ([step4.tsx:140-150](../Souqoneapp/app/post/step4.tsx:140)) and keeps `governorate`/`city` strings alongside "temporarily" (their own comment). `step5.tsx`'s `handlePublish` builds a draft payload including both, but explicitly deletes `governorate`/`city` from `forbiddenFields` before the real API call ([step5.tsx:101-104](../Souqoneapp/app/post/step5.tsx:101)), and coerces `governorateId`/`wilayaId` to numbers via its `numericFields` list ([step5.tsx:170-171](../Souqoneapp/app/post/step5.tsx:170)). The actual network call only ever sends the ID fields. **Working as intended.**
- `app/equipment/new.tsx:356`: `governorate: govName` is set alongside `governorateId`/`wilayaId` at the same callback ([lines 354-356](../Souqoneapp/app/equipment/new.tsx:354)), but the actual submit payload at line 199 reads `formData.governorateId`, not `formData.governorate`. **Working as intended** — `governorate` here is just a cached display label.
- `app/(auth)/register.tsx:82`: sends a raw `governorate` string at signup. The backend's `User.governorate: String?` is a real, still-actively-written legacy column (confirmed in a separate backend audit this session — `auth.service.ts:42`), so this doesn't 400. It does mean new signups never populate the modern `User.governorateId` FK — a data-quality gap, not a request failure.
- `app/buses/browse.tsx:310`, `app/equipment/browse.tsx:367,411`, `app/equipment/index.tsx:39-61`: filter/display UI only, not create/edit payloads — out of scope for this fix.

### errors.governorate remaining

```
$ grep -rn "errors\.governorate\b" src/ app/ --include="*.tsx" | grep -v "errors\.governorateId" | grep -v ".spec."
(no matches)
```

✅ Empty, as expected.

---

## TypeScript

```
$ npx tsc --noEmit -p apps/api/tsconfig.build.json
(no output)
```
### Backend: ✅ (exit 0)

```
$ npx tsc --noEmit   [run from Souqoneapp/]
(no output)
```
### Mobile: ✅ (exit 0)

---

## Final Verdict

❌ **Issues found — 3 confirmed functional bugs, 1 confirmed incomplete migration:**

1. **Bus listing create/update is broken end-to-end.** Mobile never sends `governorateId`/`wilayaId`; backend requires both. [app/buses/new.tsx:126](../Souqoneapp/app/buses/new.tsx:126), [src/components/buses/wizard/BusStep5Location.tsx:27](../Souqoneapp/src/components/buses/wizard/BusStep5Location.tsx:27), [src/store/busWizardStore.ts](../Souqoneapp/src/store/busWizardStore.ts) (no `governorateId` field at all).
2. **Job posting is broken end-to-end**, same pattern. [app/jobs/create-step4.tsx:75](../Souqoneapp/app/jobs/create-step4.tsx:75), [src/components/jobs/DriverOnboardingForm.tsx:127](../Souqoneapp/src/components/jobs/DriverOnboardingForm.tsx:127), [EmployerOnboardingForm.tsx:103](../Souqoneapp/src/components/jobs/EmployerOnboardingForm.tsx:103), [app/jobs/create-step3.tsx:56](../Souqoneapp/app/jobs/create-step3.tsx:56).
3. **Carrier profile creation (Transport vertical) is broken end-to-end**, same pattern. No `governorateId`/`wilayaId` anywhere under `app/transport/`; [src/components/transport/carrier/CarrierStep3Location.tsx:23](../Souqoneapp/src/components/transport/carrier/CarrierStep3Location.tsx:23), [EditCarrierProfileModal.tsx:102](../Souqoneapp/src/components/transport/EditCarrierProfileModal.tsx:102) still use the legacy picker; [src/store/carrierWizardStore.ts](../Souqoneapp/src/store/carrierWizardStore.ts) has no `governorateId` field.
4. **Auth signup** ([app/(auth)/register.tsx:186](../Souqoneapp/app/(auth)/register.tsx:186)) also still uses the legacy picker — not a broken request (the backend's legacy `User.governorate` string column still accepts it), but it means every new user signs up without the modern `governorateId` FK populated.

**Not bugs (verified by tracing the full payload path, listed so they aren't re-flagged later):** Parts/Services (`post/step4.tsx` + `step5.tsx`), Equipment (`equipment/new.tsx`) — both keep a cosmetic legacy `governorate` string alongside the correct ID fields but never actually send the string to the backend.

Fixes 2, 4, and the `errors.governorate` check pass cleanly. Fix 1 is correct for the transport-request wizard specifically but incomplete for the Carrier sub-flow. Fix 3 is correct. TypeScript is clean in both repos. The location-system migration is **not app-wide** — it covers Cars, Equipment, Operators, Transport-request, and Parts/Services, but Buses, Jobs, Transport-Carrier, and Auth were never migrated and, for the first three, are currently non-functional against the live backend contract.
