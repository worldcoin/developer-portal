/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockDeleteAccount = jest.fn();

jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({
    user: { hasura: { id: "user_123" } },
  }),
}));
jest.mock("@apollo/client/react", () => ({
  useMutation: () => [mockDeleteAccount],
}));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));
// #endregion

import { DeleteAccountDialog } from "@/scenes/PortalV3/Profile/DangerZone/DeleteAccountDialog";

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Confirmation dialog
describe("PortalV3 delete account dialog", () => {
  it("gates the confirm button behind the verification word", async () => {
    render(<DeleteAccountDialog open onClose={jest.fn()} />);

    expect(
      screen.getByRole("heading", {
        name: "Do you want to delete this account?",
      }),
    ).toBeInTheDocument();

    const confirmationInput = screen.getByLabelText(/To verify, type/);
    const confirmButton = screen.getByRole("button", { name: "Yes" });

    expect(confirmButton).toBeDisabled();

    fireEvent.change(confirmationInput, { target: { value: "delet" } });
    await waitFor(() => expect(confirmButton).toBeDisabled());

    // Case-insensitive, matching every other delete in the portal.
    fireEvent.change(confirmationInput, { target: { value: "DELETE" } });
    await waitFor(() => expect(confirmButton).toBeEnabled());

    fireEvent.click(confirmButton);
    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
  });

  it("dismisses without deleting", () => {
    const onClose = jest.fn();
    render(<DeleteAccountDialog open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "No" }));

    expect(onClose).toHaveBeenCalledWith(false);
    expect(mockDeleteAccount).not.toHaveBeenCalled();
  });
});
// #endregion
