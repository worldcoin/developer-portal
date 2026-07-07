/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React, { Suspense } from "react";

const useGetSingleActionV4Query = jest.fn();
jest.mock(
  "@/scenes/common/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/graphql/client/get-single-action-v4.generated",
  () => ({
    useGetSingleActionV4Query: (...a: unknown[]) =>
      useGetSingleActionV4Query(...a),
  }),
);
// Heavy tester (idkit) — mock so this test targets the page layout.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/Settings/TryAction",
  () => ({ TryAction: () => <div data-testid="try-action" /> }),
);
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/Actions/ActionId/page/VerifiedTable",
  () => ({ VerifiedTable: () => <div data-testid="verified-table" /> }),
);

import { WorldIdActionIdPage } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page";

const makeAction = (overrides: Record<string, unknown> = {}) => ({
  id: "action_v4_1",
  action: "verify-human",
  description: "desc",
  rp_id: "rp_1",
  created_at: "2026-01-01T00:00:00Z",
  rp_registration: { app_id: "app_abc123" },
  nullifiers_aggregate: { aggregate: { count: 0 } },
  nullifiers: [],
  ...overrides,
});

const renderPage = async () => {
  await act(async () => {
    render(
      <Suspense fallback={<div>loading</div>}>
        <WorldIdActionIdPage
          params={Promise.resolve({ actionId: "action_v4_1" })}
        />
      </Suspense>,
    );
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  useGetSingleActionV4Query.mockReturnValue({
    data: { action_v4_by_pk: makeAction() },
    loading: false,
    error: undefined,
  });
});

it("renders the QR tester and the verified-humans table", async () => {
  await renderPage();
  expect(screen.getByTestId("try-action")).toBeInTheDocument();
  expect(screen.getByTestId("verified-table")).toBeInTheDocument();
});

it("keeps the quickstart collapsed by default, behind a toggle", async () => {
  await renderPage();
  expect(screen.getByTestId("quickstart-toggle")).toHaveTextContent(
    /show integration quickstart/i,
  );
  // The IDKit install snippet is not in the DOM until expanded.
  expect(screen.queryByText(/npm install @worldcoin\/idkit/i)).toBeNull();
});

it("expands the quickstart on toggle, with the real app_id/action interpolated", async () => {
  await renderPage();
  await act(async () => {
    fireEvent.click(screen.getByTestId("quickstart-toggle"));
  });
  expect(
    screen.getByText(/npm install @worldcoin\/idkit/i),
  ).toBeInTheDocument();
  // Quickstart interpolates the real ids into the snippet (app_abc123 also
  // appears in the backend snippet, so scope to the frontend block rather
  // than a global getByText, which throws on multiple matches).
  expect(
    screen.getByTestId("quickstart-snippet-frontend").textContent,
  ).toContain("app_abc123");
});

it("does not render the removed waiting/received indicator or analytics placeholder", async () => {
  await renderPage();
  expect(screen.queryByTestId("first-proof-waiting")).toBeNull();
  expect(screen.queryByTestId("first-proof-received")).toBeNull();
  expect(screen.queryByText(/detailed analytics coming soon/i)).toBeNull();
});
