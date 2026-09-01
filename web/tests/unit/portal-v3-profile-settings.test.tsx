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
      nameToDisplay: "Ada Lovelace",
      is_allow_tracking: false,
      world_id_nullifier: null,
      memberships: [],
    },
    loading: false,
    error: undefined,
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
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// #endregion

import { ProfilePage } from "@/scenes/PortalV3/Profile/page";

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateUser.mockResolvedValue({});
});

describe("PortalV3 profile settings", () => {
  it("renders the new sections and saves dirty profile fields", async () => {
    render(<ProfilePage />);

    expect(
      await screen.findByRole("heading", { level: 1, name: "Profile" }),
    ).toBeVisible();
    expect(screen.getByTestId("teams-list")).toBeInTheDocument();
    expect(screen.getByTestId("world-id-migration")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Danger zone" })).toBeVisible();

    const nameInput = screen.getByRole("textbox", { name: "Display name" });
    expect(nameInput).toHaveValue("Ada Lovelace");
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();

    fireEvent.change(nameInput, { target: { value: "Ada Byron" } });
    fireEvent.click(await screen.findByRole("button", { name: "Save" }));

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
  });

  it("opens the delete dialog from the danger-zone card", async () => {
    render(<ProfilePage />);

    fireEvent.click(
      await screen.findByRole("button", { name: "Delete account" }),
    );

    expect(screen.getByTestId("delete-account-dialog")).toBeInTheDocument();
  });
});
