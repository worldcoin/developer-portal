/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MCP_ENDPOINT } from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets";
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
  it("shows a setup command for the canonical MCP endpoint", () => {
    render(<McpSetup />);

    expect(screen.getByText(MCP_ENDPOINT())).toBeInTheDocument();
    expect(screen.getByText(/YOUR_API_KEY/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Codex" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByText("Run in your terminal")).not.toBeInTheDocument();
  });

  it("keeps long setup text in a fixed horizontal scroller", () => {
    render(<McpSetup />);

    const commandScroller = screen.getByLabelText("MCP setup command");
    expect(commandScroller).toHaveClass("min-w-0", "overflow-x-auto");
    expect(commandScroller.querySelector("code")).toHaveClass(
      "w-max",
      "whitespace-nowrap",
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
