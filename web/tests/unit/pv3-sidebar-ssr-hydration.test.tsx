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
// Required (not imported) so the polyfill above is installed first.
const { renderToString } =
  require("react-dom/server") as typeof import("react-dom/server");

// #region Mocks
const usePathname = jest.fn();
const useParams = jest.fn();
const routerPush = jest.fn();
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useParams: () => useParams(),
  useRouter: () => ({ push: routerPush, prefetch: jest.fn() }),
}));

jest.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => false,
}));

jest.mock("@/lib/utils", () => ({
  cn: (...inputs: unknown[]) => inputs.filter(Boolean).join(" "),
}));

jest.mock("@/scenes/PortalV3/layout/Shell/SandboxButton", () => ({
  SandboxButton: () => <button type="button">World ID Sandbox</button>,
}));

// jsdom has no ResizeObserver; NavActivePill uses it to track the active item.
// The stub records constructions so tests can tell whether the pill's
// measuring effect ran past its early exits.
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
  ShellNavigationProvider,
  SidebarNav,
} from "@/scenes/PortalV3/layout/Shell/SidebarNav";

// #region Test Data
const teamId = "team_1";
const appId = "app_1";
const base = `/teams/${teamId}/apps/${appId}`;

const tree = (
  <TooltipProvider>
    <SidebarProvider>
      <ShellNavigationProvider>
        <SidebarNav />
      </ShellNavigationProvider>
    </SidebarProvider>
  </TooltipProvider>
);

// jsdom has no layout, and the pill refuses degenerate 0-size measurements,
// so give every element a plausible box for the hydration hand-off.
const realRect = {
  top: 8,
  left: 16,
  right: 264,
  bottom: 48,
  width: 248,
  height: 40,
  x: 16,
  y: 8,
  toJSON: () => ({}),
} as DOMRect;

const activeLinkFrom = (root: ParentNode) =>
  Array.from(root.querySelectorAll("a")).find(
    (a) => a.getAttribute("data-active") === "true",
  );

const pillFrom = (root: ParentNode) =>
  root.querySelector('nav > span[aria-hidden="true"]');
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  observerInstances.length = 0;
  useParams.mockReturnValue({ teamId, appId });
  usePathname.mockReturnValue(`${base}/world-id-4-0`);
  jest
    .spyOn(Element.prototype, "getBoundingClientRect")
    .mockReturnValue(realRect);
});

afterEach(() => {
  jest.restoreAllMocks();
});

// The sheath must survive a hard refresh: the server HTML carries a static
// active card (there is no measured pill yet), and hydration swaps it for the
// live pill without a frame where neither exists.
// #region SSR → hydration hand-off
describe("v3 SidebarNav [SSR → hydration]", () => {
  it("server-renders a static active card and no visible pill", () => {
    const html = renderToString(tree);
    const doc = document.createElement("div");
    doc.innerHTML = html;

    const active = activeLinkFrom(doc);
    expect(active).toBeDefined();
    expect(active!.className).toContain("data-[active=true]:bg-white");
    // The pill span is mounted (its effect locates the nav through it on the
    // first commit) but hidden until it has measured a placement.
    const pill = pillFrom(doc);
    expect(pill).not.toBeNull();
    expect(pill!.classList.contains("hidden")).toBe(true);
  });

  it("hydration replaces the static card with the measured pill", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(tree);
    document.body.appendChild(container);

    await act(async () => {
      render(tree, { container, hydrate: true });
    });

    const active = activeLinkFrom(container);
    expect(active).toBeDefined();
    // The measuring effect must run on the hydration commit itself: a hard
    // refresh gives no second render to recover on.
    expect(observerInstances.length).toBeGreaterThan(0);
    // Post-hydration the static card is gone…
    expect(active!.className).not.toContain("data-[active=true]:bg-white");
    // …because the measured pill has taken over.
    const pill = pillFrom(container);
    expect(pill).not.toBeNull();
    expect(pill!.classList.contains("hidden")).toBe(false);
    expect(pill).toHaveStyle({ width: "248px", height: "40px" });

    document.body.removeChild(container);
  });
});
// #endregion
