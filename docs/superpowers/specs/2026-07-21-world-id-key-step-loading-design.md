# World ID Key-Step Loading Boundary Design

## Status

Approved approach: keep the signer-key screens dynamically imported and add a local loading boundary to every affected import in both portal implementations.

## Problem

PR #2132 changed the Generate New Key and Use Existing Key screens from static imports to bare `next/dynamic` imports. In the App Router build, a cold signer-key chunk can suspend past the create-app dialog and reach the outer dialog-loading boundary. React then hides the existing dialog tree while the outer fallback renders. Headless UI observes the hidden dialog as disappeared and invokes `onClose`.

The first attempt therefore stops before `register_rp` is called. Once the chunk finishes loading, a second attempt succeeds. Staging logs confirmed this sequence: app creation followed by exactly one successful RP registration and no backend event for the first attempt.

## Goals

- Keep the dialog open while either signer-key chunk loads.
- Preserve PR #2132's code splitting and initial-bundle reduction.
- Fix both the Portal and PortalV3 copies of the V4 create-app dialog.
- Retain one small deterministic regression test after diagnosis is complete.

## Non-goals

- Do not change registration, signer-key, Apollo, or refetch behavior.
- Do not restore static imports.
- Do not preload both signer-key chunks.
- Do not change shared Headless UI dialog behavior.
- Do not add new chunk-error handling in this patch.

## Production Design

Update these files:

- `web/scenes/Portal/layout/CreateAppDialog/index-v4.tsx`
- `web/scenes/PortalV3/layout/CreateAppDialog/index-v4.tsx`

In each file:

1. Add one local `KeyStepLoading` component using the already imported `Typography` and existing centered `py-10` loading layout.
2. Convert `GenerateNewKeyContent` to the two-argument `dynamic(loader, options)` form and pass `{ loading: KeyStepLoading }`.
3. Apply the same option to `UseExistingKeyContent`.

A truthy `loading` component makes Next create a Suspense boundary at each dynamic signer-key component. The fallback therefore renders inside the existing fixed dialog panel. The dialog root and header remain visible and non-zero-sized, so Headless UI does not close the dialog.

The dynamic chunks remain separate. No registration request is made until the loaded key screen's existing Continue action is submitted.

## User Experience

On a cold chunk:

1. The user chooses Generate New Key or Use Existing Key.
2. The dialog and header remain visible.
3. The body temporarily displays `Loading...`.
4. The selected key screen replaces the fallback automatically when its chunk resolves.
5. The user continues once; the existing registration flow runs unchanged.

Warm chunks render the selected screen immediately. A rejected chunk continues through the application's existing error-boundary behavior; this patch only owns the pending state.

## Verification and Minimal Retained Test

During implementation, use a deliberately unresolved lazy component and an outer Suspense fallback to reproduce the outward-suspension behavior before the fix. A broader diagnostic harness may exercise Headless UI's disappearance callback, but it will not be retained.

Retain one parameterized Jest test in `web/tests/unit/world-id-key-step-loading.test.tsx`:

- Cover Portal and PortalV3.
- Cover Generate New Key and Use Existing Key.
- Mock `next/dynamic` with App Router semantics: a dynamic without `options.loading` suspends to the outer boundary, while a dynamic with `options.loading` handles suspension locally.
- Drive the real dialog step state through lightweight mocked Continue buttons.
- Assert the outer fallback never appears, the dialog remains present, and the in-dialog `Loading...` fallback is visible.

This produces one test body with four table rows and directly guards all four changed dynamic imports. Delete any temporary diagnostic-only tests before final review.

## Validation

Run, in order:

1. `cd web && npx jest tests/unit/world-id-key-step-loading.test.tsx --runInBand`
2. `cd web && npx tsc --noEmit`
3. `cd web && pnpm format:check`
4. Review the final diff to confirm only the two dialog files and the single regression-test file remain, apart from this design document.

## Expected Scope

- Production code: approximately 18 net added lines across two files.
- Retained test: one parameterized test, approximately 100-140 lines including mocks.
- No dependency, GraphQL, API, Hasura, or generated-file changes.
