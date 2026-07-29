/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn() },
}));
// #endregion

import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { TeamCreatedToast } from "@/scenes/common/Teams/TeamCreatedToast";
import { toast } from "react-toastify";

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
});

// #region Created team confirmation
describe("team created toast [post-navigation confirmation]", () => {
  it("shows and consumes the stored team confirmation once", async () => {
    window.sessionStorage.setItem(
      TEAM_CREATED_TOAST_STORAGE_KEY,
      "Payments Team",
    );

    const { unmount } = render(<TeamCreatedToast />);

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    expect(
      window.sessionStorage.getItem(TEAM_CREATED_TOAST_STORAGE_KEY),
    ).toBeNull();

    const message = (toast.success as unknown as jest.Mock).mock.calls[0][0];
    render(message);
    expect(screen.getByText("Payments Team")).toHaveTextContent(
      "Payments Team",
    );
    expect(screen.getByText("Payments Team").tagName).toBe("B");
    expect(screen.getByText(/New team/)).toHaveTextContent(
      "New team Payments Team was created",
    );

    unmount();
    render(<TeamCreatedToast />);

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });
});
// #endregion
