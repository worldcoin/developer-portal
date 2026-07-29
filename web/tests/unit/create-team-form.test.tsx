/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockInvalidate = jest.fn();
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ invalidate: mockInvalidate }),
}));

const mockToastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));
// #endregion

import { CreateTeamForm } from "@/scenes/Onboarding/CreateTeam/Form";

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockInvalidate.mockResolvedValue(undefined);
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

// #region Existing-user team creation
describe("CreateTeamForm", () => {
  it("creates another team without collecting signup consent", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new" }),
    });

    render(<CreateTeamForm />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    const submit = screen.getByRole("button", { name: "Create team" });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });

    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/create-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team_name: "Platform" }),
      }),
    );
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/teams/team_new");
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it("navigates after creation even if the client session refresh fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new" }),
    });
    mockInvalidate.mockRejectedValue(new Error("Profile refresh failed"));

    render(<CreateTeamForm />);
    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });

    const submit = screen.getByRole("button", { name: "Create team" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/teams/team_new"),
    );
    expect(mockRefresh).toHaveBeenCalledTimes(1);
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("keeps the user in place and reports a failed request", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<CreateTeamForm />);
    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });

    const submit = screen.getByRole("button", { name: "Create team" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "We couldn't create your team. Please try again.",
      ),
    );
    expect(mockInvalidate).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});
// #endregion
