# Developer Portal v3 — Information Architecture Spec

> Target-state design for the Dev Portal 3.0 rebuild. Decisions below were reached
> via a grilling session (2026-06-25), grounded in two source-verified audits of
> the current portal (`docs/user-journeys/`), and hardened by an adversarial review
> (see §12). This is the buildable reference; the current-portal map lives in
> `docs/user-journeys/`.

## 1. Goal & principles

- **Look:** Vercel's *layout* (left sidebar, top switchers, density, card style) skinned in **World's brand identity** — World blue `#4940E0`, World fonts. Not Vercel's monochrome.
- **Greenfield rebuild.** Not constrained by existing components/routes.
- **No hidden failures** (org rule): real status, fail-closed, fail-honest, single source of truth for permissions, honest health.

## 2. Tech approach

- **Styling:** 100% Tailwind, components owned in-repo. Build on **CSS-variable tokens**; ship **both light and dark themes** with a **toggle in the user popup**, **defaulting to light** (World's brand). (A "system" option later is trivial on the same tokens.)
- **Interactive behavior:** **Radix** headless primitives (modal, dropdown, combobox, popover, tooltip, tabs, toast, ⌘K) — shadcn model. No themed UI-kit lock-in. OSS Vercel-style templates are reference only (no proprietary code).
- **URL shape:** stays within the `/teams/[teamId]/…` namespace, enabling an in-place flag branch (§8). Two refinements vs. today: the **bare `/teams/[teamId]` route renders the apps grid** (was: Members), and team sections get explicit child routes (§3).

## 3. Shell & scopes

Three scopes:

| Scope | Route | Chrome |
|---|---|---|
| **Team** | `/teams/[teamId]` → apps grid; `/teams/[teamId]/{members,api-keys,settings}` | Stable sidebar + content |
| **App** | `/teams/[teamId]/apps/[appId]` | Stable sidebar; §1 reflects the selected app |
| **Account** | `/profile/*` | Dedicated account area off the user popup — **outside** the per-team flag |

- **One stable left sidebar.** It does **not** swap between scopes.
- **Sidebar header — team control, two targets:** clicking the **team name/logo** → the **apps grid** (team home / "all apps") at `/teams/[teamId]`; the **chevron** beside it → the **team-switcher** dropdown (switch teams).
- **App switcher** lives in the **content header** (not the side-nav). It lists **only real apps + "Create app"** — there is **no "All Apps" entry**. The apps grid is reached solely via the team name.
- **Bare-team route:** `/teams/[teamId]` resolves to the **apps grid**. Team sections (Members, API Keys, Settings) get their **own child routes**. Old deep links to `/teams/[teamId]` (which used to show Members) land on the grid — acceptable; add a redirect only if a Members deep-link contract must be preserved.

## 4. Sidebar contents

### §1 — App scope (reflects the *selected* app)
Four flat items; composites use **in-page horizontal tabs** (not sidebar children):

| Item | In-page tabs / notes |
|---|---|
| **Dashboard** | App overview + KPIs, **plus the verification-status surface** (`VerificationStatusSection`: `draft` / `awaiting_review` / `changes_requested` / `verified`) and the ban/banner state. |
| **World ID** | Tabs: **RP** (World ID 4.0) · **Actions (v4)**. *Forward-only:* no legacy v3 Incognito Actions, no Sign-in/OIDC config UI (§9). **RP tab has two states:** (a) **un-registered** → the "Enable World ID 4.0" **registration wizard** (managed vs self-managed + signer-key setup) plus the migration CTA (today's `WorldId40MigrationBanner`); (b) **registered** → RP management. RP credential/danger actions live as **in-page sections** under RP: generate/rotate signer key, Switch-to-Self-Managed, and **toggle-RP-active** *(net-new — no UI exists today; only a Hasura action — so this adds the missing deactivate/reactivate workflow)*. Action list→detail (settings / Try-it) is in-page drill-down. *(A v4 proof-debugger is out of scope unless explicitly added — none exists today; see §10.)* |
| **Configuration** | App profile, **store listing incl. image upload** (logo / showcase / meta-tag / content-card) **and the localisation editor** (per-language name/description/short-name, `supported_languages`, countries, categories), mode toggle. **App-review lifecycle lives here:** submit-for-review + `SubmitAppModal` (changelog, `is_developer_allow_listing` toggle, localisation validation); the **VersionSwitcher** (verified vs draft — it gates editability); the **RejectionBanner + ResolveModal** (`changes_requested` → remove-from-review). **Delete app** = in-page danger section here. |
| **Mini App** | Tabs: **Permissions** · **Transactions** · **Notifications** |

**One-time signer-key reveal:** shown once in a **reveal-once modal** (copy + "you won't see this again"); server stores only a hash; lost key → rotate. Matches the API-key masking principle (§7).

### Team scope section
**Members** · **API Keys** · **Settings** (all team-scoped; each on its own child route per §3). **Delete team** = in-page danger under Settings.
- **Members** hosts the **invite flow** (`InviteTeamMemberDialog`) and **per-member row actions** — edit role, remove member (Owner-only), resend / cancel invite (Owner/Admin), and pending-invite rows. These are the surfaces §7's policy governs.

### Bottom — user popup
Opens from the user avatar (bottom-left): **Profile · My Teams · Help · Docs · Theme (light/dark, default light) · Log out**, plus a **Platform Status** indicator pinned at the bottom (§6).
- **Help / Docs** = external link-outs (Help also absorbs the ban-appeal contact). No in-portal "Support" page.

### Account area (from the popup)
- **Profile** — display name, analytics consent, avatar color *(persistence is an open decision — currently a fake save)*. **Delete account** = in-page danger here.
- **My Teams** — cross-team membership list with switch / leave / transfer-ownership / delete-team. Inherently cross-team → cannot live under a single team's sidebar; this is why account is its own scope.

### "When does All Apps happen?"
There is no All-Apps *value* in the switcher. The **apps grid** (reached via the team name) *is* the all-apps / team-home surface. On the grid / any team-scope page (no app selected), clicking a §1 app item shows a **"Continue — choose an app"** picker (Vercel's "Continue to {feature}" pattern), never a dead aggregate.

## 5. Landing & MRU resolver

- **Default landing** (fresh open / post-login) = the user's **most-recently-used app's Dashboard** — *not* the grid (deliberately unlike Vercel, which defaults to All Projects).
- All redirect chokepoints (`login-callback`, root, `create-team`, `/teams`, post-delete) converge on **one shared landing resolver**.
- **MRU storage:** a **cookie** (server-readable in the resolver; per-device). `localStorage` is unusable — the server can't read it for the redirect.
- **Fallback chain, resolved per (user, team), never cross-team:**
  1. Valid + accessible MRU app in this team → its Dashboard.
  2. Stale / no MRU (deleted, lost access, other team) → most-recently-**created** accessible app in this team.
  3. Zero apps → the apps grid + "create your first app" empty state.

## 6. Platform Status indicator

- Pinned at the bottom of the user popup (Vercel-style "● All systems normal").
- **Live**, wired to World's existing status page **`https://status.world.org/`** (already linked in the repo; no live-status code today). Fetch its provider summary API (endpoint TBD by provider). **Resilience (org rules):** server-side **single-flight, shared cached** value (don't fan out to the provider per popup open); **bounded timeout**; **bounded retries with exponential backoff + jitter**. Color the dot by real upstream status; click → opens `status.world.org`.
- **Fail-honest:** if the status API is unreachable/times out, show **"status unavailable"** — never default to green.
- **Observability:** emit a metric/alert on status-fetch timeout/error **and** when the dot enters "status unavailable" (parity with the §8 flag-read metric).
- **Not** driven by the portal's own health probe. A self-rendered health dot is circular (if the app is down you can't see the dot), and health probes serve the orchestrator, not developers. For portal-specific signal, add the **Developer Portal as a component on `status.world.org`** (external uptime monitoring); the dot reads that.

### Health-probe semantics (org rule — do not conflate)
- **Liveness:** process is up; **no dependency checks** (a failing dep must not trigger a restart loop).
- **Readiness:** critical deps reachable → on breakage, **drop the instance from LB rotation** (not restart). Critical = Redis / OpenSearch. **SSM is degraded-mode-OK** (the flag fails closed to the old portal), so SSM-down does **not** fail readiness.
- **Startup:** gates traffic until init completes.
- `/api/health` today returns 200 unconditionally — see §10.

## 7. Permissions & gating

- Roles: **Owner / Admin / Member**. Preserve the **disable-not-hide** UX (commit `76652ac`).
- **Gated pages render in-shell** — sidebar/chrome intact, **no** `/unauthorized` bounce except for genuinely non-recoverable cases (not a team member, deleted/cross-team resource).
  - **View-OK, edit-gated** (e.g. team Settings): page renders **read-only** — fields visible/disabled, each section showing **"You need additional permissions to manage your team's X"** (Vercel team-settings pattern).
  - **Secret carve-out** (API keys): when you lack **view** rights, the secret value is **masked/withheld** ("Visible to Owners & Admins") — *never* shown read-only, never sent to the browser. Owner/Admin can view; create/reset/delete are disabled for Admins (managing keys = Owner-only).
- **Single source of truth:** one central permission policy module drives **nav-disable, page state, secret-masking, middleware, and server enforcement** — so the UI and server can never diverge.

## 8. Feature flag & rollout

- **Mechanism mirrors `world-id-4-0` 1:1:** SSM Parameter Store `portal-v3/enabled-teams` (deployed) + `LOCAL_DEV_PORTAL_V3_ENABLED_TEAMS` env override **only when `NODE_ENV === "development"`** + the `enable_all_teams` token. Server computes the enabled-teams list and passes it to a client provider (jotai atom). **No** production env fallback for non-AWS self-hosters.
- **Per-team allowlist.** Current rollout state: only the **internal TFH dev team** (dogfood/canary, step 0) → partners → `enable_all_teams`.
- **Relationship to the `world-id-4-0` flag (distinct flag, same mechanism):** because v3's World ID surface is RP/WID-4.0-only, **only WID-4.0-enabled teams are eligible for the `portal-v3` allowlist** (`portal-v3` ⊆ `world-id-4-0`). This makes "don't strand v3-dependent teams" an *enforced precondition*, not advisory — and since a v3 team is necessarily WID-4.0-enabled, its legacy Incognito actions are already read-only (gated on the WID-4.0 flag), so there's no "writable legacy actions in v3" state. *(Confirmed.)*
- **In-place layout branch:** the flag is read in the **team-scoped layout** (`/teams/[teamId]/**`, after auth).
- **Exempt / unbranched** (render identically regardless of flag): auth & onboarding (`/login`, OAuth/OIDC callbacks, `/join`, `/join-callback`, `/create-team`), `/unauthorized`, logout, **account pages** (`/profile/*`), public + MCP APIs (incl. the OIDC runtime endpoints — §9), `/kiosk`, crons, `/api/health`.
- **Fail-closed:** missing/error SSM → defaults to `[]` → off → old portal. Preserve same-origin `returnTo` across the branch.
- **Observability:** emit a metric/alert on **SSM flag-read failures** (a silent outage otherwise looks like a stalled rollout).

## 9. Deprecations (config UI not rebuilt in v3)

| Surface | Disposition |
|---|---|
| Legacy v3 Incognito Actions (`/actions`) | Config UI old-portal only; read-only once a team enables WID 4.0 (and every v3 team is WID-4.0-enabled per §8). |
| Sign in with World ID — **config UI** (`/apps/[appId]/sign-in-with-world-id` + its `/proof-debugging`) and `reset-client-secret` | Dropped from v3 (old portal only). Sunset date (Dec 2025) already passed. |

**Important:** only the **config/management UI** above is dropped. The **OIDC runtime endpoints** (`authorize` / `token` / `userinfo` / `introspect` / `jwks`) remain **live, unbranched public APIs** (exempt per §8) so already-integrated relying parties keep working.

## 10. Carried risks / must-fix (from the audits)

> The user opted **not** to spin these into a separate task — track and fix as part of the v3 build / accompanying hardening.

- **`/api/health` returns 200 unconditionally** even when Redis/OpenSearch/SSM init fails → falsely-healthy (org-rule violation). Fix per the §6 probe split: **readiness** reflects critical deps (Redis/OpenSearch) and drops the instance from rotation on breakage; **liveness** stays dep-free (no restart loops); SSM stays degraded-mode-OK.
- **Permission client/server mismatches** (resolved by the §7 single-source policy + adding server enforcement): `cancel_invite` (client Admin vs Hasura Owner-only); self-row / last-Owner guards client-only; `transfer-ownership` **allows self-transfer** (no filter excludes the current user). *(Verified against `transfer-ownership.generated.ts`: the mutation correctly defaults the new owner to OWNER and demotes the current owner to ADMIN — the earlier "new owner → ADMIN" claim was a stale doc; the real gap is the missing self-transfer guard.)*
- **App-delete IS Owner-role-gated** (`delete_app = {roles:[Owner]}`, enforced at the proxy + `getIsUserAllowedToDeleteApp`) — *not* a membership-only check. **Image upload** (`upload-image`) checks team membership but **not role**; **`delete-images` is an unimplemented stub** (throws "Not implemented yet", checks nothing) — add a server-side role check when it's built.
- **IDOR / under-enforcement:** app layout fetches by `appId` without checking `app.team_id === teamId`; `validate-localisation` keys off `app_metadata_id` alone. Add a shared app-scope guard (app-belongs-to-team 404 + role check).
- **`/api/v1/debugger` is unauthenticated** (open endpoint, legacy proof-debugger). If any debugger is carried into v3, secure it; otherwise it remains a hardening item.
- **Swallowed failures:** invite SendGrid errors show a success toast on partial failure; observability gaps on API-key/client-secret create/reset/delete.
- **Avatar color** is a fake save (never persisted; leaks across sessions) — a false-success bug. v3 **keeps it as-is for now** (product call); the fix (persist, or a deterministic color) is deferred and must not be dropped silently.
- **Account deletion partial cascade:** sole-Owner deletion orphans teams/apps/keys — guard (force transfer/delete first).
- **Mobile:** the stable sidebar must collapse (drawer); the content-header app switcher must stay reachable; the apps grid must absorb the old mobile Apps tab (`/teams/[teamId]/app`).

## 11. Open decisions (not yet made)

- **Avatar color:** v3 **keeps the current picker as-is** for now (still a non-persisted / fake-save) — fixing it (persist, or replace with a deterministic color via `lib/calculate-color-from-string.ts`) is **deferred**; tracked as a known issue in §10.
- **Status provider endpoint:** `status.world.org` is **not** Atlassian Statuspage (`/api/v2/summary.json` → 404) nor Instatus (`/summary.json` → 404), and the page is JS-rendered (no provider signature in HTML). Pin the real JSON endpoint at impl via the live page's **Network tab** (or ask whoever provisioned the status page).
- **Example/template app:** parked.

*Decided since draft:* `portal-v3 ⊆ world-id-4-0` — only WID-4.0-enabled teams are eligible for v3 (§8); theme = light + dark with a user-popup toggle, **default light** (§2/§4); v4 "debugger" **dropped** (§12).

## 12. Adversarial review applied (2026-06-25)

Verdict was **must-fix-before-build**; the following were applied:
- **Blockers fixed:** placed the app-review lifecycle (submit/version-switcher/rejection-resolve/verification-status) under Configuration + Dashboard (§4); placed the WID-4.0 RP **registration wizard + migration CTA** as the World ID→RP un-registered state (§4).
- **Corrected facts (§10):** app-delete is Owner-only; transfer-ownership new-owner→OWNER (only self-transfer is the real gap), verified against source.
- **Resolved gaps:** team-home/`/teams/[teamId]` collision → grid at bare route + child routes for Members/API-Keys/Settings (§3); flag relationship → `portal-v3 ⊆ world-id-4-0` (§8); health-probe liveness/readiness/startup split (§6); status-fetch retries/single-flight/metric (§6); OIDC *runtime* stays live (§9); Configuration sub-surfaces + Members affordances enumerated (§4); toggle-RP-active marked net-new (§4).
- **Confirmed:** (a) v3 eligibility gated on WID-4.0-enabled teams — `portal-v3 ⊆ world-id-4-0` (§8); (b) v4 "debugger" reference dropped (`/api/v1/debugger` remains a hardening item in §10).
- **Decided since:** theme = light + dark, user-popup toggle, default light (§2/§4).
- **7 false positives** from the review were discarded (e.g. the `/(team)/app` route = the mobile Apps tab already covered; the "all apps" wording is explicitly disambiguated; KMS/secret-storage backend is below this doc's altitude).
