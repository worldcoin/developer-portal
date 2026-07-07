/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, render, screen } from "@testing-library/react";
import React, { Suspense } from "react";

// #region Mocks
const getSingleAction = jest.fn();
const startPolling = jest.fn();
const stopPolling = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/graphql/client/get-single-action-v4.generated",
  () => ({
    useGetSingleActionV4Query: (...args: unknown[]) => getSingleAction(...args),
  }),
);
jest.mock("posthog-js", () => ({ capture: jest.fn() }));
// Heavy children — mocked so this test targets the page's poll/crossing logic.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/Quickstart",
  () => ({ Quickstart: () => <div data-testid="quickstart" /> }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page/VerifiedTable",
  () => ({ VerifiedTable: () => <div data-testid="verified-table" /> }),
);
// #endregion

import posthog from "posthog-js";
import { WorldIdActionIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";

const actionResult = (count: number) => ({
  data: {
    action_v4_by_pk: {
      id: "action_v4_1",
      action: "verify-human",
      rp_registration: { app_id: "app_1" },
      nullifiers_aggregate: { aggregate: { count } },
      nullifiers: [],
    },
  },
  loading: false,
  error: undefined,
  startPolling,
  stopPolling,
});

const tree = () => (
  <Suspense fallback={<div>loading</div>}>
    <WorldIdActionIdPage
      params={Promise.resolve({ actionId: "action_v4_1" })}
    />
  </Suspense>
);

// `use(props.params)` suspends on first render; flush the microtask inside act
// so the resolved content (not the fallback) is what we assert against.
const renderPage = async () => {
  let utils!: ReturnType<typeof render>;
  await act(async () => {
    utils = render(tree());
  });
  return utils;
};

beforeEach(() => jest.clearAllMocks());

it("action with no verifications: shows the waiting indicator + Quickstart, and polls", async () => {
  getSingleAction.mockReturnValue(actionResult(0));
  await renderPage();
  expect(screen.getByTestId("first-proof-waiting")).toBeInTheDocument();
  expect(screen.getByTestId("quickstart")).toBeInTheDocument();
  expect(screen.queryByTestId("first-proof-received")).not.toBeInTheDocument();
  expect(startPolling).toHaveBeenCalledWith(5000);
  const [options] = getSingleAction.mock.calls[0];
  expect(options.fetchPolicy).toBe("cache-and-network");
});

it("live 0 -> 1 crossing: flips to received, captures the funnel event once, collapses the Quickstart", async () => {
  getSingleAction.mockReturnValue(actionResult(0));
  const { rerender } = await renderPage();
  expect(screen.getByTestId("first-proof-waiting")).toBeInTheDocument();

  getSingleAction.mockReturnValue(actionResult(1));
  await act(async () => {
    rerender(tree());
  });

  expect(screen.getByTestId("first-proof-received")).toBeInTheDocument();
  expect(posthog.capture).toHaveBeenCalledWith("v3_first_proof_received", {
    action_id: "action_v4_1",
  });
  expect(posthog.capture).toHaveBeenCalledTimes(1);
  // Quickstart collapses once a verification exists.
  expect(screen.queryByTestId("quickstart")).not.toBeInTheDocument();
});

it("arriving on an already-verified action: no waiting, no celebration, no funnel event", async () => {
  getSingleAction.mockReturnValue(actionResult(3));
  await renderPage();
  expect(screen.getByTestId("verified-table")).toBeInTheDocument();
  expect(screen.queryByTestId("first-proof-waiting")).not.toBeInTheDocument();
  expect(screen.queryByTestId("first-proof-received")).not.toBeInTheDocument();
  expect(posthog.capture).not.toHaveBeenCalled();
  expect(startPolling).not.toHaveBeenCalled();
});
