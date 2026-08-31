/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { MockedProvider } from "@apollo/client/testing/react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { Role_Enum } from "@/graphql/graphql";

// #region Mocks
// Apollo is deliberately REAL (MockedProvider = real client, cache and link
// semantics). The original bug lived exactly there: the reset mutation's
// refetchQueries re-renders the FetchKeys query as loading (Apollo v4 defaults
// notifyOnNetworkStatusChange to true), which used to swap the table for
// skeletons and unmount the dialog holding the one-time secret. Hook-level
// Apollo mocks can never catch that class of bug.
let mockSession: unknown;
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ user: mockSession }),
}));

const toastErrorMock = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));
// #endregion

import { ApiKeys } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys";
import { ResetApiKeyDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/ApiKeyTable/ApiKeyRow/graphql/client/reset-api-key.generated";
import { FetchKeysDocument } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated";

// #region Test Data
const TEAM_ID = "team_cd7aa5f3c2a797a06e66eb6eefbf2f48";
const KEY_ID = "key_9a8b7c6d5e4f3a2b";
const NEW_SECRET = "api_NEW_SECRET";

const API_KEY = {
  __typename: "api_key" as const,
  id: KEY_ID,
  team_id: TEAM_ID,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  is_active: true,
  name: "production",
};

const fetchKeysMock = (apiKeys: (typeof API_KEY)[]) => ({
  request: { query: FetchKeysDocument, variables: { teamId: TEAM_ID } },
  result: { data: { api_key: apiKeys } },
});

const resetKeyMock = {
  request: {
    query: ResetApiKeyDocument,
    variables: { id: KEY_ID, team_id: TEAM_ID },
  },
  result: {
    data: {
      reset_api_key: { __typename: "ResetAPIOutput", api_key: NEW_SECRET },
    },
  },
};

// The refetched row carries a bumped updated_at so the test can tell when the
// post-rotation refetch has actually landed and re-rendered the table.
const ROTATED_KEY = {
  ...API_KEY,
  updated_at: "2026-01-02T00:00:00.000Z",
};

const sessionWithRole = (role: Role_Enum) => ({
  hasura: { memberships: [{ role, team: { id: TEAM_ID } }] },
});

type Mocks = React.ComponentProps<typeof MockedProvider>["mocks"];

const renderSection = (mocks: Mocks, canWrite = true) =>
  render(
    <MockedProvider mocks={mocks}>
      <ApiKeys teamId={TEAM_ID} canWrite={canWrite} />
    </MockedProvider>,
  );

const findRotateTrigger = () =>
  screen.findByRole("button", { name: /reset to view/i });

const confirmation = () => screen.getByRole("dialog");
const confirmRotation = () =>
  within(confirmation()).getByRole("button", { name: /^rotate key$/i });
const keepCurrentKey = () =>
  within(confirmation()).getByRole("button", { name: /keep current key/i });
const closeButton = () =>
  within(confirmation()).getByRole("button", {
    name: /close rotate key dialog/i,
  });

beforeEach(() => {
  jest.clearAllMocks();
  mockSession = sessionWithRole(Role_Enum.Owner);
});
// #endregion

// #region Empty state
describe("API keys empty state", () => {
  it("shows the API keys empty-state copy instead of an empty table", async () => {
    renderSection([fetchKeysMock([])]);

    expect(await screen.findByText("No API keys")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You don't have any API keys associated with your workspace",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Name")).not.toBeInTheDocument();
    expect(screen.getByText("0 keys")).toBeInTheDocument();
  });
});
// #endregion

// #region Rotation flow
describe("API key rotation flow", () => {
  it("requires confirmation and can be cancelled without rotating", async () => {
    // No mutation mock: an unexpected ResetAPIKey call would fail the test.
    renderSection([fetchKeysMock([API_KEY])]);

    fireEvent.click(await findRotateTrigger());

    fireEvent.click(
      within(confirmation()).getByRole("button", {
        name: /keep current key/i,
      }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("reveals the new secret and keeps it visible through the refetch", async () => {
    renderSection([
      fetchKeysMock([API_KEY]),
      resetKeyMock,
      fetchKeysMock([ROTATED_KEY]),
    ]);

    fireEvent.click(await findRotateTrigger());
    fireEvent.click(confirmRotation());

    // The dialog transitions in place to the reveal state.
    expect(
      await within(await screen.findByRole("dialog")).findByText(
        "API key rotated",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(NEW_SECRET)).length).toBeGreaterThan(
      0,
    );
    expect(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /^copy$/i,
      }),
    ).toBeInTheDocument();

    // Wait for the post-rotation refetch to land and re-render the table…
    await waitFor(() =>
      expect(screen.getByText(/created/i)).toBeInTheDocument(),
    );

    // …the one-time secret must still be on screen afterwards.
    expect(screen.getAllByText(new RegExp(NEW_SECRET)).length).toBeGreaterThan(
      0,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a fresh confirmation when reopened after a rotation", async () => {
    // Content state is cleared in the dialog's afterLeave (clearing on close
    // makes the reveal flicker back to the confirm view mid-fade), so reopening
    // must never surface the previous rotation's secret.
    renderSection([
      fetchKeysMock([API_KEY]),
      resetKeyMock,
      fetchKeysMock([ROTATED_KEY]),
    ]);

    fireEvent.click(await findRotateTrigger());
    fireEvent.click(confirmRotation());
    await within(await screen.findByRole("dialog")).findByText(
      "API key rotated",
    );

    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: /done/i,
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    fireEvent.click(await findRotateTrigger());
    expect(
      within(screen.getByRole("dialog")).getByText("Are you sure?"),
    ).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(NEW_SECRET))).not.toBeInTheDocument();
  });

  it("prevents a second rotation while the first is in flight", async () => {
    renderSection([
      fetchKeysMock([API_KEY]),
      { ...resetKeyMock, delay: 50 },
      fetchKeysMock([ROTATED_KEY]),
    ]);

    fireEvent.click(await findRotateTrigger());
    fireEvent.click(confirmRotation());
    // A second confirm while in flight must be a no-op (button disabled and
    // the handler guarded); a second mutation would find no mocked response.
    expect(confirmRotation()).toBeDisabled();
    fireEvent.click(confirmRotation());

    expect(
      await within(await screen.findByRole("dialog")).findByText(
        "API key rotated",
      ),
    ).toBeInTheDocument();
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it("cannot be dismissed once rotation is confirmed", async () => {
    // Rotation invalidates the old key immediately and its response carries the
    // only copy of the new one, so every exit — Escape, the backdrop, the header
    // X and the cancel button — has to be sealed until the reveal renders.
    renderSection([
      fetchKeysMock([API_KEY]),
      { ...resetKeyMock, delay: 50 },
      fetchKeysMock([ROTATED_KEY]),
    ]);

    fireEvent.click(await findRotateTrigger());
    fireEvent.click(confirmRotation());

    expect(keepCurrentKey()).toBeDisabled();
    expect(closeButton()).toBeDisabled();

    fireEvent.click(keepCurrentKey());
    fireEvent.click(closeButton());
    fireEvent.keyDown(confirmation(), { key: "Escape" });

    // Still open, and it goes on to reveal the secret rather than losing it.
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      await within(await screen.findByRole("dialog")).findByText(
        "API key rotated",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(NEW_SECRET)).length).toBeGreaterThan(
      0,
    );
  });

  it("becomes dismissable again when the rotation fails", async () => {
    // The lock must track the in-flight window only. A failed rotation has no
    // secret to protect, so leaving it engaged would strand the user.
    renderSection([
      fetchKeysMock([API_KEY]),
      {
        request: resetKeyMock.request,
        error: new Error("network error"),
        delay: 20,
      },
    ]);

    fireEvent.click(await findRotateTrigger());
    fireEvent.click(confirmRotation());

    await waitFor(() => expect(keepCurrentKey()).toBeEnabled());
    expect(closeButton()).toBeEnabled();

    fireEvent.click(keepCurrentKey());
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("reports a failed rotation without revealing a secret", async () => {
    renderSection([
      fetchKeysMock([API_KEY]),
      {
        request: resetKeyMock.request,
        error: new Error("network error"),
      },
    ]);

    fireEvent.click(await findRotateTrigger());
    fireEvent.click(confirmRotation());

    await waitFor(() =>
      expect(toastErrorMock).toHaveBeenCalledWith(
        "Error occurred while resetting API key.",
      ),
    );
    expect(screen.queryByText(new RegExp(NEW_SECRET))).not.toBeInTheDocument();
  });

  it("does not expose rotation controls to non-owners", async () => {
    mockSession = sessionWithRole(Role_Enum.Admin);
    renderSection([fetchKeysMock([API_KEY])], false);

    await screen.findByText("production");

    expect(
      screen.queryByRole("button", { name: /^rotate key$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reset to view/i }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
