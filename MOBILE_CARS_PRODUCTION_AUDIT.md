# Mobile Cars Add/Edit Flow — Production Readiness Audit

**Repo confirmed:** `C:\Users\DELL\Desktop\Souqoneapp`, remote `github.com/Mahmoud997s/souqoneapp.git`, branch `master` (mobile repo, not `SouqoneWepapp`).
**Backend repo used for DTO comparison:** sibling `C:\Users\DELL\Desktop\SouqoneWepapp` (present locally, read directly — not assumed).
**Read-only audit. No code was modified.**

## ⚠️ Architectural finding that changes the scope of this audit

The premise of this audit — that Phase 1 (`draftData`/`editData` separation in `postStore`) and Phase 2 (`brandId`/`carModelId`/`version` wiring) were implemented for the Cars flow — **does not hold**. Tracing the live routes:

- [app/(tabs)/post.tsx:38](app/(tabs)/post.tsx:38) and [app/(modals)/post-category.tsx:31](app/(modals)/post-category.tsx:31) route the `cars` category straight to `/cars/new`, **never** to `/post/step2` (which is where `postStore` + `CarForm.tsx` live).
- [app/cars/new.tsx](app/cars/new.tsx) is a **separate, parallel implementation** built on [src/store/carWizardStore.ts](src/store/carWizardStore.ts), not `postStore`.
- [src/store/postStore.ts:24-26](src/store/postStore.ts:24) does have a proper `draftData`/`editData` split, and [src/components/post/forms/CarForm.tsx](src/components/post/forms/CarForm.tsx) does have brand/model wiring — but this whole path is **dead code for Cars**: nothing in the live UI ever sets `postStore.category = 'cars'` and routes there (confirmed via `router.push('/post/step2')` call sites — only used by Parts/Services/generic categories, see [app/parts/browse.tsx:115](app/parts/browse.tsx:115), [app/services/browse.tsx:83](app/services/browse.tsx:83)).

**Conclusion: the Phase 1/2 hardening exists, but in a file that no user can reach for Cars.** The actual live Cars flow (`carWizardStore` + `CarStep1-5` + `app/cars/new.tsx`) never received it. The rest of this audit evaluates the **live** flow, and calls out where it diverges from what Phase 1/2 assumed was already true.

---

## A. State Management Correctness

**A1 — 🔴 Critical Gap.** `draftData`/`editData` separation does not exist in the live Cars store. [src/store/carWizardStore.ts:6-18](src/store/carWizardStore.ts:6) has a single `formData` object used for both create and edit, distinguished only by an `editMode?: boolean` flag inside that same object ([src/types/carForm.types.ts:102-103](src/types/carForm.types.ts:102)). The only isolation is in the persist `partialize`, which returns `{}` (skips persistence) when `editMode` is true ([src/store/carWizardStore.ts:127-137](src/store/carWizardStore.ts:127)) — this prevents an edit session from leaking into the *next persisted draft*, but it is not the slice separation the task assumes. `store.details` (postStore's generic bag) is irrelevant here since Cars doesn't use postStore at all in the live path.

**A2 — ⚠️ Needs Fix.** `hasMeaningfulCarData` ([src/components/ui/DraftResumePrompt.ts:62-71](src/components/ui/DraftResumePrompt.ts:62)) checks `data.title || data.price || data.description || data.brandId || data.model || images.length`. Note it checks `data.model` (a cached label string) rather than `data.carModelId` (the actual value written on selection, [src/components/cars/wizard/CarStep3Details.tsx:100-105](src/components/cars/wizard/CarStep3Details.tsx:100)) — functionally works today because both are set together, but it's checking the wrong field for the intended "has the user picked real data" semantic.

**A3 — 🔴 Critical Gap.** Reset behavior across the 4 triggers:
- **Successful publish**: `resetForm()` called correctly, [app/cars/new.tsx:301](app/cars/new.tsx:301).
- **Successful edit-save**: `resetForm()` called correctly, [app/cars/new.tsx:288](app/cars/new.tsx:288).
- **User discards draft**: `resetForm()` called correctly via `handleClearDraft`, [app/cars/new.tsx:102-107](app/cars/new.tsx:102).
- **Logout** ([src/utils/clearUserData.ts:34-46](src/utils/clearUserData.ts:34)): `carWizardStore` is **not in the reset list**. Every other wizard store is (`equipmentWizardStore`, `operatorWizardStore`, `busWizardStore`, `carrierWizardStore`, `transportWizardStore`, `jobProfileStore`, `jobPostStore`, `postStore`, `pinStore`, `chatMessagesStore`, `archiveStore` — 11 stores listed, `carWizardStore` absent). On a shared/family device or a resold phone, the next logged-in user will see the previous user's in-progress car draft (price, location, images, phone-adjacent context) via the draft-resume prompt on `/cars/new`. This is both a privacy leak and a confusing UX bug, and it is a straightforward one-line fix that was evidently missed when the other 11 stores were wired in.

---

## B. API Contract Alignment (mobile ↔ backend)

**B4 — ✅ Confirmed Good.** `brandId`/`carModelId`/`carTrimId` are sent on CREATE ([app/cars/new.tsx:230-232](app/cars/new.tsx:230)), sourced from real master-data IDs via `carsApi.getBrands/getModels/getTrims` ([src/components/cars/wizard/CarStep3Details.tsx:68-81](src/components/cars/wizard/CarStep3Details.tsx:68)). `make`/`model`/`trim` string fields exist in `CarFormData` (cached labels for display) but the payload builder explicitly never includes them — line 230-232 lists only the three ID fields. Cross-checked against [SouqoneWepapp/apps/api/.../create-listing.dto.ts](../SouqoneWepapp/apps/api/src/listings/dto/create-listing.dto.ts): no `make`/`model`/`trim` properties exist on the DTO at all, so there's nothing to accidentally send.

**B5 — 🔴 Critical Gap.** `version` is **never read, stored, or sent**. `CarFormData` has no `version` field ([src/types/carForm.types.ts:47-104](src/types/carForm.types.ts:47)). `setEditMode()` in [app/post/edit/[id].tsx:116-157](app/post/edit/[id].tsx:116) maps ~30 listing fields from the GET response but never reads `listing.version`. The PATCH payload built in `handleSubmit` ([app/cars/new.tsx:203-252](app/cars/new.tsx:203)) has no `version` key.

**B6 — 🔴 Critical Gap (direct consequence of B5).** [SouqoneWepapp/apps/api/.../update-listing.dto.ts:4-6](../SouqoneWepapp/apps/api/src/listings/dto/update-listing.dto.ts:4) declares `version!: number` as **required, not optional** (`@IsInt() version!: number;`, no `@IsOptional()`). Since mobile never sends it, **every edit-save PATCH request from the Cars flow will be rejected by the global `ValidationPipe`** (400, missing required field) before the controller ever runs. This means: **editing a car listing from the mobile app is currently non-functional**, full stop — not a 409-conflict edge case, a guaranteed failure on every attempt. There is consequently no 409 conflict handling to evaluate either (item asked "what does the user see / can they recover" — answer: they see a generic 400 error dialog via `err?.response?.data?.message` at [app/cars/new.tsx:292-293](app/cars/new.tsx:292), and no amount of retrying fixes it because the payload is structurally incomplete).

**B7 — 🔴 Critical Gap.** No legacy-draft guard exists anywhere in the live path (`grep` for guard patterns in `carWizardStore.ts`, `app/cars/new.tsx` returns nothing). Worse, the edit-loader actively **manufactures** the exact bad state the guard was supposed to catch: [app/post/edit/[id].tsx:128-130](app/post/edit/[id].tsx:128):
```
brandId: listing.brandId || listing.make || '',
carModelId: listing.carModelId || listing.modelId || listing.model || '',
carTrimId: listing.carTrimId || listing.trimId || listing.trim || '',
```
For a pre-migration listing with only string `make`/`model` and no `brandId`, this silently assigns `formData.brandId = "Toyota"` (a plain string, not a valid master-data CUID). `validateCarStep` step 3 only checks truthiness (`!formData.brandId`, [src/hooks/useCarValidation.ts:44](src/hooks/useCarValidation.ts:44)), so it passes client-side validation. The brand selector UI won't show it as selected either, since `selectedBrand = brands.find(b => b.id === formData.brandId)` won't match a plain name string ([src/components/cars/wizard/CarStep3Details.tsx:190](src/components/cars/wizard/CarStep3Details.tsx:190)) — so the user sees a "select brand" placeholder that looks unselected while the underlying value is garbage. The failure only surfaces as a confusing backend rejection at final submit (compounded by B6, which already blocks all edit-saves regardless).

**B8 — Out of scope, confirmed unreachable.** Backend exposes `POST /listings/:id/submit`, `/mark-sold`, `/archive`, `/restore` ([SouqoneWepapp/apps/api/.../listings.controller.ts:79-108](../SouqoneWepapp/apps/api/src/listings/listings.controller.ts:79)). `src/api/listings.ts` only wraps `getAll/getById/getMy/create/update/remove/addImages/report` — none of the four status-transition endpoints are called anywhere in the mobile codebase (`grep` across `app/` and `src/api` for `mark-sold|/submit|/archive|/restore` returns nothing). `src/store/archiveStore.ts` is a local-only AsyncStorage toggle unrelated to the backend `archive` endpoint. **Stating explicitly per the task instructions: this is not implemented, not merely descoped by a documented decision** — worth flagging as a product gap even though it's outside this audit's fix list.

---

## C. Validation Completeness

**C9 — ✅ Confirmed Good, with minor gaps.** Comparing [src/hooks/useCarValidation.ts](src/hooks/useCarValidation.ts) against `CreateListingDto`:

| Field | Backend | Mobile | Note |
|---|---|---|---|
| `title` | `@IsString @MaxLength(200)` | required, 5-200 chars ([useCarValidation.ts:23-27](src/hooks/useCarValidation.ts:23)) | mobile stricter (min length) |
| `description` | `@IsString` required | required, 10-2000 chars ([:29-33](src/hooks/useCarValidation.ts:29)) | mobile stricter |
| `year` | `@IsInt @Min(1900) @Max(2030)` required | same range, required ([:52-59](src/hooks/useCarValidation.ts:52)) | matches |
| `price` (SALE) | `@IsNumber @Min(0)` required | required `>0` ([:99-101](src/hooks/useCarValidation.ts:99)) | matches, mobile stricter |
| `governorateId`/`wilayaId` | `@IsInt @IsPositive` required | required ([:90-95](src/hooks/useCarValidation.ts:90)) | matches |
| `brandId`/`carModelId` | `@IsString @IsNotEmpty` required | required ([:44-50](src/hooks/useCarValidation.ts:44)) | matches |
| `fuelType`/`transmission`/`bodyType`/`driveType`/`exteriorColor`/`condition` | all `@IsOptional()` | required for non-WANTED ([:61-86](src/hooks/useCarValidation.ts:61)) | mobile stricter — fine, better UX |
| `mileage` | `@IsOptional @IsInt @Min(0)` | required unless condition=NEW ([:67-69](src/hooks/useCarValidation.ts:67)) | mobile stricter |

No field is *looser* than the backend, so the "submit and get a confusing 400" failure mode this item is checking for doesn't occur from a validation-strictness gap. The one real gap is **B5/B6 above** — validation completeness is fine, but the edit payload is structurally missing a required field that no client-side check catches (because `CarFormData` doesn't model `version` at all, there's nothing to validate).

**C10 — ⚠️ Needs Fix (low severity).** All numeric fields (`price`, `mileage`, `engineSize`, `horsepower`, `doors`, `seats`, `dailyPrice`, `monthlyPrice`, `depositAmount`, `minRentalDays`, `kmLimitPerDay`) use `keyboardType="numeric"` + `maxLength` only ([src/components/cars/wizard/CarStep4Location.tsx:48-52](src/components/cars/wizard/CarStep4Location.tsx:48), [CarStep3Details.tsx:441-482](src/components/cars/wizard/CarStep3Details.tsx:441)) — no explicit stripping of non-digit characters in [src/components/ui/AppInput.tsx](src/components/ui/AppInput.tsx) (it's a raw passthrough, [AppInput.tsx:56-81](src/components/ui/AppInput.tsx:56)). Values are coerced with `Number(formData.field)` at submit time ([app/cars/new.tsx:209-251](app/cars/new.tsx:209)). Risk is low in practice (native numeric keypads don't offer commas/letters), but there's no defense against pasted text (e.g. "12,000" from clipboard) — `Number("12,000")` is `NaN`, which serializes to `null` in JSON and would fail the backend's `@IsNumber`/`@IsInt` check with a raw 400. Submission **is** correctly JSON (not multipart) — `apiClient` defaults to `Content-Type: application/json` ([src/api/client.ts:8](src/api/client.ts:8)); only the separate `uploadsApi.single` calls use multipart, as they should.

---

## D. Image Handling

**D11 — 🔴 Critical Gap.** Add/remove work correctly ([src/hooks/useCarFormLogic.ts:18-81](src/hooks/useCarFormLogic.ts:18)). **Reorder and set-as-cover do not exist as features at all** — [src/components/cars/wizard/CarStep2Images.tsx](src/components/cars/wizard/CarStep2Images.tsx) has no drag handles or "make cover" action; the cover is implicitly whichever image is at index 0 ([CarStep2Images.tsx:77-79](src/components/cars/wizard/CarStep2Images.tsx:77)). More seriously, **the entire edit-mode image write path is dead code**:
- New images are uploaded via `uploadsApi.single()` to get URLs ([app/cars/new.tsx:176-190](app/cars/new.tsx:176)), but the update payload explicitly excludes `images` when `editMode` is true: `...(formData.editMode ? {} : { images: ... })` ([app/cars/new.tsx:234](app/cars/new.tsx:234)).
- The `onSuccess` handler for edit builds a `FormData` object from the already-uploaded URLs but **never sends it anywhere** — the code is literally followed by comments admitting it's unfinished: *"This depends on how the backend addImages works... It's safer to rely on full update if possible or ignore..."* ([app/cars/new.tsx:260-270](app/cars/new.tsx:260)).
- `removedImageIds` is tracked correctly on the client ([useCarFormLogic.ts:64-81](src/hooks/useCarFormLogic.ts:64)) but is **never sent to any delete endpoint** — the code block for it is an empty comment: *"Delete logic might need custom route..."* ([app/cars/new.tsx:271-273](app/cars/new.tsx:271)).

**Net effect: editing a car listing's photos does nothing.** Newly picked images get uploaded to storage (orphaned files, never attached to the listing) and the success dialog still tells the user *"تم تحديث بيانات الإعلان والصور بنجاح"* (images updated successfully) — a false positive, since `imagesSuccess` only flips to `false` on a thrown exception, and no exception is thrown because no network call is made.

This is not a hypothetical gap — the working pattern already exists one file over. [app/equipment/new.tsx:227-232](app/equipment/new.tsx:227) does this correctly:
```
if (newImageUrls.length > 0) {
  await equipmentApi.addImages(formData.editListingId!, newImageUrls)
}
if (formData.removedImageIds && formData.removedImageIds.length > 0) {
  for (const imgId of formData.removedImageIds) {
    await equipmentApi.removeImage(imgId)
  }
}
```
The mobile app also already has `uploadsApi.removeListingImage(listingId, imageId)` ([src/api/uploads.ts:11-12](src/api/uploads.ts:11)) and `listingsApi.addImages(id, formData)` ([src/api/listings.ts:15-18](src/api/listings.ts:15)) available and unused for this purpose. Backend-side ownership/limit/domain checks were out of scope to re-verify here (this is a mobile audit) but are moot until the mobile call sites exist.

**D12 — 🔴 Critical Gap (partially overlaps D11 for create-mode).** In the CREATE-mode image loop ([app/cars/new.tsx:165-195](app/cars/new.tsx:165)), images are uploaded **sequentially, one at a time**, inside a `try/catch` that on a single failed upload only does `console.warn('Image upload error:', uploadErr)` ([app/cars/new.tsx:188-190](app/cars/new.tsx:188)) and continues the loop — the image is silently dropped from `finalImageUrls`. There is no per-image retry affordance, no indication to the user in the final success dialog that N of M images failed, and no way to know which image was lost without re-opening the form and comparing.

---

## E. Network Resilience & Error Handling

**E13 — ⚠️ Needs Fix.** On network failure during publish/save, the global axios interceptor shows a generic dialog for `Network Error` ([src/api/client.ts:45-46](src/api/client.ts:45)) and 5xx ([client.ts:43-44](src/api/client.ts:43)); the mutation's own `onError` also fires with `err?.response?.data?.message` ([app/cars/new.tsx:304-306](app/cars/new.tsx:304)) — so failure is surfaced, not silent. The draft **does survive** a failed submit: `resetForm()` is only called inside `onSuccess`, never `onError`, so `carWizardStore`'s persisted `formData` is untouched on failure and the user can retry. One caveat: any images that already finished uploading via `uploadsApi.single()` in the create-mode loop before a later step fails are orphaned uploads (not cleaned up, not reused on retry — the retry re-uploads from local URIs again since `formData.images` still holds the original picker assets, not the returned URLs).

**E14 — ⚠️ Needs Fix.** `handleSubmit`'s image-processing block *is* wrapped in try/catch ([app/cars/new.tsx:157-200](app/cars/new.tsx:157)), and the mutations have `onError` handlers, so the two most likely crash points are covered. However `formLogic.handleLocationChange`, `onToggleFeature`, and the various `onUpdateField` calls run synchronously with no guards — low risk since they're pure state setters, but note `Number(formData.horsepower)` etc. at payload-build time ([app/cars/new.tsx:209-251](app/cars/new.tsx:209)) is not wrapped and could theoretically send `NaN`→`null` through JSON on bad input (see C10) — this fails as a clean 400 from the backend, not a client crash, so it's not a crash risk, just a confusing error path.

**E15 — ⚠️ Needs Fix (low severity).** No 429-specific handling anywhere in `src/api/client.ts` — the interceptor only special-cases `>=500` and `Network Error` ([client.ts:43-46](src/api/client.ts:43)); a 429 falls through with no interceptor-level dialog and relies entirely on the mutation's `onError` showing `err?.response?.data?.message`. Backend's `CustomThrottlerGuard` ([SouqoneWepapp/apps/api/src/common/guards/custom-throttler.guard.ts](../SouqoneWepapp/apps/api/src/common/guards/custom-throttler.guard.ts)) doesn't override the default NestJS throttler message, so the user would see a raw, non-Arabic string like `"ThrottlerException: Too Many Requests"` in the alert dialog rather than a localized, user-friendly message.

---

## F. UX Consistency (vs Equipment/Operators)

**F16 — ✅ Confirmed Good.** Cars closely mirrors Equipment's conventions: identical `dialogService.confirm(...)` wording for draft-clear ([app/cars/new.tsx:103](app/cars/new.tsx:103) vs [app/equipment/new.tsx:98](app/equipment/new.tsx:98) — both "مسح المسودة" / same confirm text), identical success/error dialog structure and copy pattern (`'تم بنجاح'`, `'خطأ'`, array-join for validation-error arrays), identical permission-request alert wording in the image picker hook (compare [useCarFormLogic.ts:22-25](src/hooks/useCarFormLogic.ts:22) to [src/hooks/useEquipmentFormLogic.ts:34](src/hooks/useEquipmentFormLogic.ts:34)). Validation-error timing (on-blur via step-advance, not live-as-you-type) also matches Equipment's `validateEquipmentStep` pattern. No inconsistency found here — this is the one area of the flow that's in good shape.

---

## G. Code Quality / Maintainability

**G17 — ✅ Confirmed Good / no action needed.** Create and Edit are **not duplicated** — both flow through the single [app/cars/new.tsx](app/cars/new.tsx) component, branching only on `formData.editMode` at submit time ([app/cars/new.tsx:254-309](app/cars/new.tsx:254)) and in a couple of UI labels ([:323](app/cars/new.tsx:323), [:414](app/cars/new.tsx:414)). This is good architecture, not a DRY violation to flag.

**G18 — ⚠️ Needs Fix.** `mutationFn: (data: any) => listingsApi.create(data)` and `{ id, data }: { id: string; data: any }` both type the payload as `any` ([app/cars/new.tsx:41,44](app/cars/new.tsx:41)) — no compile-time check that the constructed payload actually matches what the backend expects (which is exactly how B5's missing `version` field went unnoticed). `images: any[]` / `existingImages: any[]` in `CarFormData` ([src/types/carForm.types.ts:98-99](src/types/carForm.types.ts:98)) also loses type safety around the `{id, url}` vs picker-asset vs raw-string shapes juggled throughout `CarStep2Images.tsx` and `useCarFormLogic.ts`.

**G19 — ⚠️ Needs Fix.** The `20`-image limit is hardcoded independently in three places: [src/hooks/useCarFormLogic.ts:32,42](src/hooks/useCarFormLogic.ts:32), [src/components/cars/wizard/CarStep2Images.tsx:27](src/components/cars/wizard/CarStep2Images.tsx:27), and [src/hooks/useCarValidation.ts:39](src/hooks/useCarValidation.ts:39) — matches the backend's `@ArrayMaxSize(20)` today but there's no single source of truth, so a future backend change would require hunting three call sites. Also, `make`/`model`/`trim` remain as live fields in `CarFormField`/`CarFormData` ([src/types/carForm.types.ts:38-40,91-93](src/types/carForm.types.ts:38)) purely as UI display-label caches for the review screen — reasonable in intent, but see F-related bug below (edit mode never populates them, so the review screen shows blank brand/model/trim after loading an existing listing for edit: `setEditMode()` at [app/post/edit/[id].tsx:116-157](app/post/edit/[id].tsx:116) sets `brandId`/`carModelId`/`carTrimId` but never `make`/`model`/`trim`, while `CarStep5Review.tsx:182,189,196` reads `formData.make`/`model`/`trim` — not resolved from the fetched brand/model/trim lists at all).

---

## H. Security

**H20 — ✅ Confirmed Good, with a caveat.** No auth tokens or user PII are logged in the Cars-specific files — all `console.warn`/`console.error` calls log generic error objects, not tokens or personal data (`app/cars/new.tsx:189,197,276`; `CarStep3Details.tsx:68,73,81`). Caveat: [babel.config.js](babel.config.js) has no console-stripping plugin (e.g. `transform-remove-console`), so these `console.*` calls do ship in production JS bundles and will execute on-device. No remote log aggregator (Sentry, etc.) was found in the codebase (`grep` for `Sentry|@sentry` across `src`/`app` returns nothing), so exposure is limited to local device logs reachable only via USB debugging — low real-world risk today, but worth noting since axios error objects passed to `console.warn` do carry `.config.headers.Authorization` if anyone later wires up a remote logger without first sanitizing what gets logged.

**H21 — ✅ Confirmed Good.** `src/constants/config.ts` sources `apiUrl`/`socketUrl`/`cloudName` exclusively from `EXPO_PUBLIC_*` env vars ([src/constants/config.ts:1-5](src/constants/config.ts:1)) — no hardcoded URLs found in the Cars flow files.

---

## GAPS TO CLOSE (prioritized by production risk)

1. **🔴 P0 — Editing a car listing is completely broken.** `version` is never modeled, read, or sent, but the backend's `UpdateListingDto.version` is required. Every edit-save PATCH will 400. *(B5, B6)*
2. **🔴 P0 — Editing a car listing's photos silently does nothing.** New images upload to storage but are never attached; removed images are never deleted; the user sees a false "success" message. Working reference implementation already exists in `app/equipment/new.tsx:227-232`. *(D11)*
3. **🔴 P0 — Draft/edit data survives logout.** `carWizardStore` is the only wizard store missing from `clearUserData.ts`'s reset list — a real data-leak risk on shared devices, and a one-line fix. *(A3)*
4. **🔴 P1 — Legacy listings without `brandId` silently corrupt the edit form.** `listing.make` (a string) gets assigned into the `brandId` slot with no guard and no validation catch, surfacing only as a confusing failure at submit — compounded by #1 above, which blocks the submit anyway. *(B7)*
5. **🟡 P1 — Edit mode shows blank brand/model/trim on the review screen.** `setEditMode()` never populates the `make`/`model`/`trim` label fields that `CarStep5Review` reads. *(G19)*
6. **🟡 P2 — Silent, unrecoverable per-image upload failures on create.** Sequential uploads, one `console.warn` per failure, no retry affordance, no user-facing count of what was dropped. *(D12)*
7. **🟡 P2 — No reorder / set-cover image UX**, cover is implicit (index 0 only). *(D11)*
8. **🟡 P2 — Status transitions (submit/mark-sold/archive/restore) exist on the backend but are entirely unreachable from the mobile Cars UI.** *(B8)*
9. **🟢 P3 — `any`-typed payloads** removed the type safety that would have caught #1 at compile time; hardcoded `20`-image limit duplicated three times; raw, non-localized 429 messages. *(G18, G19, E15)*
10. **🟢 P3 (process note, not a code defect) — Re-scope the "Phase 1/2 already done" assumption.** The hardened `postStore`/`CarForm.tsx` implementation is real and correct, but it is dead code for Cars. Either migrate Cars onto that implementation, or explicitly retire it and port its `version`/legacy-guard logic into `carWizardStore` — right now the codebase carries two competing Cars implementations, only one of which is live, and it's the less-hardened one.
