/** @jest-environment jsdom */

import "@testing-library/jest-dom";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";

// #region Mocks
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));
// #endregion

import { Form } from "@/scenes/Onboarding/CreateTeam/page/Form";
import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { toast } from "react-toastify";

// #region Test Data
const originalLocation = window.location;
const locationReplace = jest.fn();

const submitTeamName = async (name = "New Team") => {
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: name },
  });

  const submitButton = screen.getByRole("button", { name: "Create team" });
  await waitFor(() => expect(submitButton).toBeEnabled());
  fireEvent.click(submitButton);
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

// #region Confirmed creation navigation
describe("create team form [confirmed creation navigation]", () => {
  it("shows a spinner while creating and hard-navigates to the returned team", async () => {
    let resolveRequest!: (response: {
      ok: boolean;
      json: () => Promise<{ returnTo: string }>;
    }) => void;
    const request = new Promise<{
      ok: boolean;
      json: () => Promise<{ returnTo: string }>;
    }>((resolve) => {
      resolveRequest = resolve;
    });
    (global.fetch as jest.Mock).mockReturnValue(request);

    render(<Form hasUser />);
    await submitTeamName();

    expect(
      screen.getByRole("button", { name: "Creating team" }),
    ).toBeDisabled();
    expect(locationReplace).not.toHaveBeenCalled();

    await act(async () => {
      resolveRequest({
        ok: true,
        json: async () => ({ returnTo: "/teams/team_new" }),
      });
      await request;
    });

    await waitFor(() =>
      expect(locationReplace).toHaveBeenCalledWith("/teams/team_new"),
    );
    expect(
      screen.getByRole("button", { name: "Creating team" }),
    ).toBeDisabled();
    expect(window.sessionStorage.getItem(TEAM_CREATED_TOAST_STORAGE_KEY)).toBe(
      "New Team",
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/create-team", {
      method: "POST",
      body: JSON.stringify({ team_name: "New Team", hasUser: true }),
    });
  });

  it("keeps the user in the dialog when creation fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: "Failed to create team" }),
    });

    render(<Form hasUser />);
    await submitTeamName("Rejected Team");

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Something went wrong"),
    );
    expect(locationReplace).not.toHaveBeenCalled();
  });
});
// #endregion
