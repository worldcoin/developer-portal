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
  it("uses the form dialog and requires the exact confirmation phrase", async () => {
    const onClose = jest.fn();
    render(<DeleteAccountDialog open onClose={onClose} />);

    expect(
      screen.getByRole("heading", { name: "Delete account" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("This action cannot be undone."),
    ).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeInTheDocument();

    const confirmationInput = screen.getByLabelText(
      "To confirm, type DELETE below",
    );
    const deleteButton = screen.getByRole("button", {
      name: "Delete account",
    });

    expect(deleteButton).toHaveClass("text-13");
    expect(deleteButton).toBeDisabled();

    fireEvent.change(confirmationInput, { target: { value: "delete" } });
    await waitFor(() => expect(deleteButton).toBeDisabled());

    fireEvent.change(confirmationInput, { target: { value: "DELETE" } });
    await waitFor(() => expect(deleteButton).toBeEnabled());

    fireEvent.click(screen.getByRole("button", { name: "Keep account" }));
    expect(onClose).toHaveBeenCalledWith(false);
    await waitFor(() => expect(confirmationInput).toHaveValue(""));
  });
});
// #endregion
