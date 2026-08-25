# Backend ↔ Mobile Cars Contract Alignment Report

**Read-only. Nothing modified.** Both repos read fresh for this pass:
- Backend: `C:\Users\DELL\Desktop\SouqoneWepapp\apps\api\src\listings\*`, `uploads\*`, `common\filters\*`, `main.ts`, `app.module.ts`, `prisma\schema.prisma`
- Mobile (live Cars flow only — `carWizardStore` + `app/cars/new.tsx` + `app/post/edit/[id].tsx`, confirmed in the prior audit to be the only reachable path): `app/cars/new.tsx`, `app/post/edit/[id].tsx`, `src/store/carWizardStore.ts`, `src/hooks/useCarValidation.ts`, `src/hooks/useCarFormLogic.ts`, `src/components/cars/wizard/*`, `src/api/listings.ts`, `src/api/uploads.ts`, `src/api/client.ts`

---

## 1. CREATE endpoint — `POST /listings`

Source: [SouqoneWepapp/apps/api/src/listings/dto/create-listing.dto.ts](../SouqoneWepapp/apps/api/src/listings/dto/create-listing.dto.ts) (163 lines, read in full) vs. [app/cars/new.tsx:203-252](app/cars/new.tsx:203) (`handleSubmit`, non-`editMode` branch).

| Backend field | Backend rule | Mobile sends? | Mobile client-validates? | Mismatch |
|---|---|---|---|---|
| `title` | `@IsString @MaxLength(200)`, required | yes, `.trim()` | yes, 5–200 chars ([useCarValidation.ts:23-27](src/hooks/useCarValidation.ts:23)) | no |
| `description` | `@IsString`, required | yes, `.trim()` | yes, 10–2000 chars ([:29-33](src/hooks/useCarValidation.ts:29)) | no |
| `year` | `@IsInt @Min(1900) @Max(2030)`, required | yes, `Number(formData.year)` | yes, same range ([:52-59](src/hooks/useCarValidation.ts:52)) | no |
| `price` | `@IsNumber @Min(0)`, **required (no `@IsOptional`)** | yes — `Number(price)` for SALE; **hardcoded `0` for RENTAL**; `Number(price)||0` for WANTED | only for SALE (`>0`, [:99-101](src/hooks/useCarValidation.ts:99)) | no — backend accepts 0, mobile's hardcoded 0 for RENTAL satisfies `@Min(0)` |
| `mileage` | `@IsOptional @IsInt @Min(0)` | yes (0 if condition=NEW, else `Number(mileage)`) | required unless NEW ([:67-69](src/hooks/useCarValidation.ts:67)) | no |
| `fuelType` | `@IsOptional @IsEnum(FuelType)` | yes if set | required for non-WANTED ([:71-73](src/hooks/useCarValidation.ts:71)) | no |
| `transmission` | `@IsOptional @IsEnum(Transmission)` | yes if set | required for non-WANTED ([:80-82](src/hooks/useCarValidation.ts:80)) | no |
| `bodyType` | `@IsOptional @IsString` (free string) | yes if set | required for non-WANTED ([:74-76](src/hooks/useCarValidation.ts:74)) | no |
| `exteriorColor` | `@IsOptional @IsString` | yes if set | required for non-WANTED ([:83-85](src/hooks/useCarValidation.ts:83)) | no |
| `interior` | `@IsOptional @IsString` | yes if set | **not validated** (optional both sides) | no |
| `engineSize` | `@IsOptional @IsString` | yes if set | **not validated** (optional both sides) | no |
| `horsepower` | `@IsOptional @IsInt` | yes, `Number(...)` | **not validated** — no numeric-range check, only `maxLength={4}` on the input | no (backend also has no range) |
| `doors` | `@IsOptional @IsInt` | yes, `Number(...)` | not validated | no |
| `seats` | `@IsOptional @IsInt` | yes, `Number(...)` | not validated | no |
| `driveType` | `@IsOptional @IsString` | yes if set | required for non-WANTED ([:77-79](src/hooks/useCarValidation.ts:77)) | no |
| `features` | `@IsOptional @IsArray @IsString({each:true})` | yes if non-empty | not required, free text via chips + custom-add ([CarStep3Details.tsx:99-107](src/components/cars/wizard/CarStep3Details.tsx:99)) | no |
| `currency` | `@IsOptional @IsString` | **never sent** | n/a | no — backend defaults to `'OMR'` server-side ([listings.service.ts:163](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:163)), matches mobile's assumed currency |
| `isPriceNegotiable` | `@IsOptional @IsBoolean` | yes | n/a (switch, always boolean) | no |
| `condition` | `@IsOptional @IsEnum(ItemCondition)` | yes if set | required for non-WANTED ([:61-63](src/hooks/useCarValidation.ts:61)) | no |
| `listingType` | `@IsOptional @IsEnum(ListingType)` — **optional on backend** | always sent | **required client-side** ([:20-22](src/hooks/useCarValidation.ts:20)) | mobile stricter, not a bug |
| `dailyPrice` | `@IsOptional @IsNumber @Min(0)` | yes for RENTAL | **see finding below — mismatch** | **YES, see New Mismatch #1** |
| `monthlyPrice` | `@IsOptional @IsNumber @Min(0)` | yes for RENTAL | see below | see New Mismatch #1 |
| `withDriver` | `@IsOptional @IsBoolean` | yes for RENTAL | n/a | no |
| `depositAmount` | `@IsOptional @IsNumber @Min(0)` | yes for RENTAL | not required | no |
| `minRentalDays` | `@IsOptional @IsInt @Min(1)` | yes for RENTAL | not required, but note: `@Min(1)` on backend — mobile sends `Number(formData.minRentalDays)` with no client floor check, so a user-entered `0` would pass mobile but fail backend `@Min(1)` | **minor mismatch, not previously found** |
| `kmLimitPerDay` | `@IsOptional @IsInt @Min(0)` | yes for RENTAL | not required | no |
| `cancellationPolicy` | `@IsOptional @IsString` | yes for RENTAL | not required | no |
| `deliveryAvailable` | `@IsOptional @IsBoolean` | yes for RENTAL | n/a | no |
| `insuranceIncluded` | `@IsOptional @IsBoolean` | yes for RENTAL | n/a | no |
| `governorateId` | `@IsInt @IsPositive`, **required** | yes, `Number(...)` | required ([:90-92](src/hooks/useCarValidation.ts:90)) | no |
| `wilayaId` | `@IsInt @IsPositive`, **required** | yes, `Number(...)` | required ([:93-95](src/hooks/useCarValidation.ts:93)) | no |
| `latitude`/`longitude` | `@IsOptional @IsLatitude/@IsLongitude` | yes if set | n/a (map picker only writes valid coords) | no |
| `brandId` | `@IsString @IsNotEmpty`, **required** | yes | required ([:44-46](src/hooks/useCarValidation.ts:44)) | no |
| `carModelId` | `@IsString @IsNotEmpty`, **required** | yes | required ([:48-50](src/hooks/useCarValidation.ts:48)) | no |
| `carTrimId` | `@IsOptional @IsString` | yes if set | not required | no |
| `images` | `@IsOptional @IsArray @IsString(each) @ArrayMaxSize(20)` | yes, uploaded URLs | required unless WANTED, max 20 ([useCarValidation.ts:37-41](src/hooks/useCarValidation.ts:37)) | no |
| `make`/`model`/`trim` | **do not exist on the DTO** | never sent (confirmed at [app/cars/new.tsx:203-252](app/cars/new.tsx:203) — only ID fields present) | n/a | no |

**No fields are looser client-side than server-side**, confirming the prior audit's C9 finding still holds under fresh reading. The one real defect in this table is the RENTAL price rule (New Mismatch #1 below) — everything else is either exact-match or mobile-stricter.

---

## 2. UPDATE endpoint — `PATCH /listings/:id`

Source: [SouqoneWepapp/apps/api/src/listings/dto/update-listing.dto.ts](../SouqoneWepapp/apps/api/src/listings/dto/update-listing.dto.ts) (166 lines) + [listings.service.ts:341-484](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:341) (`update()` merged-state logic) vs. [app/cars/new.tsx:203-296](app/cars/new.tsx:203) (`editMode` branch).

| Backend requirement | What triggers it | Mobile provides it? | Consequence |
|---|---|---|---|
| `version: number` — **required**, checked explicitly in the controller before the service even runs: `if (dto.version === undefined) throw new BadRequestException('version is required')` ([listings.controller.ts:63-65](../SouqoneWepapp/apps/api/src/listings/listings.controller.ts:63)) | every PATCH | **No.** `CarFormData` has no `version` field at all ([carForm.types.ts:47-104](src/types/carForm.types.ts:47)); `setEditMode()` never reads `listing.version` ([app/post/edit/[id].tsx:116-157](app/post/edit/[id].tsx:116)) | **Every edit-save 400s at the controller guard, before the service or DB is even touched.** (Already known — reconfirmed with the exact controller-level guard this time, which is even earlier/harder-fail than previously documented.) |
| Optimistic concurrency: `repo.update()` does `where: { id, version: expectedVersion }` ([listings.repository.ts:76-95](../SouqoneWepapp/apps/api/src/listings/listings.repository.ts:76)); a mismatch (or a **deleted listing**) produces Prisma `P2025`, converted to `409 ConflictException` | any edit where the DB's actual version ≠ submitted version, **or the id itself no longer exists** | n/a — never reached because of the above | 409 is unreachable today, but worth noting for later: a **deleted** listing produces the *same* "someone else edited this" 409 message as a real version conflict — no distinct "this listing was deleted" message. Backend nuance, not a mobile fix. |
| Rental merged-state check: if any rental field changes, `effectiveDailyPrice = dto.dailyPrice ?? Number(listing.dailyPrice)`; if `effectiveListingType === 'RENTAL'` and `!effectiveDailyPrice \|\| effectiveDailyPrice <= 0` → 400 ([listings.service.ts:364-389](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:364)) | editing any rental-adjacent field | mobile's edit payload always includes `dailyPrice`/`monthlyPrice` per the same construction as create ([app/cars/new.tsx:241-242](app/cars/new.tsx:241)) — same monthlyPrice-only gap as create | **Same as New Mismatch #1**, now confirmed to also apply to edit |
| Canonical Identity Update block: triggers whenever `dto.brandId \|\| dto.carModelId \|\| dto.carTrimId !== undefined` ([listings.service.ts:392](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:392)) | **mobile always sends `brandId` and `carModelId` unconditionally** on every edit ([app/cars/new.tsx:230-231](app/cars/new.tsx:230): no `\|\| undefined` fallback on these two, unlike `carTrimId`) | → **this block runs on literally every single car edit**, no exceptions | Re-validates brand/model/trim server-side every time (fine when data is valid) — but see **New Mismatch #2**, which shows this is the exact mechanism that turns the previously-found B7 legacy-guard gap from "edge case" into "always fails" |
| Status guard: `if (listing.status === 'SUSPENDED' \|\| listing.status === 'SOLD') throw ForbiddenException(...)` ([listings.service.ts:351-353](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:351)) | editing a SOLD/SUSPENDED listing | mobile never checks `status` before allowing edit entry (see **New Mismatch #3**) | 403 only surfaces after the user completes the whole 5-step wizard |
| Location pair re-validation (`geoService.validateLocationPair`) if either `governorateId`/`wilayaId` changes | edit touching location | mobile always sends both (required in step 4) | no mismatch — same IDs round-tripped |
| All other scalar fields (`title`, `description`, `mileage`, `fuelType`, etc.) — every one is `@IsOptional`, applied via `if (dto.field !== undefined) data.field = dto.field` patch-merge semantics ([listings.service.ts:418-459](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:418)) | n/a | mobile sends the **full form state** every time (not a sparse diff) — since every field in `CarFormData` is always populated when submitting from a fully-loaded edit session, this is functionally a full overwrite, which matches backend's merge semantics correctly (no field gets accidentally nulled by omission) | no mismatch |

**Net for item 2:** beyond the already-known `version` blocker, there are two additional, concrete update-path defects: the RENTAL price rule (shared with create) and the fact that the canonical-identity re-validation block is **unconditionally triggered on every edit**, which is precisely what makes the legacy-brandId-fallback bug (originally flagged as B7 in the prior audit) a guaranteed failure rather than a rare edge case.

---

## 3. Status command endpoints

`POST /listings/:id/submit`, `/mark-sold`, `/archive`, `/restore` all exist ([listings.controller.ts:79-107](../SouqoneWepapp/apps/api/src/listings/listings.controller.ts:79)), each requiring `@Body('version') version: number` with the same `BadRequestException('version is required')` guard as update, then delegating to `executeStatusTransition()` ([listings.service.ts:504-529](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:504)), which enforces a state machine (`DRAFT→PENDING_REVIEW/ACTIVE`, `ACTIVE→SOLD/ARCHIVED`, `ARCHIVED→ACTIVE`, `SOLD→` nothing) and the same optimistic-concurrency `version` check.

**Confirmed: none of the four are reachable from any mobile Cars screen.** `grep` across `app/` and `src/api/listings.ts` for `mark-sold|/submit|/archive|/restore` returns nothing; `src/store/archiveStore.ts` is an unrelated local-only AsyncStorage toggle, not a call to the backend `archive` endpoint. **This is a genuine capability gap, not a documented out-of-scope decision** — there is no My-Listings UI affordance to mark a car sold, archive it, or resubmit it, so a car listing can currently only ever be created and (once B5/B6 are fixed) edited or deleted; it can never transition to SOLD/ARCHIVED from the app.

---

## 4. `GET /listings/:id` response shape vs. mobile's edit-prefill (`setEditMode`)

Backend response = every scalar column on `model Listing` ([schema.prisma:188-268](../SouqoneWepapp/apps/api/prisma/schema.prisma:188)) plus `PUBLIC_LISTING_INCLUDE` relations: `seller` (limited fields), `images`, `governorateRef`, `wilayaRef` ([listings.repository.ts:5-21](../SouqoneWepapp/apps/api/src/listings/listings.repository.ts:5)).

Cross-checked against [app/post/edit/[id].tsx:116-157](app/post/edit/[id].tsx:116):

**Fields the backend sends that mobile silently ignores:**
- `version` — critical, already covered (B5/B6).
- `status` — new finding, see **New Mismatch #3**.
- `slug`, `isPremium`, `featuredUntil`, `viewCount`, `createdAt`, `updatedAt` — not needed for an edit form, fine to ignore.
- `currency` — ignored; harmless since mobile never sends `currency` back either, so the server-side value is untouched regardless.
- `make`/`model`/`trim` (the raw resolved strings on the listing) — mobile reads them only as ID-fallbacks in the legacy-guard chain (B7), never as the display-label cache (`formData.make`/`model`/`trim`) that `CarStep5Review.tsx` actually renders — this is the previously-found G19 blank-review-label bug, now traced to its exact root cause: `setEditMode()` populates `brandId`/`carModelId`/`carTrimId` but never `make`/`model`/`trim`.

**Fields mobile's fallback chain references that do not exist on the real response — dead code, not live bugs:**
- `listing.modelId` and `listing.trimId` ([app/post/edit/[id].tsx:129-130](app/post/edit/[id].tsx:129): `carModelId: listing.carModelId || listing.modelId || listing.model || ''`) — the Prisma schema and `PUBLIC_LISTING_INCLUDE` only ever produce `carModelId`/`carTrimId`, never `modelId`/`trimId`. These `||` branches can never fire; harmless but misleading (reads as if there's a second valid field name, there isn't).

**New Mismatch #4 (cosmetic, self-healing):** `governorateName: listing.governorateName || listing.governorate?.nameAr || ''` and the `wilayaName` equivalent ([app/post/edit/[id].tsx:124-125](app/post/edit/[id].tsx:124)) — `listing.governorateName` doesn't exist on the response at all, and `listing.governorate` is a **legacy plain string** column (`governorate String?`, [schema.prisma:238](../SouqoneWepapp/apps/api/prisma/schema.prisma:238)), not an object — so `.nameAr` on it is always `undefined`. The real relation is `governorateRef.nameAr` / `wilayaRef.nameAr`, never read. In practice this is **cosmetic only**: `GovernorateWilayaSelect.tsx` independently fetches the full governorate/wilaya list and resolves the display label from `governorateId`/`wilayaId` itself (`activeGov?.nameAr || fallbackGovName || 'اختر المحافظة'`, [GovernorateWilayaSelect.tsx:66-70](src/components/ui/GovernorateWilayaSelect.tsx:66)) — since `governorateId`/`wilayaId` *are* correctly populated by `setEditMode`, the always-empty `fallbackGovName`/`fallbackCityName` props only matter during the brief window before that component's own fetch resolves, or if IDs don't match any fetched item.

---

## 5. Image endpoints — backend inventory vs. mobile usage

Backend routes, all in [uploads.controller.ts](../SouqoneWepapp/apps/api/src/uploads/uploads.controller.ts), business logic in [upload-image-manager.service.ts](../SouqoneWepapp/apps/api/src/uploads/upload-image-manager.service.ts):

| Route | Method | Purpose | Ownership check | Server-side rules | Called from mobile Cars flow? |
|---|---|---|---|---|---|
| `/uploads` | POST (multipart) | raw file upload → storage URL | n/a (any authed user) | 10MB file size limit | **Yes** — `uploadsApi.single()` ([src/api/uploads.ts:5-7](src/api/uploads.ts:5)), used in both create and (uselessly, per D11) edit |
| `/uploads/listings/:listingId/images` | POST (multipart) | upload file + attach directly to listing, optional `isPrimary` | `sellerId === userId`, 403 otherwise ([upload-image-manager.service.ts:22-25](src/uploads/upload-image-manager.service.ts:22)) | 20-image cap (row-locked via `FOR UPDATE`, [:29,38-40](src/uploads/upload-image-manager.service.ts:29)), auto-primary logic | **No — never called.** |
| `/uploads/listings/:listingId/images/url` | POST (JSON `{url, isPrimary?}`) | attach an already-uploaded URL to a listing | same ownership check | **trusted-domain check: only accepts URLs containing `cloudinary.com` or `localhost`, else 400** ([uploads.controller.ts:82-84](../SouqoneWepapp/apps/api/src/uploads/uploads.controller.ts:82)) | **No — never called.** This is the endpoint that should have been used to finish attaching the URLs obtained from `uploadsApi.single()` in edit mode — its absence is the direct mechanism behind the previously-found D11 dead-code bug. |
| `/uploads/listings/:listingId/images/:imageId` | DELETE | remove one image | same ownership check; auto-reassigns `isPrimary` to the new first image if the deleted one was primary ([:68-76](src/uploads/upload-image-manager.service.ts:68)) | — | **Wrapped** as `uploadsApi.removeListingImage()` ([src/api/uploads.ts:11-12](src/api/uploads.ts:11)) but **never called from `app/cars/new.tsx`** (D11) |
| `/uploads/listings/:listingId/images/reorder` | PATCH (`{imageIds: string[]}`) | reorder + re-derive primary (index 0 = primary) | same ownership check; validates every id belongs to the listing, 403/400 otherwise ([:86-98](src/uploads/upload-image-manager.service.ts:86)) | — | **No mobile wrapper exists at all** in `src/api/uploads.ts` — confirms the prior audit's "no reorder UI" finding is not just a missing screen, it's a fully-built, unconsumed backend capability. |
| `/uploads/listings/:listingId/images` | GET | list a listing's images, ordered `order: asc` | none (public) | — | Not used; mobile instead relies on the nested `images` array from `GET /listings/:id`, which is a reasonable substitute *except* that array has no explicit `orderBy` (see **New Mismatch #6**). |

**Also checked:** `src/api/listings.ts` has an `addImages(id, formData)` helper posting multipart to `/listings/:id/images` ([src/api/listings.ts:15-18](src/api/listings.ts:15)) — **this route does not exist on the backend at all.** `listings.controller.ts` has no `:id/images` route; the real image routes all live under `/uploads/listings/:listingId/...` as shown above. **New Mismatch #5**: this is dead mobile code pointing at a non-existent endpoint (would 404 if ever called — it currently isn't called from the Cars flow, so it's inert today, but it's a landmine for anyone who wires it up expecting it to work).

---

## 6. Error response handling

`GlobalExceptionFilter` ([common/filters/http-exception.filter.ts](../SouqoneWepapp/apps/api/src/common/filters/http-exception.filter.ts)) normalizes **every** error to `{ statusCode, error, message: string[], timestamp }` — `message` is always coerced to an array even for single-string errors. This matters because mobile's error handlers do `Array.isArray(msg) ? msg.join('\n') : msg` ([app/cars/new.tsx:293,306](app/cars/new.tsx:293)) — the non-array branch is dead code (backend never sends a bare string), but harmless.

| Status | When (create/update/image endpoints) | Mobile handling today |
|---|---|---|
| **400** Validation (`class-validator`, `whitelist`+`forbidNonWhitelisted`+`transform` all on, [main.ts:49-53](../SouqoneWepapp/apps/api/src/main.ts:49)) | bad field format, missing required field, extra non-whitelisted field (whole request rejected, not stripped) | mutation `onError` shows `err.response.data.message.join('\n')` — **generic but correctly displays the real message array**, e.g. all field errors at once ([app/cars/new.tsx:304-306](app/cars/new.tsx:304)) |
| **400** Business-rule (duplicate model/brand mismatch, rental price missing, canonical identity missing) | e.g. `'الموديل لا يتبع للماركة'`, `'سعر الإيجار اليومي مطلوب لإعلانات الإيجار'` | same generic `onError` — message text is correct and in Arabic, but there's no field-specific inline mapping back to the relevant wizard step; user must re-read the whole form to find what's wrong. Not a crash, just imprecise. |
| **401** Unauthorized | expired/invalid token | handled globally by the axios interceptor's refresh-then-retry flow ([src/api/client.ts:17-40](src/api/client.ts:17)); on unrecoverable refresh failure, `useAuthStore.getState().logout()` fires — **not surfaced as a Cars-specific message**, but functionally correct (user is logged out, not stuck on a silent failure) |
| **403** Forbidden (not the owner, or editing a SOLD/SUSPENDED listing) | edit/status-change on someone else's listing, or a locked listing | generic `onError` shows the raw message — correct text, but see **New Mismatch #3**: for the SOLD/SUSPENDED case specifically, this is the *only* signal the user gets, and only after completing the entire form |
| **404** Not Found (listing/brand/model/trim/image not found) | listing deleted, stale master-data id | generic `onError` — text is correct; no distinct "go back and refresh" affordance, user is just shown the Arabic error string |
| **409** Conflict — two distinct causes: (a) version mismatch on update/status commands, (b) duplicate-content detection on create (same title+description+price+brandId within 5 minutes, [listings.service.ts:85-102](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:85)) | edit race condition (currently unreachable, blocked earlier by missing `version`); or resubmitting the same create payload quickly (e.g. retry after a timeout) | generic `onError` shows the raw message for both — **but mobile cannot distinguish "someone/something else changed this" from "you already created this exact listing"**, and for case (b) specifically there is no way for the user to tell from the dialog alone whether their *first* attempt actually succeeded. This is a genuinely new finding: **New Mismatch #7**. |
| **429** Too Many Requests (throttler) | >10 create/update/status requests per rolling 60s window per user | falls through the interceptor with no special handling (interceptor only special-cases `>=500` and `Network Error`, [client.ts:43-46](src/api/client.ts:43)); relies on the mutation's generic `onError`, which shows the raw, **non-localized default NestJS message** (`ThrottlerException: Too Many Requests`) since `CustomThrottlerGuard` never overrides the message ([custom-throttler.guard.ts](../SouqoneWepapp/apps/api/src/common/guards/custom-throttler.guard.ts) only overrides the tracker key, not the exception) | confirmed unchanged from prior audit (E15) |
| **500** Internal Server Error | unhandled server exception | global interceptor shows a generic Arabic dialog ("حدث خطأ في الخادم، يرجى المحاولة لاحقاً", [client.ts:43-44](src/api/client.ts:43)) — handled, no crash |
| **Network Error** (no response, timeout, offline) | connectivity loss | global interceptor shows a generic Arabic dialog ("يرجى التحقق من اتصالك بالإنترنت", [client.ts:45-46](src/api/client.ts:45)) — handled, draft preserved (E13, unchanged) |

**No status code produces a silent failure or an unhandled crash.** Every path either shows the raw (correct, Arabic) backend message via the generic `onError`, or a generic-but-appropriate dialog from the global interceptor. The gaps are all about *precision* (no per-field inline mapping, no distinct recovery action per status, no proactive prevention for the 403-on-locked-listing and 409-on-duplicate cases) rather than missing handling outright.

---

## 7. Rate limiting

Backend: `ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }])` is the app-wide default ([app.module.ts:44](../SouqoneWepapp/apps/api/src/app.module.ts:44)), but `create`, `update`, and all four status-command endpoints override it to a **stricter `{ limit: 10, ttl: 60000 }`** via `@Throttle(...)` ([listings.controller.ts:30,59,78,86,94,102](../SouqoneWepapp/apps/api/src/listings/listings.controller.ts:30)) — i.e. **max 10 create/update/status requests per user per rolling 60 seconds**. `CustomThrottlerGuard` keys the bucket per-user (decoded from the JWT) rather than per-IP when authenticated ([custom-throttler.guard.ts:4-20](../SouqoneWepapp/apps/api/src/common/guards/custom-throttler.guard.ts:4)).

Mobile: **zero client-side awareness of this limit.** `AppButton` disables on `loading || disabled` ([src/components/ui/AppButton.tsx:52,81,103](src/components/ui/AppButton.tsx:52)), and `isSubmitting` in `app/cars/new.tsx:312` covers only the *in-flight* window of the current mutation — it prevents a double-tap on one pending request, but there is no cooldown/backoff after a request resolves (success or failure). A user who repeatedly fixes-and-resubmits validation errors, or double-taps through a flaky connection, could realistically exhaust the 10/60s budget and start seeing 429s with no client-side warning before it happens. Low real-world likelihood, but confirmed zero mitigation exists.

---

## 8. Validation rule parity — expanded

This was covered field-by-field in the tables for items 1–2 above. Summarizing what's **not** already itemized there:

- **No field is looser on mobile than on the backend.** Every backend-required field is mobile-required; every backend range/enum constraint is matched or exceeded client-side.
- **`minRentalDays` has an untested edge**: backend requires `@Min(1)`; mobile has no floor check on this specific optional field (just `keyboardType="numeric"` + `maxLength={3}`, [CarStep4Location.tsx:100-106](src/components/cars/wizard/CarStep4Location.tsx:100)). A user entering `0` would pass mobile silently and get a 400 from the backend. Minor, but genuinely new (not previously flagged).
- **`horsepower`/`doors`/`seats`/`engineSize` have no client-side range validation at all** (just `maxLength` digit caps) — backend also has no range constraint on these (`@IsInt()` only, no `@Min`/`@Max`), so this isn't a mismatch, just an area where both sides are equally permissive (e.g. `doors: 99` would pass both).
- **The one genuine rule-level mismatch is the RENTAL daily-price requirement — New Mismatch #1, detailed below.** This is the most significant finding from item 8 specifically: it's not a missing check, it's a check that exists on both sides but encodes a **different rule** (mobile: "daily OR monthly", backend: "daily, mandatorily, regardless of monthly").

---

## NEWLY FOUND MISMATCHES (beyond the 3 already known: `version`, image-edit dead code, logout-reset)

### New Mismatch #1 — 🔴 High. RENTAL pricing rule mismatch (create AND update)
Backend requires `dailyPrice > 0` unconditionally for any RENTAL listing, on both create ([listings.service.ts:127-130](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:127): `if (!dto.dailyPrice || dto.dailyPrice <= 0) throw BadRequestException('سعر الإيجار اليومي مطلوب لإعلانات الإيجار')`) and update ([listings.service.ts:373-389](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:373), same check against `effectiveDailyPrice`). Mobile's client-side rule accepts **either** daily or monthly: `hasDaily || hasMonthly` ([src/hooks/useCarValidation.ts:103-109](src/hooks/useCarValidation.ts:103)):
```js
const hasDaily = formData.dailyPrice && !isNaN(Number(formData.dailyPrice)) && Number(formData.dailyPrice) > 0
const hasMonthly = formData.monthlyPrice && !isNaN(Number(formData.monthlyPrice)) && Number(formData.monthlyPrice) > 0
if (!hasDaily && !hasMonthly) { errors.dailyPrice = '...'; errors.monthlyPrice = '...' }
```
**A user who fills in only "monthly rental price" (a completely reasonable real-world choice for a monthly-only rental car) passes every client-side check, reaches the final "publish" tap, and gets rejected with a 400 they have no way to have anticipated.** This is a real, reachable bug today (unlike the update-path issues, which are currently masked by the version blocker) — it fires on **create**, which works today.

### New Mismatch #2 — 🔴 High (sharpens previously-found B7). Canonical-identity re-validation runs on every single edit, not just an edge case
Because mobile's edit payload sends `brandId`/`carModelId` **unconditionally** (no `|| undefined` guard on those two, unlike `carTrimId`), the backend's "Canonical Identity Update" block ([listings.service.ts:392-416](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:392)) triggers on **every** edit-save with no exception. Combined with the already-known legacy fallback bug (`brandId: listing.brandId || listing.make || ''`, [app/post/edit/[id].tsx:128](app/post/edit/[id].tsx:128)), this means: **any pre-migration car listing (no `brandId` on record) will fail edit-save with `'الماركة أو الموديل غير موجود'` (400) on every attempt, guaranteed** — not a rare edge case contingent on a specific user path, but the deterministic outcome for that entire class of listings, every time. (This is currently moot in practice only because `version` already blocks 100% of edits — but it will surface immediately once that's fixed, so it needs to be fixed in the same pass, not discovered later.)

### New Mismatch #3 — 🟡 Medium. No status gating before entering edit — SOLD/SUSPENDED listings are editable in the UI up until the final backend rejection
Backend: `update()` throws 403 if `listing.status === 'SUSPENDED' || listing.status === 'SOLD'` ([listings.service.ts:351-353](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:351)). Mobile: My Listings' `isEditSupported()` gates only on `entityType` (`'car' | 'equipment' | 'operator'`), never on `status` ([src/hooks/useMyListingsScreen.ts:153-155](src/hooks/useMyListingsScreen.ts:153)); `handleEdit()` routes straight to `/post/edit/:id` with no status pre-check. The GET-based edit-loader also never reads `listing.status` into the form. **A user can tap "Edit" on a sold or suspended car, spend time filling out all 5 steps, and only discover it's blocked on the final submit.**

### New Mismatch #4 — 🟢 Low, cosmetic, self-healing. `governorateName`/`wilayaName` prefill reads fields that don't exist on the response
Detailed in item 4 above. `listing.governorateName` doesn't exist; `listing.governorate` is a legacy plain string, not an object, so `.nameAr` on it is always `undefined`. In practice `GovernorateWilayaSelect.tsx` resolves the real display label from `governorateId`/`wilayaId` independently, so this is invisible in normal use — flagged for completeness, not as a user-facing bug.

### New Mismatch #5 — 🟡 Medium. `listingsApi.addImages()` targets a route that does not exist on the backend
[src/api/listings.ts:15-18](src/api/listings.ts:15) defines `addImages: (id, formData) => apiClient.post(\`/listings/${id}/images\`, formData, ...)`. `listings.controller.ts` has **no** `:id/images` route — every image-management route lives under `/uploads/listings/:listingId/...` instead (confirmed by reading the full controller, item 5 table above). This helper is currently unused by the Cars flow (inert), but it's a landmine: it looks like the natural fix for the D11 dead-code bug and would 404 if used as-is.

### New Mismatch #6 — 🟢 Low. `GET /listings/:id`'s `images` relation has no explicit ordering, but mobile assumes array order = display order
`PUBLIC_LISTING_INCLUDE.images` is `true` with no `orderBy` ([listings.repository.ts:16-21](../SouqoneWepapp/apps/api/src/listings/listings.repository.ts:16)), unlike the dedicated `getListingImages()` used by the reorder feature, which explicitly does `orderBy: { order: 'asc' }` ([upload-image-manager.service.ts:112-117](src/uploads/upload-image-manager.service.ts:112)). Mobile's `CarStep2Images.tsx` has no concept of `isPrimary` at all and treats array index 0 as the cover image unconditionally ([CarStep2Images.tsx:77-81](src/components/cars/wizard/CarStep2Images.tsx:77)). Since Prisma does not guarantee relation order without an explicit `orderBy`, there's a latent (not currently proven, but plausible) risk that the displayed "primary" image on re-edit doesn't match the actual `isPrimary`-flagged image in the DB. Backend-side fix candidate, flagged here because mobile's consumption pattern is what makes it matter.

### New Mismatch #7 — 🟡 Medium. Mobile cannot distinguish the two different causes of a 409 on create
Detailed in item 6's table. A duplicate-content 409 (same title/description/price/brand within 5 minutes of the same seller, [listings.service.ts:85-102](../SouqoneWepapp/apps/api/src/listings/listings.service.ts:85)) and a version-conflict 409 both render through the same generic `onError` path with no differentiated UI. For create specifically, this means: **if a create request times out client-side after actually succeeding server-side, and the user retries with the same data, they get a 409 whose message doesn't tell them their first listing already went live** — they might reasonably conclude nothing was published and try changing details to work around the "error," potentially publishing a near-duplicate anyway once enough fields differ, or abandoning a listing that actually succeeded.

### New Mismatch #8 — 🟢 Low/informational. Status-command endpoints also require `version`
Confirms/extends the known gap: even if submit/mark-sold/archive/restore were wired up on mobile tomorrow, they'd hit the exact same missing-`version` problem as update, since `CarFormData` has no `version` field to source it from. Not a new bug (B8 already flagged these as unreachable), but worth noting the fix for B5/B6 (adding `version` to the store) is a prerequisite for ever closing B8, not an independent piece of work.

### New Mismatch #9 — 🟢 Low, latent/structural. `forbidNonWhitelisted: true` makes the payload contract fragile to future edits
`main.ts:49-53` has `whitelist: true, forbidNonWhitelisted: true` globally — any extra key not on the DTO causes the **entire request to be rejected**, not silently stripped. Today's payload construction in `app/cars/new.tsx` is safe because it's built key-by-key rather than spreading `...formData` ([app/cars/new.tsx:203-252](app/cars/new.tsx:203)) — `editMode`, `editListingId`, `make`, `model`, `trim`, `governorateName`, `wilayaName` (all real `CarFormData` keys) are correctly never included. This is not a live bug, but it is a fragile invariant with no test or lint guard behind it — a future refactor that naively spreads the store's `formData` into the payload would break create and update outright with a 400, and the failure mode (a `forbidNonWhitelisted` rejection) would be non-obvious to whoever introduces it.

---

## Final verdict

**The contract is now comprehensively understood — no further backend-side unknowns remain for Cars create/update/image/status.** Every DTO, the full `update()`/`create()` service logic (including the two conditional blocks — rental pricing and canonical identity — that the original 3-item audit hadn't traced into), the repository's optimistic-concurrency mechanism, the complete image-management API surface, the global exception shape, and the throttle configuration have all been read directly from source in this pass, not inferred or recalled.

What remains genuinely open, and would require **runtime/manual verification rather than more reading**, is narrow:
1. Whether `PUBLIC_LISTING_INCLUDE`'s unordered `images` relation actually returns rows out of `order` sequence in practice under the current Postgres/Prisma version (New Mismatch #6) — this is a "prove it with a live query" question, not a code-reading one.
2. The exact production behavior of `forbidNonWhitelisted` error messages (New Mismatch #9) as actually rendered to a user, since it's currently unreachable dead-path — confirmed structurally from `main.ts`, not observed end-to-end.

Everything else in this report — the 9 new mismatches plus the full field-by-field tables for items 1, 2, 5, and 6 — is based on direct, fresh reads of both repositories' current source, with file:line citations on both sides. No fixes were made; this is exclusively a contract map for whoever implements the corrections next.
