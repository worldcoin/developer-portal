/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// #region Mocks
const mockValidateAndInsertApp = jest.fn();
jest.mock("@/scenes/common/layout/CreateAppDialog/server/v4/submit", () => ({
  validateAndInsertAppServerSideV4: (
    ...args: Parameters<typeof mockValidateAndInsertApp>
  ) => mockValidateAndInsertApp(...args),
}));

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { capture: jest.fn() },
}));

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));
// #endregion

import { CreateAppForm } from "@/scenes/common/layout/CreateAppDialog/Form";
import posthog from "posthog-js";
import { toast } from "react-toastify";

const mockPosthogCapture = jest.mocked(posthog.capture);
const mockToastError = jest.mocked(toast.error);

// #region Test Data
const originalLocation = window.location;
const mockLocationReplace = jest.fn();

const enterValidName = async () => {
  fireEvent.change(screen.getByLabelText("App name"), {
    target: { value: "Voting app" },
  });

  await waitFor(() =>
    expect(screen.getByTestId("button-create-app")).toBeEnabled(),
  );
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "location", {
    value: { replace: mockLocationReplace },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

// #region Submission branches
describe("CreateAppForm [submission]", () => {
  it("creates a production cloud app and hard-navigates to its returned id", async () => {
    const onSuccess = jest.fn();
    mockValidateAndInsertApp.mockResolvedValue({
      success: true,
      message: "App created successfully",
      app_id: "app_00000000000000000000000000000000",
    });

    render(<CreateAppForm teamId="team_1" onSuccess={onSuccess} />);

    expect(screen.getByTestId("button-create-app")).toBeDisabled();
    await enterValidName();
    fireEvent.click(screen.getByTestId("button-create-app"));

    await waitFor(() =>
      expect(mockValidateAndInsertApp).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Voting app",
          build: "production",
          verification: "cloud",
          is_miniapp: false,
        }),
        "team_1",
      ),
    );
    expect(mockPosthogCapture).toHaveBeenCalledWith(
      "app_creation_successful",
      expect.objectContaining({
        team_id: "team_1",
        app_id: "app_00000000000000000000000000000000",
      }),
    );
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mockLocationReplace).toHaveBeenCalledWith(
      "/teams/team_1/apps/app_00000000000000000000000000000000",
    );
  });

  it("falls back to the team route when a successful response has no app id", async () => {
    mockValidateAndInsertApp.mockResolvedValue({
      success: true,
      message: "App created successfully",
    });

    render(<CreateAppForm teamId="team_1" onSuccess={jest.fn()} />);
    await enterValidName();
    fireEvent.click(screen.getByTestId("button-create-app"));

    await waitFor(() =>
      expect(mockLocationReplace).toHaveBeenCalledWith("/teams/team_1"),
    );
  });

  it("keeps the modal open and shows the server message when creation is rejected", async () => {
    const onSuccess = jest.fn();
    mockValidateAndInsertApp.mockResolvedValue({
      success: false,
      message: "The user does not have permission to create apps",
      error: "unauthorized",
    });

    render(<CreateAppForm teamId="team_1" onSuccess={onSuccess} />);
    await enterValidName();
    fireEvent.click(screen.getByTestId("button-create-app"));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "The user does not have permission to create apps",
      ),
    );
    expect(mockPosthogCapture).toHaveBeenCalledWith(
      "app_creation_failed",
      expect.objectContaining({ team_id: "team_1", error: "unauthorized" }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockLocationReplace).not.toHaveBeenCalled();
  });

  it("does not submit when the dialog has no team context", async () => {
    render(<CreateAppForm onSuccess={jest.fn()} />);
    await enterValidName();
    fireEvent.click(screen.getByTestId("button-create-app"));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith("Failed to create app"),
    );
    expect(mockValidateAndInsertApp).not.toHaveBeenCalled();
    expect(mockLocationReplace).not.toHaveBeenCalled();
  });

  it("surfaces an unexpected action failure without closing or navigating", async () => {
    const onSuccess = jest.fn();
    mockValidateAndInsertApp.mockRejectedValue(new Error("network failed"));

    render(<CreateAppForm teamId="team_1" onSuccess={onSuccess} />);
    await enterValidName();
    fireEvent.click(screen.getByTestId("button-create-app"));

    await waitFor(() =>
      expect(mockToastError).toHaveBeenCalledWith(
        "An error occurred while creating the app",
      ),
    );
    expect(mockPosthogCapture).toHaveBeenCalledWith(
      "app_creation_failed",
      expect.objectContaining({
        team_id: "team_1",
        error: "network failed",
      }),
    );
    expect(onSuccess).not.toHaveBeenCalled();
    expect(mockLocationReplace).not.toHaveBeenCalled();
  });
});
// #endregion
