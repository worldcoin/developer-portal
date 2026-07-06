/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React, { Suspense } from "react";

import { Quickstart } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/Quickstart";

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
