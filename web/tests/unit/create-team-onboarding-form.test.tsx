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
const mockToastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: { error: (...args: unknown[]) => mockToastError(...args) },
}));
// #endregion

import { TEAM_CREATED_TOAST_STORAGE_KEY } from "@/lib/team-created-toast";
import { Form } from "@/scenes/Onboarding/CreateTeam/page/Form";

// #region Test Data
const originalLocation = window.location;
const locationReplace = jest.fn();

const fillAndConsent = async (name = "Platform") => {
  fireEvent.change(screen.getByLabelText("Team name"), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("checkbox"));

  const submit = screen.getByRole("button", { name: "Create team" });
  await waitFor(() => expect(submit).toBeEnabled());
  return submit;
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

  it("nudges for consent only via a hover hint on the disabled button, never inline", async () => {
    render(<Form />);

    fireEvent.change(screen.getByLabelText("Team name"), {
      target: { value: "Platform" },
    });

    const submit = screen.getByRole("button", { name: "Create team" });
    expect(submit).toBeDisabled();

    // The reminder exists solely as the button's hover tooltip.
    const hint = screen.getByRole("tooltip");
    expect(hint).toHaveTextContent("Please accept the terms and conditions");
    expect(submit).toHaveAttribute("aria-describedby", "terms-consent-hint");
    expect(
      screen.getAllByText("Please accept the terms and conditions"),
    ).toHaveLength(1);

    // Consent removes the hint entirely.
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    expect(submit).not.toHaveAttribute("aria-describedby");

    // Revoking consent disables the button again and brings the hint back —
    // still without any inline red warning.
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(submit).toBeDisabled());
    expect(
      screen.getAllByText("Please accept the terms and conditions"),
    ).toHaveLength(1);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });
});
// #endregion

// #region Submission
describe("CreateTeam onboarding form [submission]", () => {
  it("signs up the user and hard-navigates into the portal with the team-created toast queued", async () => {
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

    render(<Form />);
    const submit = await fillAndConsent();
    fireEvent.click(submit);

    // Pending state holds the button disabled until navigation happens.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Creating team…" }),
      ).toBeDisabled(),
    );
    expect(locationReplace).not.toHaveBeenCalled();

    await act(async () => {
      resolveRequest({
        ok: true,
        json: async () => ({ returnTo: "/teams/team_new/apps" }),
      });
      await request;
    });

    await waitFor(() =>
      expect(locationReplace).toHaveBeenCalledWith("/teams/team_new/apps"),
    );
    expect(
      screen.getByRole("button", { name: "Creating team…" }),
    ).toBeDisabled();
    expect(window.sessionStorage.getItem(TEAM_CREATED_TOAST_STORAGE_KEY)).toBe(
      "Platform",
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/create-team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_name: "Platform", hasUser: false }),
    });
  });

  it("keeps the user on the page and reports a failed request", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    render(<Form />);
    const submit = await fillAndConsent();
    fireEvent.click(submit);

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
