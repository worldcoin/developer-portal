# Reviewer workspace redesign

Status: approved interaction direction on 2026-08-31

## Context

The current internal reviewer is safer than the Rettol interface, but it still makes routine review slower than it needs to be. The exact Mini App test link and QR live in a dedicated Test tab. The outgoing developer message and decision buttons sit in a narrow rail beside a long checklist. The checklist contains 14 items for Mini Apps, exposes an evidence field for every checked item, requires a separate save, and keeps an override field visible even when no override is needed.

The Rettol reference screens have a persistent app header and decision controls, but they split evidence across seven sparse tabs and hide the QR inside approval and rejection sheets. Neither structure gives a reviewer a clear path from testing an app to recording issues and sending a decision.

This redesign makes the review workspace task-oriented. It keeps testing, checking, feedback, and the final decision close together without changing the claim, versioning, or publication guarantees behind the workflow.

## Goals

- Keep a usable Mini App QR visible throughout the open review, including decision confirmation.
- Make the outgoing developer message and the two routine outcomes easy to reach.
- Reduce the checklist to five explicit decisions with extra text only when it helps.
- Replace the current five detail tabs with three task-oriented sections.
- Preserve claim ownership, heartbeat renewal, compare-and-set version checks, immutable snapshots, and durable decision behavior.
- Fix the correctness and accessibility problems found during the audit that directly affect this workflow.

## Non-goals

- Redesigning the reviewer queue table.
- Changing reviewer roles, claim duration, notification delivery, or publication rules.
- Adding a Ban action to the normal review flow.
- Adding separate World App and App Store approval switches. The current submission and decision model has one listing target and one outcome.
- Changing the stored checklist payload shape or decision endpoint contract.

## Chosen approach

Use a two-pane review workspace on desktop. The main pane holds evidence and the simplified checklist. A sticky action rail holds the test target, claim state, progress, developer message, and decision actions.

On narrow screens, use a compact sticky test header and a sticky bottom action dock. The content remains one column. Opening the decision composer uses a sheet, but the QR remains visible in the sheet header.

This approach was chosen over a single long page because metadata and history can be large, and over improved versions of the existing tabs because a dedicated Test tab conflicts with the requirement to keep the QR available at all times.

## Information architecture

The detail workspace has three tabs:

1. **Review**
   - Developer submission note
   - Draft versus live summary
   - Automated blockers and sensitive configuration warnings
   - Simplified checklist
2. **App data**
   - Canonical metadata and localizations
   - Submitted images
   - Contracts, permissions, actions, and World ID configuration
3. **Activity**
   - Immutable review events
   - Decision and notification history
   - Retry controls for failed asset preparation or delivery

There is no Test tab. Testing is part of the persistent action rail.

The active tab is reflected in the URL so refresh, back, forward, and copied links retain the selected section. The tab implementation uses a real tablist, associated tabpanels, roving focus, and arrow-key navigation.

## Persistent test target

For Mini Apps, the action rail renders:

- A `Scan to test` label.
- A QR generated from the exact immutable draft URL.
- The draft URL in copyable form.
- `Open in World App` and copy actions.

The desktop QR is at least 160 by 160 pixels. It stays sticky while the main pane scrolls. The compact mobile header always shows an 88 by 88 pixel QR beside the app identity and expands it on activation. Decision confirmation keeps the same QR visible so the reviewer can retest before committing the outcome.

External integrations do not receive a World App QR. The same persistent area instead shows the validated HTTPS integration URL, an `Open integration` action, and a copy action. This preserves the current safety rule that rejects non-HTTPS URLs and URLs with embedded credentials.

## Simplified checklist

Introduce checklist version `2026-08-31.1` with five stable groups:

| Stored ID                       | Reviewer label              | What it covers                                                                                  |
| ------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `group.listing-localization`    | Listing and localization    | Name, descriptions, category, countries, languages, and listing assets                          |
| `group.experience-test`         | Experience and test flow    | Core path, navigation, copy, loading, cancellation, and failure states                          |
| `group.integration-reliability` | Integration and reliability | Submitted URL, World ID or MiniKit behavior, actions, contracts, and production readiness       |
| `group.permissions-safety`      | Permissions and user safety | Sensitive permissions, financial claims, prohibited content, notifications, and user safeguards |
| `group.legal-support`           | Legal and support           | Privacy, terms, consent, regional restrictions, branding, and working support channels          |

Each group has a single segmented control with three stored states:

- `Pass` maps to `pass`.
- `Issue` maps to `fail`.
- `N/A` maps to `na`.

The reviewer must choose one state for each group before approval. Untouched groups never count as passed.

Pass requires no text. Issue and N/A reveal one short note field. The note is optional for the new grouped version because the outgoing developer message remains the required communication for requesting changes. Legacy checklist versions retain their original validation, including required N/A applicability notes.

An Issue exposes an `Add note to message` action when the reviewer entered a note. That action inserts only the reviewer-authored note, not the checklist group title. The confirmation preview separately shows the server-generated failed-check summary so the durable result cannot repeat the same failed label.

The checklist autosaves after each state or note change. There is no separate Save checklist button. The rail shows `Saving`, `Saved`, or `Retry save`. A decision waits for any in-flight save and uses the resulting claim token and review version. If saving fails, both decision actions stay disabled until the reviewer retries or changes the checklist again.

Existing submissions keep their stored checklist version. Version `2026-08-27.1` stays registered, and historical attempts render labels and evidence from their immutable `definitionSnapshot` when a code-level definition is unavailable. No existing checklist rows are rewritten.

## Decision composer

The action rail uses one field labeled `Message to developer`. This label always means outgoing reviewer feedback. The developer's incoming submission note is labeled `Developer submission note` in the Review tab.

The message is:

- Optional for approval.
- Required for Request changes.
- Prepopulated only when the reviewer explicitly adds checklist issue suggestions.
- Preserved while moving between the three tabs.
- Cleared when the submission ID changes or after a successful terminal decision.

The rail ends with two clearly separated actions:

- `Request changes`, styled as the secondary destructive action.
- `Approve`, styled as the primary positive action.

Both actions open a confirmation sheet rather than immediately mutating the review. The sheet shows the app identity, current checklist summary, exact outgoing message, and persistent test target. The final button names the outcome, `Confirm request changes` or `Confirm approval`.

The existing override capability remains available only when approval is blocked by an Issue or an incomplete group. It appears under an `Override blocked approval` disclosure and requires an internal reason. It is not shown during the normal path.

Ban remains outside this workspace because it is an escalation action rather than a routine review outcome.

## Responsive behavior

At desktop widths:

- Main evidence pane fills the available width.
- Action rail stays visible at 360 pixels wide.
- The rail has its own bounded scroll only when the viewport is short.

At tablet and mobile widths:

- App identity and the compact test target stay at the top.
- The selected content tab scrolls normally.
- A bottom dock exposes `Message and decide` plus checklist completion.
- The composer opens as a sheet above the bottom dock.
- The QR remains visible in the sticky header and sheet header.

The decision controls must never appear after the full checklist in document order without a sticky shortcut, which is the current mobile failure mode.

## Component boundaries

Keep workflow coordination in `ReviewerWorkspace`, but move presentation into focused components:

- `ReviewerHeader` renders identity, status, queue navigation, and tab navigation.
- `ReviewerTestTarget` renders the Mini App QR or external integration link.
- `ReviewerChecklist` renders the five grouped controls and autosave status.
- `ReviewerDecisionComposer` owns message editing, issue suggestions, and outcome buttons.
- `ReviewerDecisionConfirmation` renders the final sheet.
- `ReviewerActionRail` composes the test target, claim bar, checklist progress, and decision composer.

`ReviewerWorkspace` continues to own the authoritative workflow state, browser-session claim token, heartbeat promise, serialized checklist save, and decision request. Presentation components receive explicit values and callbacks. They do not call workflow endpoints directly.

Reuse the existing exact draft URL builder, external URL validator, metadata diff, signed asset loading, claim bar, and immutable history components.

## State and request flow

1. A reviewer claims or recovers the submission using the current claim endpoint.
2. A checklist change updates local state and starts a serialized autosave.
3. A later checklist change replaces the pending local snapshot but never sends requests concurrently with the previous save.
4. Autosave updates the workflow claim token and review version from the server response.
5. Opening confirmation freezes a preview of the selected outcome and message. It does not send a request.
6. Confirming waits for the heartbeat and checklist save promises, validates current state again, and sends the existing decision payload with the newest token and version.
7. A successful decision clears browser claim state and local message state, closes the sheet, and refreshes the server data.

Conflict responses clear the local claim token, close confirmation, refresh server data, and tell the reviewer to reclaim. Other server failures keep the message and checklist state intact and show a specific retryable error when the response provides one.

## Correctness fixes included

- Clear an old N/A applicability note when a group changes to Pass or Issue.
- Use the stored checklist definition snapshot for retired historical versions.
- Reset developer message, override reason, active confirmation, and tab state when the submission ID changes.
- Update claim expiry on a timer so an expired claim becomes recoverable without a page refresh.
- Move relative-age and locale-sensitive date formatting to hydration-safe client state or a stable server-provided representation.
- Preserve signed asset lazy loading when App data is first opened.
- Add explicit image dimensions and lazy loading to submitted assets where dimensions are known.
- Show structured workflow errors instead of reducing every non-conflict failure to the same toast.
- Apply client-side length limits that match the existing API limits.

## Accessibility

- Implement complete tablist, tab, and tabpanel relationships.
- Support Left Arrow, Right Arrow, Home, and End within the tablist.
- Give progress indicators names and `aria-valuenow`, `aria-valuemin`, and `aria-valuemax`.
- Keep reasons for disabled decisions visible and associate them with the controls.
- Move focus into the confirmation sheet, trap it while open, and return it to the invoking button on close.
- Give all sticky controls visible keyboard focus styles.
- Announce autosave state and decision failures through an appropriate live region.
- Keep touch targets at least 44 by 44 pixels on mobile.

## Testing

Use test-driven development for behavior changes.

Unit and component coverage must prove:

- The exact Mini App QR stays rendered while each tab is active and inside both confirmation outcomes.
- External integrations render the persistent validated link and no QR.
- Five grouped checklist controls replace the current long checklist for the new version.
- Pass needs no note, and Issue or N/A reveals only one note field.
- Every group needs an explicit state before normal approval.
- Checklist changes autosave and serialize version updates.
- A decision waits for an in-flight heartbeat and checklist save.
- Request changes requires a message; approval does not.
- Checklist issue suggestions do not duplicate server-generated failed labels.
- Message and override state reset when the submission changes.
- Claim expiry updates without a manual refresh.
- Historical definition snapshots render when their code version is unavailable.
- Confirmation sends the exact existing decision payload only after the final action.
- Tabs and progress controls expose the required accessibility semantics.

Browser verification must cover desktop, tablet, and mobile widths. It checks persistent QR visibility, reachable decision controls, sticky behavior, sheet focus, horizontal overflow, and the complete claim to checklist to message to decision flow against the local Docker stack.

Run the reviewer component and API suites, type checking, formatting checks, and the production build before completion.

## Acceptance criteria

- A Mini App reviewer can see and scan the exact draft QR without opening a Test tab.
- The QR remains visible while reviewing evidence, editing feedback, and confirming either outcome.
- The normal checklist requires five state selections and no text for a clean approval.
- The reviewer never needs to press a separate checklist save button.
- Requesting changes requires one outgoing message and one confirmation.
- Approving a clean submission requires five group confirmations and one final confirmation.
- The action rail or mobile dock keeps the message and decisions reachable at all times.
- The workspace has three task-oriented tabs with working keyboard and URL navigation.
- Existing claim, heartbeat, workflow-version, snapshot, and durable-decision guarantees still pass their regression tests.
- The correctness issues listed in this document have regression coverage.
