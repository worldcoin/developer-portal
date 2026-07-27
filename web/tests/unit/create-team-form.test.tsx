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

// #region First-user consent
describe("CreateTeam form [first user]", () => {
  it("requires consent before enabling team creation", async () => {
    render(<CreateTeamForm hasPortalUser={false} presentation="full-page" />);

    const teamNameInput = screen.getByLabelText("Team name");
    fireEvent.change(teamNameInput, {
      target: { value: "Platform" },
    });

    const submit = screen.getByRole("button", { name: "Create team" });
    expect(teamNameInput).not.toHaveAttribute("placeholder");
    expect(submit).toHaveClass(
      "group",
      "h-[98px]",
      "max-w-[340px]",
      "cursor-pointer",
      "disabled:cursor-not-allowed",
      "enabled:hover:bg-black",
    );
    const arrow = submit.querySelector("span");
    expect(arrow).not.toHaveClass("group-hover:w-7", "group-hover:opacity-100");
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));

    await waitFor(() => expect(submit).toBeEnabled());
    expect(arrow).toHaveClass("group-hover:w-7", "group-hover:opacity-100");
  });

  it("submits first-team creation as a new user after consent", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new/apps" }),
    });

    render(<CreateTeamForm hasPortalUser={false} presentation="full-page" />);

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
  });
});
// #endregion

// #region Existing-user creation
describe("CreateTeam form [existing user]", () => {
  it("creates a team without asking for consent again", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new" }),
    });

    render(<CreateTeamForm hasPortalUser presentation="dialog" />);

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });

    const submit = screen.getByRole("button", { name: "Create team" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith("/api/create-team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          team_name: "Platform",
          hasUser: true,
        }),
      }),
    );
    expect(mockInvalidate).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith("/teams/team_new");
  });

  it("navigates after creation even if the client session refresh fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ returnTo: "/teams/team_new" }),
    });
    mockInvalidate.mockRejectedValue(new Error("Profile refresh failed"));

    render(<CreateTeamForm hasPortalUser presentation="dialog" />);
    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });

    const submit = screen.getByRole("button", { name: "Create team" });
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.click(submit);

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith("/teams/team_new"),
    );
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it("keeps the user in place and reports a failed request", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<CreateTeamForm hasPortalUser presentation="dialog" />);
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
  });
});
// #endregion
