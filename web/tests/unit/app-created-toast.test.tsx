/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn() },
}));
// #endregion

import { APP_CREATED_TOAST_STORAGE_KEY } from "@/lib/app-created-toast";
import { AppCreatedToast } from "@/scenes/common/Apps/AppCreatedToast";
import { toast } from "react-toastify";

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
});

// #region Created app confirmation
describe("app created toast [post-navigation confirmation]", () => {
  it("shows and consumes the stored app confirmation once", async () => {
    window.sessionStorage.setItem(APP_CREATED_TOAST_STORAGE_KEY, "Voting app");

    const { unmount } = render(<AppCreatedToast />);

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(
      window.sessionStorage.getItem(APP_CREATED_TOAST_STORAGE_KEY),
    ).toBeNull();

    const message = (toast.success as unknown as jest.Mock).mock.calls[0][0];
    render(message);
    expect(screen.getByText("Voting app").tagName).toBe("B");
    expect(screen.getByText(/New app/)).toHaveTextContent(
      "New app Voting app was created",
    );

    unmount();
    render(<AppCreatedToast />);

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });

  it("does nothing when no confirmation is stored", () => {
    render(<AppCreatedToast />);

    expect(toast.success).not.toHaveBeenCalled();
  });
});
// #endregion
