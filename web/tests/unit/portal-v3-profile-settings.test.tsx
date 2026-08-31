/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockUpdateUser = jest.fn();
const mockRefetchMe = jest.fn();
const mockUseMeQuery = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: { hasura: { id: "user_123" } },
  }),
}));
jest.mock("@apollo/client/react", () => ({
  useMutation: () => [mockUpdateUser],
}));
jest.mock("@/scenes/common/me-query/client", () => ({
  useMeQuery: () => mockUseMeQuery(),
}));
jest.mock("@/scenes/PortalV3/Profile/Teams/page/List", () => ({
  List: () => (
    <section aria-labelledby="mock-teams-heading">
      <h2 id="mock-teams-heading">Your teams</h2>
      <div data-testid="teams-list" />
    </section>
  ),
}));
jest.mock("@/scenes/common/Profile/page/WorldIdAccountMigration", () => ({
  WorldIdAccountMigration: () => <div data-testid="world-id-migration" />,
}));
jest.mock("@/scenes/PortalV3/Profile/DangerZone/DeleteAccountDialog", () => ({
  DeleteAccountDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-account-dialog" /> : null,
}));
jest.mock("react-toastify", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));
// #endregion

// #region Test Data
const loadedUser = {
  id: "user_123",
  name: "Ada Lovelace",
  nameToDisplay: "Ada Lovelace",
  email: "ada@example.com",
  is_allow_tracking: false,
  world_id_nullifier: null,
  memberships: [
    {
      role: "OWNER",
      team: { id: "team_123", name: "Analytical Engines" },
    },
  ],
};

const loadedMeQuery = () => ({
  user: loadedUser,
  loading: false,
  error: undefined,
  refetch: mockRefetchMe,
});
// #endregion

import { ProfilePage } from "@/scenes/PortalV3/Profile/page";

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  mockUpdateUser.mockResolvedValue({});
  mockRefetchMe.mockResolvedValue({});
  mockUseMeQuery.mockImplementation(loadedMeQuery);
});

// #region Loaded profile
describe("PortalV3 profile settings [loaded]", () => {
  it("renders the Figma sections and only exposes Save after a profile edit", async () => {
    render(<ProfilePage />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Profile" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Display name", { selector: "label" })).toHaveClass(
      "text-15",
    );
    expect(screen.getByRole("heading", { name: "Your teams" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Danger zone" })).toBeVisible();
    expect(screen.getByTestId("teams-list")).toBeInTheDocument();
    expect(screen.getByTestId("world-id-migration")).toBeInTheDocument();

    const nameInput = screen.getByRole("textbox", { name: "Display name" });
    expect(nameInput).toHaveValue("Ada Lovelace");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();

    fireEvent.change(nameInput, { target: { value: "Ada Byron" } });

    const saveButton = await screen.findByRole("button", { name: "Save" });
    expect(saveButton).toHaveClass("text-[length:var(--text-13)]");
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith({
        variables: {
          user_id: "user_123",
          input: {
            name: "Ada Byron",
            is_allow_tracking: false,
          },
        },
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull(),
    );
  });

  it("saves the accessible analytics toggle through the existing mutation", async () => {
    render(<ProfilePage />);

    const analyticsSwitch = await screen.findByRole("switch", {
      name: "Allow analytics",
    });
    expect(analyticsSwitch).toHaveAttribute("aria-checked", "false");

    fireEvent.click(analyticsSwitch);
    expect(analyticsSwitch).toHaveAttribute("aria-checked", "true");
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockUpdateUser).toHaveBeenCalledWith({
        variables: {
          user_id: "user_123",
          input: {
            name: "Ada Lovelace",
            is_allow_tracking: true,
          },
        },
      }),
    );
  });

  it("keeps failed edits dirty and reports the mutation failure", async () => {
    mockUpdateUser.mockRejectedValueOnce(new Error("upstream unavailable"));
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    render(<ProfilePage />);

    const nameInput = await screen.findByRole("textbox", {
      name: "Display name",
    });
    fireEvent.change(nameInput, { target: { value: "Ada Byron" } });
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Error updating profile"),
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });

  it("opens the delete dialog from the new danger-zone card", async () => {
    render(<ProfilePage />);

    const deleteAccountButton = await screen.findByRole("button", {
      name: "Delete account",
    });

    expect(deleteAccountButton).toHaveClass("text-13");
    expect(
      screen.getByText("Permanently delete this account and all of its apps."),
    ).toBeVisible();

    fireEvent.click(deleteAccountButton);
    expect(screen.getByTestId("delete-account-dialog")).toBeInTheDocument();
  });
});
// #endregion

// #region Loading and error states
describe("PortalV3 profile settings [data states]", () => {
  it("renders a profile-shaped loading screen before user data is ready", () => {
    mockUseMeQuery.mockReturnValue({
      user: undefined,
      loading: true,
      error: undefined,
      refetch: mockRefetchMe,
    });

    render(<ProfilePage />);

    expect(screen.getByTestId("profile-loading-state")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("heading", { name: "Profile" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Your teams" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Danger zone" })).toBeVisible();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByRole("button", { name: "New team" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Delete account" }),
    ).toBeDisabled();
  });

  it("keeps cached profile data usable during a failed background refresh", async () => {
    mockUseMeQuery.mockReturnValue({
      user: loadedUser,
      loading: true,
      error: new Error("background refresh failed"),
      refetch: mockRefetchMe,
    });

    render(<ProfilePage />);

    expect(
      await screen.findByRole("textbox", { name: "Display name" }),
    ).toHaveValue("Ada Lovelace");
    expect(
      screen.queryByRole("heading", {
        name: "We couldn't load your profile",
      }),
    ).toBeNull();
  });

  it("waits for the network result before initializing cached profile fields", async () => {
    let meQueryResult = {
      user: loadedUser,
      loading: true,
      error: undefined as Error | undefined,
      refetch: mockRefetchMe,
    };
    mockUseMeQuery.mockImplementation(() => meQueryResult);

    const { rerender } = render(<ProfilePage />);

    expect(screen.getByTestId("profile-loading-state")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();

    meQueryResult = {
      ...meQueryResult,
      user: {
        ...loadedUser,
        name: "Ada King",
        nameToDisplay: "Ada King",
        is_allow_tracking: true,
      },
      loading: false,
    };
    rerender(<ProfilePage />);

    expect(
      await screen.findByRole("textbox", { name: "Display name" }),
    ).toHaveValue("Ada King");
    expect(
      screen.getByRole("switch", { name: "Allow analytics" }),
    ).toHaveAttribute("aria-checked", "true");
  });

  it("shows a retryable error instead of an endless loading state", async () => {
    mockUseMeQuery.mockReturnValue({
      user: undefined,
      loading: true,
      error: new Error("query failed"),
      refetch: mockRefetchMe,
    });

    render(<ProfilePage />);

    expect(
      screen.getByRole("heading", { name: "We couldn't load your profile" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(mockRefetchMe).toHaveBeenCalledTimes(1));
    await screen.findByRole("button", { name: "Try again" });
  });
});
// #endregion
