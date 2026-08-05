/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { McpSetup } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/McpSetup";

// #region Mocks
const writeTextMock = jest.fn();

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
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
  });
});
