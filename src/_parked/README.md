# Parked Modules: Jobs & Transport

This directory contains the codebase for the **Jobs** and **Transport** modules, parked per task D-131 (PR-B).

## Why Parked?
The Jobs and Transport modules are temporarily parked to streamline the primary app offerings (Cars, Buses, Equipment, Operators, Parts, Services) without permanently deleting any feature code, tests, state stores, or API integrations.

## Parked Contents
1. **Routes & Screens**:
   - `src/_parked/jobs/`: 13 route screens (`app/jobs/*`)
   - `src/_parked/transport/`: 16 route screens (`app/transport/*`)
   - `src/_parked/job-filters.tsx`: modal screen (`app/(modals)/job-filters.tsx`)
2. **Components**:
   - `src/_parked/components/jobs/`: 8 UI components & forms
   - `src/_parked/components/transport/`: 20 UI components, wizards, landing sections
   - `src/_parked/components/cards/`: `JobCard.tsx`, `DriverCard.tsx`, `ProposalCard.tsx`, `job/*`
   - `src/_parked/components/filters/`: `DriversFilterBottomSheet.tsx`, `JobsFilterBottomSheet.tsx`
3. **State Management**:
   - `src/_parked/store/`: `jobProfileStore.ts`, `jobPostStore.ts`, `carrierWizardStore.ts` (+ spec), `transportWizardStore.ts` (+ spec)
4. **Constants & Types**:
   - `src/_parked/constants/`: `jobs.ts`, `transport.ts`
   - `src/_parked/types/`: `jobs.types.ts`, `transport.types.ts`
5. **API & Hooks**:
   - `src/_parked/api/`: `jobs.ts`, `transport.ts`
   - `src/_parked/hooks/`: `useJobs.ts`, `useTransport.ts`, `useDriverProfile.ts`, `useEmployerProfile.ts`, `useJobActions.ts`, `useVerification.ts`, `useDrivers.ts`, `useJobsDashboard.ts`, `queries/useMyJobsInfinite.ts`
6. **Utilities**:
   - `src/_parked/utils/normalizeJobType.ts`: `normalizeJobType` helper function

## Configuration Exclusions
- `jest.config.js`: Added `'<rootDir>/src/_parked/'` to `testPathIgnorePatterns`.
- `tsconfig.json`: Added `"src/_parked/**"` to `"exclude"`.

## Exact Restoration Steps
When re-activating the Jobs and/or Transport modules:
1. **Restore Files with Git History**:
   - Move route files back from `src/_parked/jobs/` to `app/jobs/` and `src/_parked/transport/` to `app/transport/`.
   - Move `src/_parked/job-filters.tsx` to `app/(modals)/job-filters.tsx`.
   - Move `src/_parked/utils/normalizeJobType.ts` back to `src/utils/normalizeJobType.ts`.
   - Move all components, stores, constants, types, hooks, and APIs back to their original locations in `src/`.
2. **Revert Configuration Exclusions**:
   - In `jest.config.js`: remove `'<rootDir>/src/_parked/'` from `testPathIgnorePatterns`.
   - In `tsconfig.json`: remove `"src/_parked/**"` from `exclude`.
3. **Restore Surgical Edits**:
   - In `src/hooks/useDepartmentBottomBar.ts`: restore `useTransportBottomBar` and `useJobsBottomBar`.
   - In `src/utils/mappers.ts`: restore `mapJobToCard`, `mapTransportToCard`, and the label dictionaries (`JOB_TYPE_LABELS`, `SERVICE_TYPE_LABELS`, `REQUEST_STATUS_LABELS`, `SALARY_PERIOD_LABELS`, `LICENSE_TYPE_LABELS`).
   - In `src/utils/normalizeAndMerge.ts`: restore `mapJobToCard` import and the `// 4. Jobs` loop.
   - In `src/components/profile/ProfilePhoneGuardView.tsx`: restore `'jobs'` variant to `ProfilePhoneGuardHeaderVariant` and `AppHeader`.
   - In test files (`uploads.spec.ts`, `editFormsWhatsappPreservation.spec.tsx`, `useDepartmentBottomBar.parts.spec.tsx`, `mappers.location.spec.ts`, `favoritesScreenBranch.spec.tsx`): restore test blocks.
   - In `app.json`: revert location permission message if needed.
4. **Verification**:
   - Run `npx tsc --noEmit` and `npx jest --ci` to confirm all types and tests pass.
