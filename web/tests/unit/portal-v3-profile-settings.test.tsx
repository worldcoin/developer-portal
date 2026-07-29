/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockUpdateUser = jest.fn();
const mockRefetchMe = jest.fn();

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: { hasura: { id: "user_123" } },
  }),
}));
jest.mock("@apollo/client/react", () => ({
  useMutation: () => [mockUpdateUser],
}));
jest.mock("@/scenes/common/me-query/client", () => ({
  useMeQuery: () => ({
    user: {
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
    },
    loading: false,
    refetch: mockRefetchMe,
  }),
}));
jest.mock("@/scenes/PortalV3/Profile/Teams/page/List", () => ({
  List: () => <div data-testid="teams-list" />,
}));
jest.mock("@/scenes/common/Profile/page/WorldIdAccountMigration", () => ({
  WorldIdAccountMigration: () => <div data-testid="world-id-migration" />,
}));
jest.mock("@/scenes/PortalV3/Profile/DangerZone/DeleteAccountDialog", () => ({
  DeleteAccountDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-account-dialog" /> : null,
}));
jest.mock("@/scenes/PortalV3/Profile/page/CreateTeamDialog", () => ({
  CreateTeamDialog: () => null,
}));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// #endregion

import { ProfilePage } from "@/scenes/PortalV3/Profile/page";

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateUser.mockResolvedValue({});
});

// #region Consolidated settings cards
describe("PortalV3 profile settings", () => {
  it("renders the cards in priority order and only enables a dirty form", async () => {
    render(<ProfilePage />);

    expect(
      screen
        .getAllByRole("heading", { level: 2 })
        .map((heading) => heading.textContent),
    ).toEqual(["Teams", "Display name", "Delete account"]);
    expect(screen.getByTestId("teams-list")).toBeInTheDocument();
    expect(screen.getByTestId("world-id-migration")).toBeInTheDocument();

    const nameInput = screen.getByRole("textbox");
    await waitFor(() => expect(nameInput).toHaveValue("Ada Lovelace"));

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: "Ada Byron" } });
    await waitFor(() => expect(saveButton).toBeEnabled());

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
    await waitFor(() => expect(saveButton).toBeDisabled());
  });

  it("opens the existing delete dialog from the danger card", () => {
    render(<ProfilePage />);

    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(screen.getByTestId("delete-account-dialog")).toBeInTheDocument();
  });
});
// #endregion
