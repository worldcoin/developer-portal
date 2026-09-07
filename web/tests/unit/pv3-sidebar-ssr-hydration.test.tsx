/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { act, render } from "@testing-library/react";
import React from "react";
import { TextDecoder, TextEncoder } from "util";

// react-dom/server schedules through MessageChannel and encodes with
// TextEncoder; jsdom provides neither. The channel is faked on microtasks
// (node's worker_threads ports would keep the event loop — and the jest
// process — alive once React attaches a message handler).
type FakePort = {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage: (data: unknown) => void;
  start: () => void;
  close: () => void;
  unref: () => void;
  ref: () => void;
};
class MicrotaskMessageChannel {
  port1: FakePort;
  port2: FakePort;
  constructor() {
    const makePort = (peer: () => FakePort): FakePort => ({
      onmessage: null,
      postMessage: (data: unknown) =>
        queueMicrotask(() => peer().onmessage?.({ data })),
      start: () => {},
      close: () => {},
      unref: () => {},
      ref: () => {},
    });
    this.port1 = makePort(() => this.port2);
    this.port2 = makePort(() => this.port1);
  }
}
global.MessageChannel ??= MicrotaskMessageChannel as unknown as {
  new (): MessageChannel;
  prototype: MessageChannel;
};
global.TextEncoder ??= TextEncoder as unknown as typeof global.TextEncoder;
global.TextDecoder ??= TextDecoder as unknown as typeof global.TextDecoder;
// Required (not imported) so the polyfills above are installed first.
const { renderToString } =
  require("react-dom/server") as typeof import("react-dom/server");

// #region Mocks
const usePathname = jest.fn();
const useParams = jest.fn();
const useSearchParams = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useParams: () => useParams(),
  useSearchParams: () => useSearchParams(),
  useRouter: () => ({ push: jest.fn(), prefetch: jest.fn() }),
}));

const useQueryMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => useQueryMock(...args),
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldId/navigation/graphql/client/get-world-id-navigation.generated",
  () => ({
    GetWorldIdNavigationDocument: { __mockDoc: "worldIdNavigation" },
  }),
);

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SandboxButton", () => ({
  SandboxButton: () => <button type="button">World ID Sandbox</button>,
}));

// The stub records constructions so the test can tell the pill's measuring
// effect ran past its early exits on the hydration commit.
const observerInstances: unknown[] = [];
global.ResizeObserver = class {
  constructor(cb: ResizeObserverCallback) {
    observerInstances.push(cb);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
// #endregion

import {
  SidebarAnimationShell,
  SidebarNav,
} from "@/scenes/PortalV3/layout/Shell/SidebarNav";

// #region Test Data
const base = "/teams/team_1/apps/app_1";

const tree = (
  <TooltipProvider>
    <SidebarProvider>
      <SidebarAnimationShell>
        <SidebarNav />
      </SidebarAnimationShell>
    </SidebarProvider>
  </TooltipProvider>
);

// jsdom has no layout, and the pill refuses degenerate 0-size measurements,
// so give every element a plausible box for the hydration hand-off.
const realRect = {
  top: 8,
  left: 16,
  right: 220,
  bottom: 44,
  width: 204,
  height: 36,
  x: 16,
  y: 8,
  toJSON: () => ({}),
} as DOMRect;

const activeLink = (root: ParentNode) =>
  Array.from(root.querySelectorAll("a")).find(
    (a) => a.getAttribute("data-active") === "true",
  )!;

const pill = (root: ParentNode) =>
  root.querySelector('nav > span[aria-hidden="true"]')!;
// #endregion

// The sheath must survive a hard refresh: the server HTML carries a static
// active card (there is no measured pill yet), and hydration swaps it for the
// live pill without a frame where neither exists.
it("hands the static SSR active card off to the measured pill at hydration", async () => {
  useParams.mockReturnValue({ teamId: "team_1", appId: "app_1" });
  usePathname.mockReturnValue(`${base}/world-id-4-0`);
  useSearchParams.mockReturnValue(new URLSearchParams());
  useQueryMock.mockReturnValue({
    data: {
      app: [
        {
          id: "app_1",
          rp_registration: [
            {
              rp_id: "rp_0123456789abcdef",
              status: "registered",
            },
          ],
        },
      ],
      action: [],
    },
    loading: false,
  });
  jest
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockReturnValue(realRect);

  const container = document.createElement("div");
  container.innerHTML = renderToString(tree);
  document.body.appendChild(container);

  // Server HTML: static active card; the pill span is mounted (its effect
  // locates the nav through it on the first commit) but hidden.
  expect(activeLink(container).className).toContain(
    "data-[active=true]:bg-white",
  );
  expect(pill(container).classList.contains("hidden")).toBe(true);

  await act(async () => {
    render(tree, { container, hydrate: true });
  });

  // The measuring effect must run on the hydration commit itself: a hard
  // refresh gives no second render to recover on.
  expect(observerInstances.length).toBeGreaterThan(0);
  // The static card is gone because the measured pill has taken over.
  expect(activeLink(container).className).not.toContain(
    "data-[active=true]:bg-white",
  );
  expect(pill(container).classList.contains("hidden")).toBe(false);
  expect(pill(container)).toHaveStyle({ width: "204px", height: "36px" });

  document.body.removeChild(container);
});
