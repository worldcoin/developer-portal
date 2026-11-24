/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";

// #region Mocks
const validateAndUpdateTeamServerSide = jest.fn();
jest.mock("@/scenes/PortalV3/Teams/TeamId/Team/Settings/server/submit", () => ({
  validateAndUpdateTeamServerSide: (...args: unknown[]) =>
    validateAndUpdateTeamServerSide(...args),
}));

const refetchMe = jest.fn();
jest.mock("@/lib/use-refetch-queries", () => ({
  useRefetchQueries: () => ({ refetch: refetchMe }),
}));

const invalidate = jest.fn();
jest.mock("@auth0/nextjs-auth0/client", () => ({
  useUser: () => ({ invalidate }),
}));

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const toastSuccess = jest.fn();
const toastError = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: (...args: unknown[]) => toastError(...args),
  },
}));
// #endregion

import { TeamSettingsForm } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/SettingsForm";

// #region Test Data
const teamId = "team_cd7aa5f3c2a797a06e66eb6eefbf2f48";

const advanceAutosave = async (milliseconds: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(milliseconds);
  });
};
// #endregion

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  validateAndUpdateTeamServerSide.mockResolvedValue({
    success: true,
    message: "Team updated successfully",
  });
  refetchMe.mockResolvedValue(undefined);
  invalidate.mockResolvedValue(undefined);
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

// #region Autosave
describe("TeamSettingsForm autosave", () => {
  it("renders one simple field and saves it after 1.5 seconds", async () => {
    const onSaved = jest.fn().mockResolvedValue(undefined);
    render(
      <TeamSettingsForm
        teamId={teamId}
        teamName="Test team"
        canWrite={true}
        onSaved={onSaved}
      />,
    );

    const input = screen.getByLabelText(/Team name/);
    expect(input).toHaveValue("Test team");
    expect(screen.queryByAltText("Team logo")).not.toBeInTheDocument();
    expect(screen.queryByText(/Team settings ·/)).not.toBeInTheDocument();
    expect(screen.queryByText("Team name")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Save" }),
    ).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Platform team" } });
    await advanceAutosave(1499);
    expect(validateAndUpdateTeamServerSide).not.toHaveBeenCalled();

    await advanceAutosave(1);
    expect(validateAndUpdateTeamServerSide).toHaveBeenCalledWith(
      "Platform team",
      teamId,
    );
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(refetchMe).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/update-session", {
      method: "POST",
    });
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(toastSuccess).toHaveBeenCalledWith("Team name updated");
  });

  it("shows the server error and keeps the edited value", async () => {
    validateAndUpdateTeamServerSide.mockResolvedValue({
      success: false,
      message: "Unable to update team",
    });
    render(
      <TeamSettingsForm teamId={teamId} teamName="Test team" canWrite={true} />,
    );

    const input = screen.getByLabelText(/Team name/);
    fireEvent.change(input, { target: { value: "Platform team" } });
    await advanceAutosave(1500);

    expect(input).toHaveValue("Platform team");
    expect(toastError).toHaveBeenCalledWith("Unable to update team");
    expect(toastSuccess).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("disables editing and autosave without owner permission", async () => {
    render(
      <TeamSettingsForm
        teamId={teamId}
        teamName="Test team"
        canWrite={false}
      />,
    );

    expect(screen.getByLabelText(/Team name/)).toBeDisabled();
    await advanceAutosave(1500);
    expect(validateAndUpdateTeamServerSide).not.toHaveBeenCalled();
  });
});
// #endregion
