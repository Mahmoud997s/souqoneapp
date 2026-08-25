# Mobile UX Architecture Plan: Add/Edit Listing Flow

## 1. Store Reset on Successful Publish (Current State)
**Findings:** All three wizard stores currently reset their state correctly upon successful publish/save.
- **Cars (postStore)**: `app/post/step5.tsx:267` calls `store.reset()` on success.
- **Equipment (equipmentWizardStore)**: `app/equipment/new.tsx:264` (create) and `251` (edit) calls `resetDraft()`.
- **Operators (operatorWizardStore)**: `app/equipment/operators/add.tsx:105` calls `resetDraft()`.
**Conclusion:** The post-success reset logic is solid and requires no architectural changes, but we must ensure it remains strictly enforced in the new design.

## 2. Draft Resume Prompt
**Findings:** Currently, `app/(tabs)/post.tsx:32` unconditionally calls `reset()` on `usePostStore` whenever a user taps a category. This aggressively destroys any pending car draft before the user can resume it. For Equipment, it navigates to `/equipment/new` without resetting, but the screen immediately loads the draft without asking if the user wants to start fresh, and provides a small "مسح والبدء من جديد" button instead of an explicit prompt.

**Proposed Reusable Architecture:**
- **Definition of "Meaningful Data"**: A draft has meaningful data if fields beyond the required defaults (like `category` or `operatorType`) are filled. For example, `!!store.title || !!store.price` for Cars, or `!!formData.title` for Equipment.
- **`useDraftResumeCheck` Hook**: A generic hook that checks the store and blocks the form UI until the user decides.
```tsx
function useDraftResumeCheck<T>(
  store: T,
  hasMeaningfulData: (state: T) => boolean,
  resetDraft: () => void
) {
  const [decisionMade, setDecisionMade] = useState(false)
  const isDraft = hasMeaningfulData(store)
  // ... returns state to show the <DraftResumePrompt /> or proceed
}
```
- **`<DraftResumePrompt />` Component**: A lightweight, shared Bottom Sheet or full-screen overlay showing "Resume your draft?" (primary button) vs "Start new listing" (secondary button which triggers `resetDraft()` before proceeding).

## 3. Clear Add vs Edit Route Separation
**Findings:** 
- Cars currently use `app/post/edit/[id].tsx` to initialize `postStore` with fetched data, then push the user into `app/post/step2.tsx` and finally `app/post/step5.tsx`. Both Add and Edit share the exact same `usePostStore` persisted draft storage. This risks a user starting an Add, closing the app, then opening an Edit link, which overwrites their Add draft in storage, causing cross-contamination.
- Equipment uses `initEditMode(listing)` in `app/equipment/new.tsx`, forcing edit data into the same persisted draft store.

**Proposed Strategy:**
- **Distinct Routing**: `/cars/new` (Add flow) vs `/cars/edit/[id]` (Edit flow). The form UI components (e.g. `<CarForm />`) can be shared, but they are wrapped by different screens.
- **Store Mode Segregation**: 
  - Add Flow: Reads from and persists to `post-draft-storage`.
  - Edit Flow: Should **not** use the persisted draft storage, or it should use a completely separate key (e.g. `post-edit-storage`). Alternatively, the store should support `draftData` vs `editData` slices. 
  - A simple fix is adding a `mode: 'add' | 'edit'` prop to the shared wizard. If `edit`, the `DraftResumePrompt` is completely bypassed, and we initialize the store from the API response directly without persisting it to the draft key.

## 4. Guarded, Section-Aware Entry Points
**Findings:** `app/(tabs)/post.tsx` handles entry for all verticals. For Cars, it sets the category (`set({ category: id })`) and pushes to `/post/step2`. For Equipment, it just pushes to `/equipment/new`. This is inconsistent and relies on global store mutations prior to routing.

**Proposed Pattern:**
- `app/(tabs)/post.tsx` should be purely for navigation. It should not mutate stores.
- It should route explicitly: `router.push('/cars/new')`, `router.push('/equipment/new')`.
- The receiving screen (`/cars/new.tsx`) is responsible for:
  1. Validating the vertical (it implicitly knows it is for Cars).
  2. Running the `useDraftResumeCheck`.
  3. Setting `category: 'cars'` in its store if starting fresh.

## 5. Reference Existing Patterns from Operators/Equipment
**Findings:** The Operators and Equipment wizards are highly refined. We must reuse their patterns for Cars:
- **Validation**: Pure validation functions (`src/hooks/useEquipmentValidation.ts`) that return `{ isValid, errors }`. Evaluated on `nextStep()`.
- **Inline Errors**: Fields use `error={errors.fieldName}` and are cleared via `clearFieldError` on typing.
- **Success/Error UX**: They use `dialogService.alert('تم بنجاح', ...)` instead of custom toasts (`app/equipment/new.tsx:263`).
- **Visual Conventions**: 
  - Sticky Footer with `AppButton` (`app/equipment/new.tsx:374`).
  - Draft Auto-Save Bar (`s.draftBar` in `app/equipment/new.tsx:422`) — though the new prompt will replace the need for the manual "clear draft" text button, the green auto-save badge should remain.
  - Progress tracking via `<Stepper />`.

## Phased Implementation Order
**Phase 1: Shared Primitives (The Foundation)**
1. Build `<DraftResumePrompt />` UI component (matching existing modal/bottom sheet styles).
2. Create `useDraftResumeCheck` hook.
3. Standardize validation pattern for Cars (create `useCarValidation.ts` mirroring `useEquipmentValidation.ts`).

**Phase 2: Cars Vertical (The Pilot)**
1. Refactor Cars routing to `/cars/new.tsx` and `/cars/edit/[id].tsx`.
2. Remove unconditional `reset()` from `app/(tabs)/post.tsx`.
3. Implement `useDraftResumeCheck` and `<DraftResumePrompt />` in `/cars/new.tsx`.
4. Apply the `Stepper`, Sticky Footer, and `dialogService.alert` patterns to the Cars wizard.

**Phase 3: Adoption by Operators & Equipment**
1. Update `/equipment/new.tsx` and `/operators/add.tsx` to use the new `useDraftResumeCheck` hook and `<DraftResumePrompt />` component instead of their current inline `مسح والبدء من جديد` text button.
2. Ensure their Edit routes bypass the draft check completely.
