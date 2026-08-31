# Reviewer workspace redesign implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five-tab reviewer detail page with a responsive three-tab review workspace that keeps the exact test target and decision actions reachable, reduces new reviews to five autosaved checklist groups, and confirms every terminal decision.

**Architecture:** Keep `ReviewerWorkspace` as the workflow authority for claims, heartbeats, checklist persistence, and decisions. Extract focused components for navigation, the persistent test target, grouped checklist, action rail, composer, and confirmation sheet. Use a small serialized save coordinator so checklist writes never overlap and decisions always use the newest claim token and review version. Preserve existing endpoint payloads, the legacy checklist, immutable snapshots, and durable decision logic.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Radix Sheet, `react-qr-code`, Jest, React Testing Library, Playwright, Docker Compose.

---

Implement against [the approved reviewer workspace redesign](../specs/2026-08-31-reviewer-workspace-redesign.md). If an implementation detail conflicts with that document, the approved specification wins.

## Task 1: Add versioned grouped-checklist rules

**Files:**

- Create: `web/lib/reviewer-limits.ts`
- Modify: `web/api/admin/reviewer/request-schema.ts`
- Modify: `web/scenes/Admin/reviewer/checklist.ts`
- Modify: `web/api/helpers/reviewer-decision.ts`
- Test: `web/tests/unit/admin-reviewer-domain.test.ts`
- Test: `web/tests/unit/admin-reviewer-decision-request.test.ts`
- Test: `web/tests/api/admin/reviewer-decision.test.ts`

- [ ] **Step 1: Write failing versioning and validation tests**

Add tests proving:

- `2026-08-31.1` is the default and returns exactly the five approved `group.*` IDs for both app modes.
- `2026-08-27.1` remains supported with its existing mode-specific definitions.
- Every grouped item needs an explicit status for normal approval.
- Grouped N/A is valid without a note; legacy N/A still requires one.
- Request parsing accepts note-free N/A so domain validation can apply version rules.
- The server appends failed grouped labels exactly once to a changes-requested message.

Use these exported constants:

```ts
export const LEGACY_REVIEW_CHECKLIST_VERSION = "2026-08-27.1";
export const REVIEW_CHECKLIST_VERSION = "2026-08-31.1";
```

Run:

```bash
cd web && pnpm jest tests/unit/admin-reviewer-domain.test.ts tests/unit/admin-reviewer-decision-request.test.ts tests/api/admin/reviewer-decision.test.ts --runInBand
```

Expected: FAIL because only the legacy version exists and the parser rejects note-free N/A.

- [ ] **Step 2: Centralize current API limits**

Create `web/lib/reviewer-limits.ts`:

```ts
export const REVIEWER_DEVELOPER_MESSAGE_MAX_LENGTH = 20_000;
export const REVIEWER_OVERRIDE_REASON_MAX_LENGTH = 10_000;
export const REVIEWER_CHECKLIST_EVIDENCE_MAX_LENGTH = 10_000;
export const REVIEWER_APPLICABILITY_NOTE_MAX_LENGTH = 5_000;
export const REVIEWER_INTERNAL_NOTES_MAX_LENGTH = 20_000;
```

Import these constants in `request-schema.ts` and replace the matching literals. Remove only the parser-level requirement that `status === "na"` have a nonblank applicability note; retain type and length checks. The version-aware domain validator remains authoritative.

- [ ] **Step 3: Register both checklist configurations**

Refactor `checklist.ts`:

```ts
type ChecklistConfiguration = {
  shared: readonly ReviewChecklistDefinition[];
  miniApp: readonly ReviewChecklistDefinition[];
  external: readonly ReviewChecklistDefinition[];
  requireNaNote: boolean;
};
```

Keep all current definitions under `LEGACY_REVIEW_CHECKLIST_VERSION`. Add these exact new IDs and labels under the default version:

```ts
const groupedDefinitions: readonly ReviewChecklistDefinition[] = [
  {
    id: "group.listing-localization",
    title: "Listing and localization",
    description:
      "Name, descriptions, category, countries, languages, and listing assets are accurate and complete.",
    sourceUrl: APP_GUIDELINES_URL,
  },
  {
    id: "group.experience-test",
    title: "Experience and test flow",
    description:
      "Core paths, navigation, copy, loading, cancellation, and failure states work in the submitted experience.",
    sourceUrl: APP_GUIDELINES_URL,
  },
  {
    id: "group.integration-reliability",
    title: "Integration and reliability",
    description:
      "The submitted URL, World ID or MiniKit behavior, actions, contracts, and production readiness are reliable.",
    sourceUrl: WORLD_ID_DOCS_URL,
  },
  {
    id: "group.permissions-safety",
    title: "Permissions and user safety",
    description:
      "Sensitive permissions, claims, content, notifications, and user safeguards follow policy.",
    sourceUrl: REVIEW_POLICY_URL,
  },
  {
    id: "group.legal-support",
    title: "Legal and support",
    description:
      "Privacy, terms, consent, regional restrictions, branding, and support channels are appropriate.",
    sourceUrl: REVIEW_POLICY_URL,
  },
];
```

For the new version, any stored Pass, Issue, or N/A counts as completed. Keep approval fail-closed until every definition has a result. Require an override reason only for failed or incomplete approval checks.

- [ ] **Step 4: Share durable-message formatting**

Export this pure helper from `checklist.ts` and use it in `reviewer-decision.ts`:

```ts
export const formatDeveloperDecisionMessage = ({
  decision,
  developerMessage,
  failedLabels,
}: {
  decision: "approved" | "changes_requested";
  developerMessage: string;
  failedLabels: string[];
}) => {
  const message = developerMessage.trim();
  if (decision !== "changes_requested" || failedLabels.length === 0) {
    return message;
  }
  const failedSummary = failedLabels.map((label) => `- ${label}`).join("\n");
  return `${message}\n\nFailed guideline checks:\n${failedSummary}`;
};
```

The client will reuse this for confirmation preview. Keep the decision payload unchanged: the client sends reviewer-authored text and the server constructs the durable message.

- [ ] **Step 5: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-domain.test.ts tests/unit/admin-reviewer-decision-request.test.ts tests/api/admin/reviewer-decision.test.ts --runInBand
git add web/lib/reviewer-limits.ts web/api/admin/reviewer/request-schema.ts web/scenes/Admin/reviewer/checklist.ts web/api/helpers/reviewer-decision.ts web/tests/unit/admin-reviewer-domain.test.ts web/tests/unit/admin-reviewer-decision-request.test.ts web/tests/api/admin/reviewer-decision.test.ts
git commit -m "add grouped reviewer checklist"
```

Expected: focused tests PASS.

## Task 2: Extract the persistent test target

**Files:**

- Create: `web/scenes/Admin/reviewer/detail/ReviewerTestTarget.tsx`
- Modify: `web/tests/unit/admin-reviewer-components.test.tsx`
- Delete after integration: `web/scenes/Admin/reviewer/detail/ReviewTestPanel.tsx`

- [ ] **Step 1: Write failing target tests**

Replace the old panel tests with tests proving:

- Mini Apps render the exact immutable draft URL, QR, copy, and `Open in World App`.
- Full mode provides a 160-pixel QR container; compact mode provides 88 pixels.
- External reviews render only a validated HTTPS link, open, and copy actions.
- Invalid or credential-bearing external URLs render the safe error and no link or QR.

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
```

Expected: FAIL because `ReviewerTestTarget` does not exist.

- [ ] **Step 2: Implement the focused component**

Use this API:

```ts
type ReviewerTestTargetProps = {
  appId: string;
  appName: string;
  compact?: boolean;
  integrationUrl: unknown;
  metadataId: string;
  mode: ReviewerAppMode;
};
```

Move behavior from `ReviewTestPanel`. Reuse `buildMiniAppDraftUrl`, `getSafeExternalIntegrationUrl`, and `CopyButton`. Mini App QR wrappers use `h-[88px] w-[88px]` when compact and `min-h-[160px] min-w-[160px]` otherwise.

- [ ] **Step 3: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
git add web/scenes/Admin/reviewer/detail/ReviewerTestTarget.tsx web/tests/unit/admin-reviewer-components.test.tsx
git commit -m "add persistent reviewer test target"
```

Expected: target tests PASS.

## Task 3: Add accessible URL-backed navigation

**Files:**

- Create: `web/scenes/Admin/reviewer/detail/reviewer-panels.ts`
- Create: `web/scenes/Admin/reviewer/detail/ReviewerTabs.tsx`
- Create: `web/scenes/Admin/reviewer/detail/ReviewerHeader.tsx`
- Modify: `web/tests/unit/admin-reviewer-components.test.tsx`

- [ ] **Step 1: Write failing panel and tab tests**

Prove valid URL values are `review`, `app-data`, and `activity`, with Review as fallback. Assert only three tabs, complete tablist/tab/tabpanel relationships, roving focus, Left/Right wrapping, Home/End navigation, and the header's identity/mode/attempt/status content.

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
```

Expected: FAIL because the new modules do not exist.

- [ ] **Step 2: Implement the panel model**

```ts
export const REVIEWER_PANELS = ["review", "app-data", "activity"] as const;
export type ReviewerPanel = (typeof REVIEWER_PANELS)[number];

export const parseReviewerPanel = (value: string | null): ReviewerPanel =>
  REVIEWER_PANELS.includes(value as ReviewerPanel)
    ? (value as ReviewerPanel)
    : "review";

export const reviewerPanelLabel: Record<ReviewerPanel, string> = {
  review: "Review",
  "app-data": "App data",
  activity: "Activity",
};
```

- [ ] **Step 3: Implement tabs and header**

`ReviewerTabs` receives `activePanel` and `onChange`. Keyboard navigation calculates the next panel, focuses the corresponding `reviewer-tab-*` element, and calls `onChange(next)`. Give tabs 44-pixel mobile targets and visible focus rings. `ReviewerHeader` composes app identity/status with the tabs but owns no URL state.

- [ ] **Step 4: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
git add web/scenes/Admin/reviewer/detail/reviewer-panels.ts web/scenes/Admin/reviewer/detail/ReviewerTabs.tsx web/scenes/Admin/reviewer/detail/ReviewerHeader.tsx web/tests/unit/admin-reviewer-components.test.tsx
git commit -m "add reviewer workspace navigation"
```

Expected: navigation tests PASS.

## Task 4: Replace detailed guidelines with the grouped checklist UI

**Files:**

- Create: `web/scenes/Admin/reviewer/detail/ReviewerChecklist.tsx`
- Modify: `web/scenes/Admin/reviewer/checklist.ts`
- Modify: `web/tests/unit/admin-reviewer-components.test.tsx`
- Delete after integration: `web/scenes/Admin/reviewer/detail/ReviewGuidelines.tsx`

- [ ] **Step 1: Write failing grouped-checklist tests**

Prove:

- The default version renders five named groups and no evidence field for Pass.
- Each group exposes Pass, Issue, and N/A as pressed-state buttons.
- Issue or N/A reveals exactly one note field.
- Changing N/A to Pass or Issue clears stale `applicabilityNote`.
- A failed item with a note exposes `Add note to message`, calling `onAddNote` with only the note.
- Save states announce Saving, Saved, and Retry save through a live region.
- A retired version renders immutable snapshot labels read-only instead of blank content.
- Progress uses `role="progressbar"` and numeric ARIA values.

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
```

Expected: FAIL because `ReviewerChecklist` does not exist.

- [ ] **Step 2: Add snapshot-backed display definitions**

Add this pure helper to `checklist.ts`:

```ts
export const getChecklistDisplayDefinitions = ({
  mode,
  snapshot,
  version,
}: {
  mode: ReviewerAppMode;
  snapshot?: ReviewChecklistDefinitionSnapshot;
  version: string;
}): ReviewChecklistDefinition[] => {
  const registered = getChecklistDefinitions(mode, version);
  if (registered.length > 0) return registered;
  if (!snapshot || snapshot.mode !== mode) return [];
  return snapshot.items.map((item) => ({
    id: item.id,
    title: item.label,
    description: item.description,
    sourceUrl: item.sourceUrl,
    conditional: item.conditional,
  }));
};
```

This fallback is display-only. Active saves and decisions remain fail-closed for unknown versions.

- [ ] **Step 3: Implement grouped controls**

Use this API:

```ts
type ChecklistSaveState = "idle" | "saving" | "saved" | "error";

type ReviewerChecklistProps = {
  checklist: StoredReviewChecklist;
  disabled: boolean;
  mode: ReviewerAppMode;
  onAddNote: (note: string) => void;
  onChange: (checklist: StoredReviewChecklist) => void;
  onRetrySave: () => void;
  saveState: ChecklistSaveState;
  version: string;
};
```

For the grouped version, map Issue text to `evidence` and N/A text to `applicabilityNote` without changing the stored shape. Rebuild items on status changes so stale fields cannot survive:

```ts
const nextItem =
  status === "fail"
    ? { id, status, evidence: existing?.evidence ?? "" }
    : status === "na"
      ? { id, status, evidence: "", applicabilityNote: "" }
      : { id, status, evidence: "" };
```

Apply the shared input limits. For legacy versions, retain the current detailed controls and required N/A note so in-progress legacy reviews remain editable.

- [ ] **Step 4: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx tests/unit/admin-reviewer-domain.test.ts --runInBand
git add web/scenes/Admin/reviewer/detail/ReviewerChecklist.tsx web/scenes/Admin/reviewer/checklist.ts web/tests/unit/admin-reviewer-components.test.tsx
git commit -m "simplify reviewer checklist controls"
```

Expected: checklist tests PASS.

## Task 5: Serialize checklist autosaves

**Files:**

- Create: `web/scenes/Admin/reviewer/detail/checklist-save-queue.ts`
- Test: `web/tests/unit/admin-reviewer-checklist-save-queue.test.ts`
- Modify: `web/scenes/Admin/reviewer/detail/ReviewerWorkspace.tsx`
- Modify: `web/tests/unit/admin-reviewer-components.test.tsx`

- [ ] **Step 1: Write failing queue tests**

Use deferred promises to prove:

- Rapid changes never invoke saves concurrently.
- Changes during an active save collapse to the newest pending snapshot.
- `flush()` waits through the active save and newest pending successor.
- A failed save retains its snapshot and exposes `retry()`.
- A new edit replaces a failed snapshot.
- State transitions are Saving → Saved or Saving → Error.

```bash
cd web && pnpm jest tests/unit/admin-reviewer-checklist-save-queue.test.ts --runInBand
```

Expected: FAIL because the coordinator does not exist.

- [ ] **Step 2: Implement the coordinator**

Create a framework-independent queue with this contract:

```ts
export type ChecklistSaveQueue = {
  enqueue: (checklist: ReviewChecklist) => Promise<boolean>;
  flush: () => Promise<boolean>;
  retry: () => Promise<boolean>;
  reset: () => void;
};
```

Internally keep one active promise plus newest pending and failed snapshots. `enqueue` replaces pending state, `drain` loops sequentially, `flush` waits for the whole drain, and `retry` requeues the failed snapshot. Add a generation counter so `reset()` ignores completion state from an old submission's in-flight request.

- [ ] **Step 3: Connect autosave to live workflow state**

In `ReviewerWorkspace`, create the queue once per submission. Its save callback must:

1. Await `heartbeatPromiseRef.current`.
2. Read `workflowRef.current`, never a render-time token/version.
3. Validate the snapshot and current checklist version.
4. PUT to the existing checklist endpoint.
5. Apply the response's token/version before the next queued save.
6. Set `persistedChecklistVersion` on success.
7. Return false without discarding local state on failure.

Call `enqueue(nextChecklist)` for group, note, and internal-note changes. Remove the Save checklist button and `checklistDirty`. Disable decisions during Saving or Error.

- [ ] **Step 4: Add integration tests**

Mock incrementing checklist responses. Make two quick edits, resolve the first save, and assert the second request starts afterward with the first response's updated `expectedReviewVersion`.

- [ ] **Step 5: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-checklist-save-queue.test.ts tests/unit/admin-reviewer-components.test.tsx tests/api/admin/reviewer-workflow.test.ts --runInBand
git add web/scenes/Admin/reviewer/detail/checklist-save-queue.ts web/scenes/Admin/reviewer/detail/ReviewerWorkspace.tsx web/tests/unit/admin-reviewer-checklist-save-queue.test.ts web/tests/unit/admin-reviewer-components.test.tsx
git commit -m "autosave reviewer checklist"
```

Expected: tests PASS and no Save checklist button remains.

## Task 6: Add action rail and decision confirmation

**Files:**

- Create: `web/scenes/Admin/reviewer/detail/ReviewerDecisionComposer.tsx`
- Create: `web/scenes/Admin/reviewer/detail/ReviewerDecisionConfirmation.tsx`
- Create: `web/scenes/Admin/reviewer/detail/ReviewerActionRail.tsx`
- Modify: `web/tests/unit/admin-reviewer-components.test.tsx`

- [ ] **Step 1: Write failing composer and Sheet tests**

Cover:

- Outgoing text is labeled `Message to developer` and capped at 20,000 characters.
- Request changes needs a nonblank message; approval does not.
- Override controls are absent when clean and appear under `Override blocked approval` only for failed/incomplete approval.
- A nonblank override is required before blocked approval proceeds.
- Initial outcome buttons open a Sheet without calling `onConfirm`.
- The Sheet shows app identity, checklist summary, exact formatted outgoing message, and `ReviewerTestTarget`.
- Final buttons are `Confirm request changes` and `Confirm approval`.
- Closing returns focus to the invoking button through Radix behavior.

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
```

Expected: FAIL because the decision components do not exist.

- [ ] **Step 2: Implement note insertion and visible disabled reasons**

Export:

```ts
export const appendReviewerNote = (message: string, note: string) => {
  const trimmedNote = note.trim();
  if (!trimmedNote) return message;
  const trimmedMessage = message.trimEnd();
  return trimmedMessage ? `${trimmedMessage}\n\n${trimmedNote}` : trimmedNote;
};
```

Never insert the checklist title. Use `formatDeveloperDecisionMessage` with failed labels for the Sheet preview. Associate visible disabled-reason text with actions via `aria-describedby`. Use assertive live regions for save/decision errors and polite regions for routine save state.

- [ ] **Step 3: Implement confirmation and responsive action surfaces**

Use `components/ui/sheet.tsx`. Keep pending outcome state in `ReviewerWorkspace`. Render `ReviewerTestTarget` inside confirmation. The preview can freeze outcome/message, but the final callback must revalidate current workflow state.

At `lg`, render a 360-pixel sticky rail with bounded viewport scrolling. Below `lg`, render one compact sticky test header plus a bottom dock showing completion and `Message and decide`; that button opens the composer Sheet. A second QR appears only while confirmation is open.

- [ ] **Step 4: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
git add web/scenes/Admin/reviewer/detail/ReviewerDecisionComposer.tsx web/scenes/Admin/reviewer/detail/ReviewerDecisionConfirmation.tsx web/scenes/Admin/reviewer/detail/ReviewerActionRail.tsx web/tests/unit/admin-reviewer-components.test.tsx
git commit -m "confirm reviewer decisions"
```

Expected: tests PASS and initial outcome buttons perform no mutation.

## Task 7: Integrate the responsive three-tab workspace

**Files:**

- Modify: `web/scenes/Admin/reviewer/detail/ReviewerWorkspace.tsx`
- Modify: `web/scenes/Admin/reviewer/detail/ReviewOverview.tsx`
- Modify: `web/tests/unit/admin-reviewer-components.test.tsx`
- Delete: `web/scenes/Admin/reviewer/detail/ReviewGuidelines.tsx`
- Delete: `web/scenes/Admin/reviewer/detail/ReviewTestPanel.tsx`

- [ ] **Step 1: Write failing full-workspace tests**

Update the Next navigation mock with `usePathname`, `useSearchParams`, and `router.replace`. Prove:

- Review, App data, and Activity are the only tabs.
- Tab selection writes `?panel=`, and rerendering a URL state restores it.
- The exact Mini App QR remains rendered for all panels and both confirmations.
- Review contains `Developer submission note`, diff/overview, and grouped checklist.
- App data and Activity mount only while active.
- External submissions keep the safe link visible with no QR.
- Initial decision clicks send nothing; final confirmation sends the unchanged endpoint payload.
- Confirmation waits for a deferred checklist save and uses its new workflow version.
- Success clears message, override, pending Sheet, queue, and claim session.
- A changed `submission.id` clears those states and returns to Review.

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
```

Expected: FAIL until the extracted pieces replace the old layout.

- [ ] **Step 2: Wire URL panels**

Read `panel` through `useSearchParams` and parse it. On selection, clone current params, omit `panel` for Review, set it otherwise, then call:

```ts
router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
```

Use `ReviewerHeader`. Give active content one `tabpanel` with IDs matching the tabs.

- [ ] **Step 3: Build the approved information architecture**

Render:

- Review: `ReviewOverview`, then `ReviewerChecklist`.
- App data: `ReviewMetadata` only while active.
- Activity: `ReviewHistory` only while active.

Rename the changelog heading to `Developer submission note`. Pass stored `definitionSnapshot` to checklist display. Remove Test and Guidelines panels.

- [ ] **Step 4: Confirm decisions safely**

Replace immediate `decide` calls with this sequence:

1. Await `heartbeatPromiseRef.current`.
2. Await `checklistSaveQueue.flush()`.
3. Keep confirmation open and abort when save fails.
4. Re-read `workflowRef.current`.
5. Re-run message and approval validation.
6. Send the existing payload with current token/version.
7. On success, clear claim session, composer/override/confirmation/queue state and refresh.

On 409, clear claim state, close confirmation, refresh, and require reclaim. On other failures, preserve inputs and confirmation for retry.

- [ ] **Step 5: Show structured workflow errors**

Parse bodies shaped like `{ code?: string; error?: string }`. Display safe returned errors for 400-series workflow failures and status-specific fallbacks for invalid JSON, network, and 500-series failures. Preserve the dedicated 409 behavior.

- [ ] **Step 6: Finish responsive layout and delete superseded files**

Use `lg:grid-cols-[minmax(0,1fr)_360px]`, `max-h-[calc(100dvh-2rem)]`, and rail overflow. Reserve mobile bottom padding for the dock and keep the compact target sticky. Delete old Test/Guidelines files after imports and tests move.

- [ ] **Step 7: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx tests/unit/admin-reviewer-domain.test.ts tests/api/admin/reviewer-workflow.test.ts tests/api/admin/reviewer-decision.test.ts --runInBand
git add web/scenes/Admin/reviewer/detail/ReviewerWorkspace.tsx web/scenes/Admin/reviewer/detail/ReviewOverview.tsx web/scenes/Admin/reviewer/detail/ReviewGuidelines.tsx web/scenes/Admin/reviewer/detail/ReviewTestPanel.tsx web/tests/unit/admin-reviewer-components.test.tsx
git commit -m "redesign reviewer workspace"
```

Expected: focused workspace and workflow tests PASS.

## Task 8: Fix expiry timing, hydration-safe dates, and submitted images

**Files:**

- Create: `web/scenes/Admin/reviewer/detail/ReviewerTime.tsx`
- Modify: `web/scenes/Admin/reviewer/detail/ReviewClaimBar.tsx`
- Modify: `web/scenes/Admin/reviewer/detail/ReviewOverview.tsx`
- Modify: `web/scenes/Admin/reviewer/detail/ReviewHistory.tsx`
- Modify: `web/scenes/Admin/reviewer/detail/ReviewMetadata.tsx`
- Modify: `web/tests/unit/admin-reviewer-components.test.tsx`

- [ ] **Step 1: Write failing clock/date/image tests**

With fake timers, prove an active claim becomes expired and claimable when its timestamp passes without a rerender. Add server-render/hydrate coverage with no hydration warning from claim, overview, or history dates. Assert submitted images have lazy loading, dimensions when known, and descriptive alt text.

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
```

Expected: FAIL because dates use `Date.now()`/`toLocaleString()` in render and images lack attributes.

- [ ] **Step 2: Add deterministic time primitives**

Create:

```tsx
export const ReviewerDateTime = ({ value }: { value: string }) => {
  const [label, setLabel] = useState(value);
  useEffect(() => {
    const parsed = new Date(value);
    setLabel(Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString());
  }, [value]);
  return <time dateTime={value}>{label}</time>;
};

export const useReviewerNow = (intervalMs = 30_000) => {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs]);
  return now;
};
```

Use `now === null` as the stable pre-hydration state. Replace locale rendering in claim, overview, and history with `ReviewerDateTime`; compute expiry/relative age from `useReviewerNow` only after mount.

- [ ] **Step 3: Preserve lazy signed assets and size images**

Keep `ReviewMetadata` mounted only on App data so signed-asset fetching remains lazy. Add `loading="lazy"`, `decoding="async"`, and stable dimensions from metadata when available; otherwise use the asset type's fixed fallback aspect ratio.

- [ ] **Step 4: Run tests and commit**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx --runInBand
git add web/scenes/Admin/reviewer/detail/ReviewerTime.tsx web/scenes/Admin/reviewer/detail/ReviewClaimBar.tsx web/scenes/Admin/reviewer/detail/ReviewOverview.tsx web/scenes/Admin/reviewer/detail/ReviewHistory.tsx web/scenes/Admin/reviewer/detail/ReviewMetadata.tsx web/tests/unit/admin-reviewer-components.test.tsx
git commit -m "fix reviewer timing and assets"
```

Expected: tests PASS and claim state updates as fake time advances.

## Task 9: Verify the complete workflow

**Files:**

- Modify only if a regression is found: files from Tasks 1–8
- Never commit Playwright reports, screenshots, traces, or videos

- [ ] **Step 1: Run focused regressions**

```bash
cd web && pnpm jest tests/unit/admin-reviewer-components.test.tsx tests/unit/admin-reviewer-checklist-save-queue.test.ts tests/unit/admin-reviewer-domain.test.ts tests/unit/admin-reviewer-decision-request.test.ts tests/unit/admin-reviewer-fetch.test.ts tests/unit/admin-reviewer-pages.test.ts tests/api/admin/reviewer-workflow.test.ts tests/api/admin/reviewer-decision.test.ts --runInBand
```

Expected: all focused suites PASS.

- [ ] **Step 2: Run required repository checks**

```bash
cd web && pnpm format:check
cd web && pnpm typecheck
cd web && pnpm build
```

Expected: all exit 0. If formatting fails, run `cd web && pnpm format`, inspect the diff, and rerun all checks before committing.

- [ ] **Step 3: Verify with the local Docker stack and Playwright**

Use the repository's existing `.env.example` and development-auth setup. Exercise the seeded Mini App and external detail routes at:

- Desktop: 1440 × 1000.
- Tablet: 820 × 1180.
- Mobile: 390 × 844.
- Narrow overflow check: 320 × 800.

Verify:

1. Claim or recover a review.
2. Switch all panels and use Back/Forward.
3. Confirm persistent exact QR or external HTTPS target.
4. Select all five groups and observe sequential Saving/Saved states.
5. Add an Issue note to the message.
6. Open/cancel both outcomes; check QR visibility and focus return.
7. Request changes on a disposable seeded attempt only from final confirmation.
8. Check sticky behavior, reachable mobile dock, and no horizontal overflow.
9. Inspect the console for hydration, accessibility, and uncaught errors.

Store temporary browser artifacts under `/private/tmp`.

- [ ] **Step 4: Inspect the final diff**

```bash
git status --short
git diff --check
git diff --stat 592a25ae..HEAD
```

Expected: no whitespace errors or generated artifacts.

- [ ] **Step 5: Commit verification fixes only if needed**

```bash
git add web
git commit -m "polish reviewer workspace"
```

Do not make an empty commit.

## Completion checklist

- [ ] Exact Mini App QR is persistent in every panel and both confirmations.
- [ ] External reviews show only a validated HTTPS target.
- [ ] New reviews use five explicit grouped decisions with no clean-path text.
- [ ] Legacy versions and snapshot history still render and validate.
- [ ] Autosaves serialize and terminal decisions await them.
- [ ] Message, override, confirmation, queue, and panel reset correctly.
- [ ] Tabs, progress, sticky actions, save state, and Sheet meet accessibility requirements.
- [ ] Focused tests, formatting, typecheck, build, and responsive browser verification pass.
