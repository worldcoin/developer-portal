/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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

import { Form } from "@/scenes/Onboarding/CreateTeam/page/Form";

const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
  mockInvalidate.mockResolvedValue(undefined);
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

// #region Consent gating
describe("CreateTeam onboarding form [consent]", () => {
  it("requires accepting the terms before the team can be created", async () => {
    render(<Form />);

    const teamNameInput = screen.getByLabelText("Team name");
    expect(teamNameInput).not.toHaveAttribute("placeholder");

    fireEvent.change(teamNameInput, { target: { value: "Platform" } });

    const submit = screen.getByRole("button", { name: "Create team" });
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => expect(submit).toBeEnabled());
  });
});
// #endregion

// #region Submission
describe("CreateTeam onboarding form [submission]", () => {
  it("signs up the user and navigates into the portal", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new/apps" }),
    });

    render(<Form />);

    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    const submit = screen.getByRole("button", { name: "Create team" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/create-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: "Platform",
          hasUser: false,
        }),
      }),
    );
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/teams/team_new/apps");
    expect(mockInvalidate.mock.invocationCallOrder[0]).toBeLessThan(
      mockPush.mock.invocationCallOrder[0],
    );
  });

  it("navigates after creation even if the client session refresh fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new/apps" }),
    });
    mockInvalidate.mockRejectedValue(new Error("Profile refresh failed"));

    render(<Form />);
    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

    const submit = screen.getByRole("button", { name: "Create team" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/teams/team_new/apps"),
    );
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("keeps the user on the page and reports a failed request", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<Form />);
    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });
    fireEvent.click(screen.getByRole("checkbox"));

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
  });
});
// #endregion
