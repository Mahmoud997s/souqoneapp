# Cars Add/Edit Flow Audit (Read-Only)

## 1. CarForm.tsx (`src/components/post/forms/CarForm.tsx`)
- **`make`/`model`/`trim` fields**: Confirmed that `setDetail(...)` is used to send string values when a user selects a brand, model, or trim.
  - Make: `setDetail('make', data.name)` ([CarForm.tsx:L120](file:///c:/Users/DELL/Desktop/Souqoneapp/src/components/post/forms/CarForm.tsx#L120))
  - Model: `setDetail('model', data.name)` ([CarForm.tsx:L148](file:///c:/Users/DELL/Desktop/Souqoneapp/src/components/post/forms/CarForm.tsx#L148))
  - Trim: `setDetail('trim', data.name)` ([CarForm.tsx:L176](file:///c:/Users/DELL/Desktop/Souqoneapp/src/components/post/forms/CarForm.tsx#L176))
- **`brandId` and `carModelId`**: These exist as local component state (`const [brandId, setBrandId] = useState('')` and `const [modelId, setModelId] = useState('')`) for fetching subsequent dropdowns, but they are currently **NOT** pushed to `store.details`. As a result, they are discarded when the user moves to the next step.

## 2. Create flow (`app/post/step5.tsx`)
- **Payload construction code**:
  ```typescript
  // app/post/step5.tsx:72
  const payload: Record<string, unknown> = {
    ...(store.details || {}),
    title: store.title?.trim() || store.details?.title?.trim(),
    price: isNaN(parseFloat(String(store.price))) ? 0 : parseFloat(String(store.price)),
    // ...
  }
  ```
- **What is actually sent**: Since `CarForm.tsx` writes the string values (`make`, `model`, `trim`) into `store.details`, the spread operator `...(store.details || {})` injects these strings directly into the final `POST` network request body.

## 3. Edit flow (`app/post/edit/[id].tsx` & `app/post/step5.tsx`)
- **Fetching the existing listing**:
  ```typescript
  // app/post/edit/[id].tsx:36
  res = await listingsApi.getById(id)
  const listing: any = res.data ?? res
  ```
  It populates `store.details` by dumping the entire GET response directly into it:
  ```typescript
  // app/post/edit/[id].tsx:130
  details: { ...listing }, // push everything else into details
  ```
- **PATCH payload construction**:
  In `step5.tsx`, the same payload object used for POST is sent to `PATCH`:
  ```typescript
  // app/post/step5.tsx:220
  await listingsApi.update(store.editListingId, payload as any)
  ```
- **`version` handling**: **Confirmed zero references.** There is absolutely no handling of a `version` field anywhere in the edit screen or publish flow.
- **Prefilling dropdowns today**: `CarForm.tsx` manages to prefill the dropdowns by attempting to match the `make` and `model` string values back to IDs by searching through the fetched lists:
  ```typescript
  // src/components/post/forms/CarForm.tsx:91
  useEffect(() => {
    if (make && brands.length && !brandId) {
      const match = brands.find(b => b.name === make || b.nameAr === make)
      if (match) setBrandId(match.id)
    }
  }, [make, brands])
  ```
  This bridges the strings to IDs locally in the component.

## 4. postStore.ts (`src/store/postStore.ts`)
- **Shape of store relating to car fields**:
  The store does not explicitly type the car fields. It uses a generic `Record` for all dynamic data:
  ```typescript
  // src/store/postStore.ts:27
  details: Record<string, any>
  ```
- **`version` field**: There is no explicit `version` field in the `PostState` interface. The `editListingId` is tracked, but not the version.

## 5. API client (`src/api/listings.ts`)
- **Function signatures**:
  ```typescript
  // src/api/listings.ts:12
  create:    (data: Partial<Listing>)          => apiClient.post<Listing>('/listings', data),
  update:    (id: string, data: Partial<Listing>) => apiClient.patch<Listing>(`/listings/${id}`, data),
  ```

---

## Action Plan (Every Place to Change)
1. **`src/store/postStore.ts`**: Add `version?: number` to `PostState` and `initial` to properly track the version across steps.
2. **`app/post/edit/[id].tsx`**: When hydrating the store on edit, save `listing.version` explicitly into `set({ version: listing.version })` or ensure it's safely tucked into `details`. Also ensure `brandId` and `carModelId` (if now provided by the backend) are mapped correctly for `CarForm`.
3. **`src/components/post/forms/CarForm.tsx`**: 
   - Update `onSelect` for the brand and model modals to invoke `setDetail('brandId', val)` and `setDetail('carModelId', val)`.
   - Update the prefill `useEffect` logic to prioritize using `brandId`/`carModelId` directly rather than string-matching (if the backend starts returning these IDs).
4. **`app/post/step5.tsx` (Submission)**: 
   - Ensure the `version` field is explicitly extracted from the store and attached to the `payload` **only** when `store.editMode` is true.
   - Clean up `make`, `model`, and `trim` fields from the payload before sending if the backend now strictly rejects them.

## Foreseeable Risks
- **Cached Drafts (AsyncStorage)**: `postStore.ts` uses `zustand/middleware` `persist` with `AsyncStorage`. Users might have an old draft saved before this update that only contains the `make`/`model` strings. When they try to resume and publish, the request will fail because `brandId` and `carModelId` will be missing.
  - **Mitigation**: We must gracefully handle old drafts. We can either:
    1. Check if `brandId` is missing during `step5.tsx` submission and block it with an alert ("يرجى تحديث ماركة السيارة").
    2. Write a migration function in the persist middleware to invalidate or map old drafts.
    3. Simply clear out old drafts if they don't have a `brandId` when they open `CarForm`.
