/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { McpSetup } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/McpSetup";

// #region Mocks
const writeTextMock = jest.fn();
const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();

jest.mock("react-toastify", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));
// #endregion

const originalLocation = window.location;

beforeEach(() => {
  jest.clearAllMocks();
  Object.defineProperty(window, "location", {
    value: new URL("https://staging.example.test/teams/team_1/settings"),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: writeTextMock },
    configurable: true,
  });
  writeTextMock.mockResolvedValue(undefined);
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
});

describe("MCP setup", () => {
  it("shows a setup command for the current portal origin", () => {
    render(<McpSetup />);

    expect(
      screen.getByText("https://staging.example.test/api/mcp"),
    ).toBeInTheDocument();
    expect(screen.getByText(/YOUR_API_KEY/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Codex" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("copies the displayed setup command", async () => {
    render(<McpSetup />);
    const command = screen.getByText(/YOUR_API_KEY/).textContent;

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy mcp setup command/i }),
      );
    });

    expect(writeTextMock).toHaveBeenCalledWith(command);
    expect(toastSuccessMock).toHaveBeenCalledWith(
      "Setup command copied to clipboard",
    );
  });

  it("shows an actionable error when clipboard access fails", async () => {
    writeTextMock.mockRejectedValueOnce(new Error("Clipboard denied"));
    render(<McpSetup />);

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /copy mcp setup command/i }),
      );
    });

    expect(toastErrorMock).toHaveBeenCalledWith(
      "Couldn't copy. Select the command and copy it manually",
    );
  });
});
