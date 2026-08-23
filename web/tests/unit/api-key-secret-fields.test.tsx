/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { ApiKeySecretFields } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeySecretFields";

// #region Mocks
const toastSuccess = jest.fn();
jest.mock("react-toastify", () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccess(...args),
    error: jest.fn(),
  },
}));
// #endregion

// #region Test Data
const V3_COMPONENT =
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeySecretFields";

const SHORT_KEY = "api_short";
// Shape of a real key: "api_" + base64 of 88 bytes, padding stripped.
const REAL_KEY = `api_${"a".repeat(118)}`;

const originalLocation = window.location;
const writeText = jest.fn();
let xhrOpen: jest.SpyInstance;

const snippetText = (container: HTMLElement) =>
  container.querySelector("pre")!.textContent ?? "";

beforeEach(() => {
  jest.clearAllMocks();

  Object.defineProperty(window, "location", {
    value: new URL("https://staging.example.test:8443/teams/team_1/settings"),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  global.fetch = jest.fn();
  xhrOpen = jest.spyOn(XMLHttpRequest.prototype, "open");
});

afterEach(() => {
  Object.defineProperty(window, "location", {
    value: originalLocation,
    writable: true,
    configurable: true,
  });
  jest.restoreAllMocks();
});
// #endregion

// #region Endpoint
describe("ApiKeySecretFields [endpoint]", () => {
  it("renders the endpoint for the browser's current origin", () => {
    const { container } = render(<ApiKeySecretFields apiKey={SHORT_KEY} />);

    expect(snippetText(container)).toContain(
      "https://staging.example.test:8443/api/mcp",
    );
    expect(snippetText(container)).not.toContain("developer.world.org");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Provider switching
describe("ApiKeySecretFields [providers]", () => {
  it("resets the raw-config view when the provider changes", () => {
    render(<ApiKeySecretFields apiKey={SHORT_KEY} />);

    fireEvent.click(screen.getByRole("button", { name: "Raw config" }));
    // Cursor, not Claude: codex and claude share a setupLabel.
    fireEvent.click(screen.getByRole("button", { name: "Cursor" }));

    expect(screen.getByRole("button", { name: "Raw config" })).toBeVisible();
    expect(screen.getByText("Paste into .cursor/mcp.json")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cursor" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Codex" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("swaps the codex CLI command for the TOML block", () => {
    const { container } = render(<ApiKeySecretFields apiKey={SHORT_KEY} />);

    expect(snippetText(container).startsWith("codex mcp add")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Raw config" }));

    expect(snippetText(container)).toContain(
      "[mcp_servers.worldcoin-developer-portal]",
    );
    expect(snippetText(container)).not.toContain("codex mcp add");
  });
});
// #endregion

// #region Module boundary
describe("ApiKeySecretFields [module boundary]", () => {
  it("keeps snippet generation in exactly one module", () => {
    expect(Object.keys(require(V3_COMPONENT)).sort()).toEqual([
      "ApiKeySecretFields",
    ]);
    expect(
      Object.keys(
        require("@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets"),
      ).sort(),
    ).toEqual(["PROVIDERS", "getMcpEndpoint", "getProviderSnippets"].sort());
  });
});
// #endregion

// #region Copy controls
describe("ApiKeySecretFields [copy]", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("copies whichever snippet view is showing", () => {
    render(<ApiKeySecretFields apiKey={SHORT_KEY} />);

    fireEvent.click(screen.getByRole("button", { name: "Raw config" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy Codex config" }));

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("[mcp_servers.");
    expect(writeText.mock.calls[0][0]).not.toContain("codex mcp add");
    expect(toastSuccess).toHaveBeenCalledWith(
      "Codex config copied to clipboard",
    );
  });
});
// #endregion
