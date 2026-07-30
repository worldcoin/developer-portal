/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockToastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));
// #endregion

import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { CreateTeamForm } from "@/scenes/Onboarding/CreateTeam/Form";

// #region Test Data
const originalLocation = window.location;
const locationReplace = jest.fn();

const submitTeamName = async (name = "Platform") => {
  fireEvent.change(screen.getByLabelText("Team name"), {
    target: { value: name },
  });

  const submit = screen.getByRole("button", { name: "Create team" });
  await waitFor(() => expect(submit).toBeEnabled());
  fireEvent.click(submit);
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  window.sessionStorage.clear();
  global.fetch = jest.fn();
  Object.defineProperty(window, "location", {
    value: { replace: locationReplace },
    writable: true,
    configurable: true,
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

// #region Dialog team creation
describe("CreateTeam dialog form", () => {
  it("creates a team as an existing user and hard-navigates with the toast queued", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new" }),
    });

    render(<CreateTeamForm />);

    // The dialog serves existing users only — no signup consent here.
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    await submitTeamName();

    await waitFor(() =>
      expect(locationReplace).toHaveBeenCalledWith("/teams/team_new"),
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/create-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_name: "Platform", hasUser: true }),
    });
    expect(window.sessionStorage.getItem(TEAM_CREATED_TOAST_STORAGE_KEY)).toBe(
      "Platform",
    );
    expect(
      screen.getByRole("button", { name: "Creating team…" }),
    ).toBeDisabled();
  });

  it("keeps the user in the dialog and reports a failed request", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<CreateTeamForm />);
    await submitTeamName();

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "We couldn't create your team. Please try again.",
      ),
    );
    expect(locationReplace).not.toHaveBeenCalled();
    expect(
      window.sessionStorage.getItem(TEAM_CREATED_TOAST_STORAGE_KEY),
    ).toBeNull();
  });
});
// #endregion
