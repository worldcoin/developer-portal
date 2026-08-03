/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { MockedProvider } from "@apollo/client/testing/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

jest.mock("@/lib/utils", () => ({
  cn: (...values: unknown[]) => values.filter(Boolean).join(" "),
}));

import { VerificationHistory } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/VerificationHistory";
import { GetActionVerificationHistoryDocument } from "@/scenes/PortalV3/Teams/TeamId/Apps/AppId/WorldIdActions/ActionId/page/VerificationHistory/graphql/client/get-action-verification-history.generated";

const ACTION_ID = "action_v4_demo_history_78d6";
const APP_ID = "app_e142e5ad28950f1bd7815086e33b02c9";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  global.ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
});

const makeNullifier = (position: number) => ({
  __typename: "nullifier_v4" as const,
  id: `nullifier_v4_${position}`,
  created_at: `2026-08-02T${String(23 - position).padStart(2, "0")}:00:00.000Z`,
  nullifier: `4000000000000000000000000000000000000${String(position).padStart(3, "0")}`,
});

const historyMock = (
  offset: number,
  rows: ReturnType<typeof makeNullifier>[],
) => ({
  request: {
    query: GetActionVerificationHistoryDocument,
    variables: {
      action_id: ACTION_ID,
      app_id: APP_ID,
      limit: 5,
      offset,
    },
  },
  result: {
    data: {
      action_v4: [
        {
          __typename: "action_v4" as const,
          id: ACTION_ID,
          nullifiers_aggregate: {
            __typename: "nullifier_v4_aggregate" as const,
            aggregate: {
              __typename: "nullifier_v4_aggregate_fields" as const,
              count: 125,
            },
          },
          nullifiers: rows,
        },
      ],
    },
  },
});

describe("World ID action verification history", () => {
  it("keeps the existing footer while fetching each page from the backend", async () => {
    render(
      <MockedProvider
        mocks={[
          historyMock(0, [1, 2, 3, 4, 5].map(makeNullifier)),
          historyMock(5, [6, 7, 8, 9, 10].map(makeNullifier)),
        ]}
      >
        <TooltipProvider>
          <VerificationHistory actionId={ACTION_ID} appId={APP_ID} />
        </TooltipProvider>
      </MockedProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Verification history" }),
    ).toBeInTheDocument();
    expect(screen.getByText("125 verifications")).toBeInTheDocument();
    expect(screen.getByText("Nullifier")).toBeInTheDocument();
    expect(screen.getByText("Verified at")).toBeInTheDocument();
    expect(screen.getByText("125 results")).toBeInTheDocument();
    const tooltipTrigger = screen.getByRole("button", {
      name: "About verification history",
    });
    fireEvent.focus(tooltipTrigger);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent(
      "Each entry is created when your app successfully verifies a proof through the /verify endpoint for this action. Failed verification attempts aren’t shown.",
    );
    expect(tooltip.querySelector("span")).toHaveClass(
      "block",
      "max-w-[280px]",
      "whitespace-normal",
    );
    expect(
      screen.getAllByRole("button", { name: "Copy Nullifier" }),
    ).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Next page" }));

    await waitFor(() => {
      expect(screen.getByTitle(makeNullifier(6).nullifier)).toBeInTheDocument();
    });
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
  });

  it("renders the empty state without table controls when there are no nullifiers", async () => {
    let queryResolved = false;

    render(
      <MockedProvider
        mocks={[
          {
            request: {
              query: GetActionVerificationHistoryDocument,
              variables: {
                action_id: ACTION_ID,
                app_id: APP_ID,
                limit: 5,
                offset: 0,
              },
            },
            result: () => {
              queryResolved = true;
              return {
                data: {
                  action_v4: [
                    {
                      __typename: "action_v4" as const,
                      id: ACTION_ID,
                      nullifiers_aggregate: {
                        __typename: "nullifier_v4_aggregate" as const,
                        aggregate: {
                          __typename: "nullifier_v4_aggregate_fields" as const,
                          count: 0,
                        },
                      },
                      nullifiers: [],
                    },
                  ],
                },
              };
            },
          },
        ]}
      >
        <TooltipProvider>
          <VerificationHistory actionId={ACTION_ID} appId={APP_ID} />
        </TooltipProvider>
      </MockedProvider>,
    );

    await waitFor(() => expect(queryResolved).toBe(true));
    expect(
      screen.getByRole("heading", { name: "Verification history" }),
    ).toBeInTheDocument();
    const emptyTitle = screen.getByRole("heading", {
      name: "No verifications yet",
    });
    expect(emptyTitle.parentElement).toHaveTextContent(
      "Successful verifications will appear here after your app verifies a proof through the /verify endpoint for this action.",
    );
    expect(screen.queryByText("0 verifications")).toBeNull();
    expect(screen.queryByText("Nullifier")).toBeNull();
    expect(screen.queryByText("Verified at")).toBeNull();
    expect(screen.queryByText("0 results")).toBeNull();
    expect(screen.queryByRole("button", { name: "Next page" })).toBeNull();
  });
});
