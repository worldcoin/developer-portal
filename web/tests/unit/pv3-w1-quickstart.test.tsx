/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React, { Suspense } from "react";

import {
  buildSnippets,
  Quickstart,
} from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/Quickstart";

beforeEach(() => jest.clearAllMocks());

// #region Quickstart component
describe("Quickstart", () => {
  it("renders three numbered step blocks with appId and action interpolated into the snippet text", () => {
    render(
      <Quickstart appId="app_abc123" action="my-action" isStaging={false} />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    expect(
      screen.getByText(/npm install @worldcoin\/idkit/),
    ).toBeInTheDocument();

    const frontendSnippet = screen.getByTestId("quickstart-snippet-frontend");
    expect(frontendSnippet.textContent).toContain('app_id="app_abc123"');
    expect(frontendSnippet.textContent).toContain('action="my-action"');

    const backendSnippet = screen.getByTestId("quickstart-snippet-backend");
    expect(backendSnippet.textContent).toContain(
      "https://developer.worldcoin.org/api/v4/verify/app_abc123",
    );
    expect(backendSnippet.textContent).toContain("my-action");
  });

  it("imports only real @worldcoin/idkit v4 exports in the frontend snippet (pins the exact import lines)", () => {
    const { frontend } = buildSnippets("app_abc123", "my-action");

    expect(frontend).toContain('import { useState } from "react";');
    expect(frontend).toContain(
      'import { IDKitRequestWidget, deviceLegacy } from "@worldcoin/idkit";',
    );
  });

  it("produces the exact frontend snippet template for fixed inputs (no fragment-only assertions)", () => {
    const { frontend } = buildSnippets("app_abc123", "my-action");

    expect(frontend).toBe(`import { useState } from "react";
import { IDKitRequestWidget, deviceLegacy } from "@worldcoin/idkit";

const fetchRpContext = async () => {
  // Fetch a signed rp_context from your backend.
  const response = await fetch("/api/idkit/rp-context", {
    method: "POST",
    // ...
  });

  return response.json();
};

const verifyProof = async (result) => {
  const response = await fetch("/api/verify-world-id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(result),
  });

  if (!response.ok) {
    // Handle your error response here.
    throw new Error("Verification failed");
  }
};

export default function VerifyWithWorldID() {
  const [open, setOpen] = useState(false);
  const [rpContext, setRpContext] = useState(null);

  return (
    <>
      <button
        onClick={async () => {
          if (!rpContext) {
            setRpContext(await fetchRpContext());
          }
          setOpen(true);
        }}
      >
        Verify with World ID
      </button>

      {rpContext && (
        <IDKitRequestWidget
          open={open}
          onOpenChange={setOpen}
          app_id="app_abc123"
          action="my-action"
          action_description="Describe the action the user is approving."
          rp_context={rpContext}
          allow_legacy_proofs={true}
          preset={deviceLegacy()}
          handleVerify={verifyProof}
          onSuccess={(result) => {
            console.log(result);
          }}
        />
      )}
    </>
  );
}`);
  });

  it("shows the simulator row only when isStaging is true", () => {
    const { rerender } = render(
      <Quickstart appId="app_abc123" action="my-action" isStaging={false} />,
    );
    expect(screen.queryByText(/World ID Simulator/i)).not.toBeInTheDocument();

    rerender(
      <Quickstart appId="app_abc123" action="my-action" isStaging={true} />,
    );
    const simulatorLink = screen.getByRole("link", {
      name: /World ID Simulator/i,
    });
    expect(simulatorLink).toHaveAttribute(
      "href",
      "https://simulator.worldcoin.org/",
    );
    expect(simulatorLink).toHaveAttribute("target", "_blank");
    expect(simulatorLink).toHaveAttribute(
      "rel",
      expect.stringContaining("noreferrer"),
    );
  });

  it("renders a copy button for each of the three code blocks", () => {
    render(
      <Quickstart appId="app_abc123" action="my-action" isStaging={false} />,
    );

    // 3 code blocks -> 3 copy buttons (install command, frontend snippet, backend snippet)
    expect(screen.getAllByTestId("quickstart-copy-button").length).toBe(3);
  });
});
// #endregion

// #region Page integration
const useGetSingleActionV4Query = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/graphql/client/get-single-action-v4.generated",
  () => ({
    useGetSingleActionV4Query: (...args: unknown[]) =>
      useGetSingleActionV4Query(...args),
  }),
);

const makeAction = (overrides: Record<string, unknown> = {}) => ({
  id: "action_1",
  action: "my-action",
  description: "desc",
  rp_id: "rp_1",
  created_at: "2026-01-01T00:00:00Z",
  rp_registration: { app_id: "app_abc123" },
  nullifiers_aggregate: { aggregate: { count: 0 } },
  nullifiers: [],
  ...overrides,
});

describe("WorldIdActionIdPage quickstart integration", () => {
  it("shows quickstart directly when verification count is 0", async () => {
    useGetSingleActionV4Query.mockReturnValue({
      data: { action_v4_by_pk: makeAction() },
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    });

    const { WorldIdActionIdPage } = await import(
      "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page"
    );

    const paramsPromise = Promise.resolve({ actionId: "action_1" });

    // The page calls React's `use(props.params)`, which suspends. Wrapping
    // the render in `act(async () => ...)` lets that suspension flush before
    // we assert, matching the documented pattern for testing `use()`.
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <WorldIdActionIdPage params={paramsPromise} />
        </Suspense>,
      );
    });

    expect(
      screen.getByTestId("quickstart-snippet-frontend"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Show quickstart")).not.toBeInTheDocument();
  });

  it("hides quickstart behind a toggle when verification count is greater than 0", async () => {
    useGetSingleActionV4Query.mockReturnValue({
      data: {
        action_v4_by_pk: makeAction({
          nullifiers_aggregate: { aggregate: { count: 3 } },
        }),
      },
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
    });

    const { WorldIdActionIdPage } = await import(
      "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page"
    );

    const paramsPromise = Promise.resolve({ actionId: "action_1" });

    await act(async () => {
      render(
        <Suspense fallback={null}>
          <WorldIdActionIdPage params={paramsPromise} />
        </Suspense>,
      );
    });

    const toggle = screen.getByText("Show quickstart");
    expect(toggle).toBeInTheDocument();
    expect(
      screen.queryByTestId("quickstart-snippet-frontend"),
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(
      screen.getByTestId("quickstart-snippet-frontend"),
    ).toBeInTheDocument();
  });
});
// #endregion
