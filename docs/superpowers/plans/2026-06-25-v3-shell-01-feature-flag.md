# Portal-v3 Feature Flag — Implementation Plan (Slice 1 of 4)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `portal-v3` server+client feature flag that mirrors the existing `world-id-4-0` flag and is gated so a team is only ever v3-eligible if it is already World ID 4.0-enabled (`portal-v3 ⊆ world-id-4-0`).

**Architecture:** A new `web/lib/feature-flags/portal-v3/` module copies the `world-id-4-0` shape: a pure team-gating predicate (`common.ts`), an async server checker that fails closed to "off" (`server.ts`), a client jotai atom + checker (`client.ts`), and a client provider (`PortalV3Provider.tsx`). The server checker short-circuits to `false` unless `world-id-4-0` is enabled for the team, enforcing the subset rule server-side; the client only ever receives the post-gate team list, so client checks need no extra coupling.

**Tech Stack:** TypeScript, Next.js 16 (app router), jotai, AWS SSM Parameter Store (via `global.ParameterStore`), Jest (ts-jest + jsdom), `@testing-library/react`.

## Global Constraints

- New SSM key (string list): `portal-v3/enabled-teams` (auto-normalized to `/developer-portal/portal-v3/enabled-teams`).
- Dev-only env override: `LOCAL_DEV_PORTAL_V3_ENABLED_TEAMS` (comma-separated), active only when `process.env.NODE_ENV === "development"`.
- Global token that enables all teams: `"enable_all_teams"`.
- **Fail closed:** any missing/error SSM read resolves to `[]` → flag off → old portal. Never throw to the caller.
- **Subset rule:** `isPortalV3EnabledServer(teamId)` MUST return `false` whenever `isWorldId40EnabledServer(teamId)` is `false`, regardless of the portal-v3 allowlist.
- Mirror existing conventions exactly: `?.` on `global.ParameterStore`, `getParameter<string[]>(key, [])`, whitespace-trimmed allowlist entries, `isFetched` guard on the client atom.
- Tests live in `web/tests/unit/`; run from `web/`.

---

### Task 1: Team-gating predicate (`common.ts`)

**Files:**
- Create: `web/lib/feature-flags/portal-v3/common.ts`
- Test: `web/tests/unit/portal-v3-feature-flag.test.ts`

**Interfaces:**
- Produces: `PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN: string`; `isPortalV3EnabledForTeam(enabledTeams: string[] | undefined, teamId: string | undefined): boolean`

- [ ] **Step 1: Write the failing test**

```typescript
// web/tests/unit/portal-v3-feature-flag.test.ts
import {
  PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN,
  isPortalV3EnabledForTeam,
} from "@/lib/feature-flags/portal-v3/common";

describe("portal-v3 team gating", () => {
  it("returns false when teamId is missing", () => {
    expect(isPortalV3EnabledForTeam(["team_123"], undefined)).toBe(false);
  });

  it("returns false when the enabled-teams list is empty", () => {
    expect(isPortalV3EnabledForTeam([], "team_123")).toBe(false);
  });

  it("returns false when the list is undefined (fail-closed)", () => {
    expect(isPortalV3EnabledForTeam(undefined, "team_123")).toBe(false);
  });

  it("returns true when the team id is explicitly enabled", () => {
    expect(isPortalV3EnabledForTeam(["team_123"], "team_123")).toBe(true);
  });

  it("trims whitespace on entries", () => {
    expect(isPortalV3EnabledForTeam([" team_123 "], "team_123")).toBe(true);
  });

  it("returns true when the enable_all_teams token is present", () => {
    expect(
      isPortalV3EnabledForTeam([PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN], "team_123"),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx jest tests/unit/portal-v3-feature-flag.test.ts`
Expected: FAIL — `Cannot find module '@/lib/feature-flags/portal-v3/common'`.

- [ ] **Step 3: Implement the predicate**

```typescript
// web/lib/feature-flags/portal-v3/common.ts
export const PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN = "enable_all_teams";

/**
 * Shared portal-v3 team-gating logic.
 * Supports explicit team IDs and a global override token.
 */
export const isPortalV3EnabledForTeam = (
  enabledTeams: string[] | undefined,
  teamId: string | undefined,
): boolean => {
  if (!teamId || !enabledTeams?.length) {
    return false;
  }

  return enabledTeams.some((rawEntry) => {
    const entry = rawEntry.trim();
    return entry === PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN || entry === teamId;
  });
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx jest tests/unit/portal-v3-feature-flag.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/feature-flags/portal-v3/common.ts web/tests/unit/portal-v3-feature-flag.test.ts
git commit -m "feat(portal-v3): add team-gating predicate"
```

---

### Task 2: Server checker with subset gate (`server.ts`)

**Files:**
- Create: `web/lib/feature-flags/portal-v3/server.ts`
- Test: `web/tests/unit/portal-v3-server.test.ts`

**Interfaces:**
- Consumes: `isPortalV3EnabledForTeam` (Task 1); `isWorldId40EnabledServer` from `@/lib/feature-flags/world-id-4-0/server`; `global.ParameterStore.getParameter<string[]>(name, default)`
- Produces: `isPortalV3EnabledServer(teamId: string | undefined): Promise<boolean>`

- [ ] **Step 1: Write the failing test**

```typescript
// web/tests/unit/portal-v3-server.test.ts
const isWorldId40EnabledServer = jest.fn();
jest.mock("@/lib/feature-flags/world-id-4-0/server", () => ({
  isWorldId40EnabledServer: (...args: unknown[]) =>
    isWorldId40EnabledServer(...args),
}));

import { isPortalV3EnabledServer } from "@/lib/feature-flags/portal-v3/server";

const TEAM = "team_123";

const setParameterStore = (value: string[] | undefined) => {
  global.ParameterStore = {
    getParameter: jest.fn().mockResolvedValue(value),
  } as unknown as NonNullable<typeof global.ParameterStore>;
};

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.LOCAL_DEV_PORTAL_V3_ENABLED_TEAMS;
});

afterEach(() => {
  global.ParameterStore = undefined;
});

describe("isPortalV3EnabledServer (subset gate + allowlist)", () => {
  it("returns false when world-id-4-0 is disabled, even if portal-v3 lists the team", async () => {
    isWorldId40EnabledServer.mockResolvedValue(false);
    setParameterStore([TEAM]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });

  it("returns true when WID4 is enabled and the team is in the portal-v3 list", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    setParameterStore([TEAM]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(true);
  });

  it("returns true when WID4 is enabled and enable_all_teams is set", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    setParameterStore(["enable_all_teams"]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(true);
  });

  it("returns false when WID4 is enabled but the team is not listed", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    setParameterStore(["team_other"]);
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });

  it("fails closed when ParameterStore is unavailable (WID4 enabled)", async () => {
    isWorldId40EnabledServer.mockResolvedValue(true);
    global.ParameterStore = undefined;
    expect(await isPortalV3EnabledServer(TEAM)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx jest tests/unit/portal-v3-server.test.ts`
Expected: FAIL — `Cannot find module '@/lib/feature-flags/portal-v3/server'`.

- [ ] **Step 3: Implement the server checker**

```typescript
// web/lib/feature-flags/portal-v3/server.ts
"use server";

import { isWorldId40EnabledServer } from "@/lib/feature-flags/world-id-4-0/server";
import { isPortalV3EnabledForTeam } from "./common";

/**
 * Server-side check for whether the v3 portal is enabled for a team.
 * Subset rule: a team is only v3-eligible if World ID 4.0 is already enabled
 * for it (portal-v3 ⊆ world-id-4-0). Fails closed.
 */
export const isPortalV3EnabledServer = async (
  teamId: string | undefined,
): Promise<boolean> => {
  // Subset gate: never enable v3 for a team that is not on World ID 4.0.
  if (!(await isWorldId40EnabledServer(teamId))) {
    return false;
  }

  // Local-dev only: never let this env var override SSM in a deployed env.
  const localTeams =
    process.env.NODE_ENV === "development"
      ? process.env.LOCAL_DEV_PORTAL_V3_ENABLED_TEAMS?.split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
      : undefined;

  const enabledTeams = localTeams?.length
    ? localTeams
    : await global.ParameterStore?.getParameter<string[]>(
        "portal-v3/enabled-teams",
        [],
      );

  return isPortalV3EnabledForTeam(enabledTeams, teamId);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx jest tests/unit/portal-v3-server.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/feature-flags/portal-v3/server.ts web/tests/unit/portal-v3-server.test.ts
git commit -m "feat(portal-v3): add server checker with world-id-4-0 subset gate"
```

---

### Task 3: Client atom + checker (`client.ts`)

**Files:**
- Create: `web/lib/feature-flags/portal-v3/client.ts`
- Test: `web/tests/unit/portal-v3-client.test.ts`

**Interfaces:**
- Consumes: `isPortalV3EnabledForTeam` (Task 1)
- Produces: `type PortalV3Config = { isFetched: boolean; enabledTeams: string[] }`; `portalV3Atom` (jotai atom of `PortalV3Config`); `isPortalV3Enabled(config: PortalV3Config, teamId: string | undefined): boolean`

- [ ] **Step 1: Write the failing test**

```typescript
// web/tests/unit/portal-v3-client.test.ts
import { isPortalV3Enabled } from "@/lib/feature-flags/portal-v3/client";

describe("isPortalV3Enabled (client)", () => {
  it("returns false before the config is fetched", () => {
    expect(
      isPortalV3Enabled({ isFetched: false, enabledTeams: ["team_123"] }, "team_123"),
    ).toBe(false);
  });

  it("returns false when teamId is missing", () => {
    expect(
      isPortalV3Enabled({ isFetched: true, enabledTeams: ["team_123"] }, undefined),
    ).toBe(false);
  });

  it("returns true when fetched and the team is enabled", () => {
    expect(
      isPortalV3Enabled({ isFetched: true, enabledTeams: ["team_123"] }, "team_123"),
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx jest tests/unit/portal-v3-client.test.ts`
Expected: FAIL — `Cannot find module '@/lib/feature-flags/portal-v3/client'`.

- [ ] **Step 3: Implement the client atom + checker**

```typescript
// web/lib/feature-flags/portal-v3/client.ts
"use client";

import { atom } from "jotai";
import { isPortalV3EnabledForTeam } from "./common";

export type PortalV3Config = {
  isFetched: boolean;
  enabledTeams: string[];
};

export const portalV3Atom = atom<PortalV3Config>({
  isFetched: false,
  enabledTeams: [],
});

/**
 * Client-side check. The server already applied the world-id-4-0 subset gate
 * when computing enabledTeams, so this is a plain membership check.
 */
export const isPortalV3Enabled = (
  config: PortalV3Config,
  teamId: string | undefined,
): boolean => {
  if (!teamId || !config.isFetched) return false;
  return isPortalV3EnabledForTeam(config.enabledTeams, teamId);
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx jest tests/unit/portal-v3-client.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/feature-flags/portal-v3/client.ts web/tests/unit/portal-v3-client.test.ts
git commit -m "feat(portal-v3): add client atom and checker"
```

---

### Task 4: Client provider + module exports (`PortalV3Provider.tsx`, `index.ts`)

**Files:**
- Create: `web/lib/feature-flags/portal-v3/PortalV3Provider.tsx`
- Create: `web/lib/feature-flags/portal-v3/index.ts`
- Modify: `web/lib/feature-flags/index.ts`
- Test: `web/tests/unit/portal-v3-provider.test.tsx`

**Interfaces:**
- Consumes: `portalV3Atom` (Task 3)
- Produces: `PortalV3Provider({ children, enabledTeams })` — on mount, sets `portalV3Atom` to `{ isFetched: true, enabledTeams }`

- [ ] **Step 1: Write the failing test**

```tsx
// web/tests/unit/portal-v3-provider.test.tsx
/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { useAtomValue } from "jotai";
import { PortalV3Provider } from "@/lib/feature-flags/portal-v3/PortalV3Provider";
import { portalV3Atom } from "@/lib/feature-flags/portal-v3/client";

const Probe = () => {
  const config = useAtomValue(portalV3Atom);
  return (
    <span data-testid="probe">
      {String(config.isFetched)}:{config.enabledTeams.join(",")}
    </span>
  );
};

describe("PortalV3Provider", () => {
  it("publishes enabledTeams and isFetched=true on mount", () => {
    render(
      <PortalV3Provider enabledTeams={["team_123"]}>
        <Probe />
      </PortalV3Provider>,
    );
    expect(screen.getByTestId("probe")).toHaveTextContent("true:team_123");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx jest tests/unit/portal-v3-provider.test.tsx`
Expected: FAIL — `Cannot find module '@/lib/feature-flags/portal-v3/PortalV3Provider'`.

- [ ] **Step 3: Implement the provider**

```tsx
// web/lib/feature-flags/portal-v3/PortalV3Provider.tsx
"use client";

import { useSetAtom } from "jotai";
import { Fragment, ReactNode, useEffect } from "react";
import { portalV3Atom } from "./client";

export const PortalV3Provider = (props: {
  children: ReactNode;
  enabledTeams: string[];
}) => {
  const { enabledTeams } = props;
  const setPortalV3Config = useSetAtom(portalV3Atom);

  useEffect(() => {
    setPortalV3Config({
      isFetched: true,
      enabledTeams,
    });
  }, [enabledTeams, setPortalV3Config]);

  return <Fragment>{props.children}</Fragment>;
};
```

- [ ] **Step 4: Create the module barrel**

```typescript
// web/lib/feature-flags/portal-v3/index.ts
export { isPortalV3EnabledServer } from "./server";
export { portalV3Atom, isPortalV3Enabled, type PortalV3Config } from "./client";
export { PortalV3Provider } from "./PortalV3Provider";
export {
  PORTAL_V3_ENABLE_ALL_TEAMS_TOKEN,
  isPortalV3EnabledForTeam,
} from "./common";
```

- [ ] **Step 5: Re-export from the feature-flags barrel**

Modify `web/lib/feature-flags/index.ts` — append below the existing world-id-4-0 export block:

```typescript
// Portal v3 feature flag
export {
  isPortalV3EnabledServer,
  portalV3Atom,
  isPortalV3Enabled,
  PortalV3Provider,
} from "./portal-v3";
```

- [ ] **Step 6: Run the provider test to verify it passes**

Run: `cd web && npx jest tests/unit/portal-v3-provider.test.tsx`
Expected: PASS (1 test).

- [ ] **Step 7: Type-check + run the full portal-v3 suite**

Run: `cd web && npx tsc --noEmit && npx jest tests/unit/portal-v3`
Expected: tsc clean; all portal-v3 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add web/lib/feature-flags/portal-v3/ web/lib/feature-flags/index.ts web/tests/unit/portal-v3-provider.test.tsx
git commit -m "feat(portal-v3): add client provider and module exports"
```

---

## Self-Review

- **Spec coverage (this slice):** flag mechanism mirroring `world-id-4-0` ✓ (Tasks 1–4); SSM `portal-v3/enabled-teams` + `LOCAL_DEV_PORTAL_V3_ENABLED_TEAMS` + `enable_all_teams` ✓ (Task 2); `portal-v3 ⊆ world-id-4-0` ✓ (Task 2 subset gate + test); fail-closed ✓ (Task 2 test). Mounting the provider + the layout branch are deliberately **Slice 2** (this slice ships a tested module with no UI change).
- **Type consistency:** `PortalV3Config` defined in Task 3, consumed in Task 4; `isPortalV3EnabledForTeam` signature stable across Tasks 1/2/3; `isPortalV3EnabledServer(teamId)` matches the `isWorldId40EnabledServer(teamId)` shape callers already use.
- **Placeholder scan:** none — every step has complete code and an exact run command.

## Slice roadmap (authored when reached)

- **Slice 2 — Branch + shell skeleton:** mount `PortalV3Provider` in `TeamIdLayout` (compute `enabledTeams = isPortalV3EnabledServer(teamId) ? [teamId] : []`); add `x-pathname` to `proxy.ts`; suppress legacy `<Header/>` in `PortalLayout` for v3 team routes; render a bare `<V3Shell>` placeholder. Deliverable: a v3-allowlisted team sees a skeletal new shell; everyone else unchanged (verified).
- **Slice 3 — Shell UI (apply `/frontend-design`):** sidebar (team switcher name→grid / chevron→switch; content-header app switcher, no All-Apps), §1/team-section/user-popup, theme toggle, v3 CSS-variable tokens + `.dark`.
- **Slice 4 — MRU landing resolver:** cookie-backed resolver + fallback chain, wired into the five chokepoints (`login-callback`, `/teams`, apps page, `create-team`, `AppSelector`).
