# Routing Options Comparison: Cars Add/Edit Flow

This document provides a concrete, code-based investigation of the actual blast radius for separating the Cars Add/Edit flow into its own routes (Option A) versus building the new features on top of the existing routes (Option B).

---

## 1. FULL RESTRUCTURE COST (Option A: new `/cars/new.tsx` routes)

### Affected Navigation Call Sites
If we rename or replace `/post/step2` and `/post/edit/[id]`, we must update navigation across the app. 

**Entry points into Add Flow (`/post/step2`):**
- `app/cars/index.tsx` (Line 31)
- `app/services/index.tsx` (Line 32)
- `app/services/browse.tsx` (Line 82)
- `app/parts/index.tsx` (Line 36)
- `app/parts/browse.tsx` (Line 114)
- `app/(tabs)/post.tsx` (Line 39)
- `app/(modals)/post-category.tsx` (Line 32)
- `src/hooks/useDepartmentBottomBar.ts` (Line 105)

**Entry points into Edit Flow (`/post/edit/[id]`):**
- `app/listings/[id].tsx` (Line 531)
- `src/hooks/useMyListingsScreen.ts` (Line 160)
- `app/buses/[id].tsx` (Line 644)

### The "God Store" & Shared Steps Complexity
The files `app/post/step2.tsx` through `app/post/step5.tsx` and `app/post/edit/[id].tsx` **are not Cars-specific**. 

Inspection of `app/post/step3.tsx` (Lines 107-126) and `app/post/edit/[id].tsx` (Lines 106-112) reveals they act as a universal wizard for **Cars, Buses, Parts, Services, Jobs, and Transport**. They heavily rely on `usePostStore`. 

- If we move Cars out to `/cars/new.tsx`, we **cannot** just rename the `stepX` files. We must *duplicate* the multi-step layout logic (Stepper, Footer, Validation) specifically for Cars, and leave the old `stepX` files intact so Parts/Services/Jobs don't break.
- For Edit mode, `useMyListingsScreen.ts` and `app/listings/[id].tsx` currently push blindly to `/post/edit/${id}`. We would need to add conditional logic to check if `listing.category === 'cars'` to route to `/cars/edit/${id}` instead, while routing everything else to `/post/edit/${id}`.

### Estimate
- **Files Touched**: ~15+ navigation files, plus creating 5+ new files for the `/cars` routes, plus building a new `useCarWizardStore`.
- **Nature of Change**: Heavy logical extraction, not a mechanical rename.
- **Risk**: Very High. Decoupling Cars from `usePostStore` without breaking Parts, Services, or Transport requires precise state mapping and duplicate UI generation.

---

## 2. BUILD-ON-TOP COST (Option B: Keep existing routes, add prompt)

### Where to Insert the Prompt
If we keep `/post/step2`, the `<DraftResumePrompt>` and `useDraftResumeCheck` can be cleanly inserted inside `app/(tabs)/post.tsx` and `app/(modals)/post-category.tsx`. 
Instead of unconditionally calling `reset()` and routing, these components would:
1. Check `usePostStore.getState()` for meaningful data in the selected category.
2. If a draft exists, display the `<DraftResumePrompt>` overlay directly on the entry screen.
3. Depending on the user's choice, either call `reset()` or don't, then push to `/post/step2`.

### Add vs Edit Separation
We can still fix the cross-contamination (Item 3 from the architecture plan) without changing the physical route `app/post/edit/[id].tsx`.
- Currently, `app/post/edit/[id].tsx` calls `set({ editMode: true, details: listing })`. 
- To prevent this from overwriting a pending Add draft in storage, we can configure Zustand's `persist` middleware in `usePostStore` to selectively ignore state when `editMode === true`, or we can isolate edit data into a separate nested object (e.g., `editData: {}` vs `draftData: {}`) within the same store.

### What is explicitly NOT achieved (Architectural Debt)
- **URL Cleanliness**: The routes remain `/post/step2` instead of the domain-driven `/cars/new`.
- **Monolithic State**: `usePostStore` remains a "God Store" containing `details: Record<string, any>` for 6 different verticals, rather than providing strongly-typed slices per vertical.
- **Switch-Case UI**: Files like `step3.tsx` will still rely on massive `switch(category)` blocks to render `<CarForm />` vs `<PartForm />`, which makes the files bloated over time.

---

## 3. RECOMMENDATION

Based on the evidence, **Option B (Build-On-Top) has a genuinely lower risk and is strongly recommended for this specific codebase at this time.**

**Why?**
The blast radius of Option A is massive because the `app/post/*` routes and `postStore` are deeply entangled with almost every vertical in the app (Parts, Services, Transport, etc.). Extracting *only* Cars means either duplicating the entire wizard UI structure or risking catastrophic breakage in secondary verticals. 

Option B allows us to solve the immediate UX requirements (Draft Resume Prompt, Store Reset logic, preventing Edit/Add cross-contamination) safely. We can introduce the reusable `<DraftResumePrompt />` and `useDraftResumeCheck` primitives now, test them on the shared `postStore`, and defer the massive task of breaking apart the "God Store" until a dedicated tech-debt sprint where *all* verticals can be migrated to their own stores simultaneously.
