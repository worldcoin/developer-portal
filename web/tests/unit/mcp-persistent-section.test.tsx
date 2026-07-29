/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { ApiKeys } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys";
import { McpSetup } from "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/McpSetup";
import {
  getMcpEndpoint,
  getProviderSnippets,
} from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets";

// #region Mocks
// mcp-snippets stays REAL — it is the seam under test (case 9 compares the
// rendered command against it byte for byte).
const fetchKeysMock = jest.fn();
const mutateMock = jest.fn();
jest.mock("@apollo/client/react", () => ({
  useQuery: (doc: { __mockDoc?: string }) =>
    doc?.__mockDoc === "fetchKeys"
      ? fetchKeysMock()
      : { data: undefined, loading: false },
  useMutation: () => [mutateMock, { loading: false }],
}));

jest.mock(
  "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/graphql/client/fetch-keys.generated",
  () => ({ FetchKeysDocument: { __mockDoc: "fetchKeys" } }),
);

// Both stubs are covered by files 6-7 and both drag in useUser, Radix and
// ApiKeySecretFields, which this file has no business rendering.
jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeyTable",
  () => ({
    ApiKeysTable: () => <div data-testid="api-key-table" />,
  }),
);

jest.mock(
  "@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/CreateKeyModal",
  () => ({
    CreateKeyModal: (props: { isOpen?: boolean }) => (
      <div data-testid="create-key-modal" data-open={String(props.isOpen)} />
    ),
  }),
);

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const push = jest.fn();
const replace = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/teams/team_1/settings",
  useSearchParams: () => new URLSearchParams(),
}));
// #endregion

// #region Test Data
const ORIGIN = "https://staging.developer.world.org";

const makeKey = (over: Partial<{ id: string; name: string }> = {}) => ({
  __typename: "api_key" as const,
  id: over.id ?? "key_1",
  name: over.name ?? "prod-mcp",
  created_at: "2024-01-01T00:00:00.000Z",
  is_active: true,
  team: { __typename: "team" as const, id: "team_1", name: "Team" },
});

const originalLocation = window.location;
const writeText = jest.fn();
let xhrOpen: jest.SpyInstance;

const setLocation = (origin: string) =>
  Object.defineProperty(window, "location", {
    value: new URL(`${origin}/teams/team_1/settings`),
    writable: true,
    configurable: true,
  });

const renderSection = (
  query: { data?: unknown; loading: boolean },
  canWrite = true,
) => {
  fetchKeysMock.mockReturnValue(query);
  return render(
    <>
      <ApiKeys teamId="team_1" canWrite={canWrite} />
      <McpSetup />
    </>,
  );
};

// Exactly one <pre> lives in this composite (McpSetup's snippet block).
const snippetEl = (container: HTMLElement) => container.querySelector("pre")!;
const snippetText = (container: HTMLElement) =>
  snippetEl(container).textContent ?? "";

beforeEach(() => {
  jest.clearAllMocks();
  fetchKeysMock.mockReset();

  setLocation(ORIGIN);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  writeText.mockResolvedValue(undefined);
  // whatwg-fetch's polyfill is real and XHR-backed; without our own spies the
  // "transmits nothing" assertions would either throw or hit the network.
  global.fetch = jest.fn();
  navigator.sendBeacon = jest.fn();
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

// #region Renders in every branch of the section
describe("Team settings credentials [MCP block presence]", () => {
  it("renders the MCP setup block when the team has zero API keys", () => {
    const { container } = renderSection({
      data: { api_key: [] },
      loading: false,
    });

    expect(screen.getByText("No API keys found")).toBeInTheDocument();
    expect(screen.getByText(`${ORIGIN}/api/mcp`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /codex/i })).toBeInTheDocument();
    expect(snippetText(container)).toContain(`${ORIGIN}/api/mcp`);
  });

  it("renders the MCP setup block when the team already has API keys", () => {
    renderSection({ data: { api_key: [makeKey()] }, loading: false });

    expect(screen.getByTestId("api-key-table")).toBeInTheDocument();
    expect(screen.getByText(`${ORIGIN}/api/mcp`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /codex/i })).toBeInTheDocument();
  });

  it("renders the MCP setup block while the keys query is loading", () => {
    renderSection({ data: undefined, loading: true });

    expect(screen.getByText(`${ORIGIN}/api/mcp`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /codex/i })).toBeInTheDocument();
    expect(screen.queryByTestId("api-key-table")).not.toBeInTheDocument();
  });
});
// #endregion

// #region Endpoint
describe("Team settings credentials [MCP endpoint]", () => {
  // Two origins in one file: a module-scope `const ENDPOINT = getMcpEndpoint(...)`
  // is evaluated once per file and would pass the first row and fail the second.
  it.each([
    "https://staging.developer.world.org",
    "https://developer.world.org",
  ])("derives the endpoint from origin %s", (origin) => {
    setLocation(origin);
    const { container } = renderSection({
      data: { api_key: [] },
      loading: false,
    });

    expect(screen.getByText(`${origin}/api/mcp`)).toBeInTheDocument();
    expect(snippetText(container)).toContain(`${origin}/api/mcp`);
  });
});
// #endregion

// #region MCP command
describe("Team settings credentials [MCP command]", () => {
  it("renders a placeholder where the key goes, never a real secret", () => {
    const { container } = renderSection({
      data: { api_key: [] },
      loading: false,
    });

    const text = snippetText(container);
    expect(text).toMatch(/YOUR_API_KEY/);
    expect(text).not.toMatch(/Bearer\s*$/m);
    expect(text).not.toMatch(/Bearer\s+"/);
  });

  it("offers no way to enter an API key", () => {
    const { container } = renderSection({
      data: { api_key: [] },
      loading: false,
    });

    // The section deliberately never handles a user's key: no input to type
    // one into, and nothing that could carry one off the page.
    expect(container.querySelectorAll("input")).toHaveLength(0);
    expect(container.querySelectorAll("textarea")).toHaveLength(0);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(xhrOpen).not.toHaveBeenCalled();
    expect(navigator.sendBeacon).not.toHaveBeenCalled();
    expect(mutateMock).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("keeps the placeholder when the provider changes", () => {
    const { container } = renderSection({
      data: { api_key: [] },
      loading: false,
    });

    expect(snippetText(container)).toMatch(/^claude mcp add /);

    fireEvent.click(screen.getByRole("button", { name: /cursor/i }));
    const cursorText = snippetText(container);

    expect(() => JSON.parse(cursorText)).not.toThrow();
    expect(
      JSON.parse(cursorText).mcpServers["worldcoin-developer-portal"].headers
        .Authorization,
    ).toBe("Bearer YOUR_API_KEY");
  });

  it("renders a command produced by the shared snippet module", () => {
    const { container } = renderSection({
      data: { api_key: [] },
      loading: false,
    });

    expect(snippetEl(container).textContent).toBe(
      getProviderSnippets("YOUR_API_KEY", getMcpEndpoint(ORIGIN)).claude
        .command,
    );
    expect(snippetText(container)).not.toContain("--scope project");
  });

  it("copies the placeholder command", async () => {
    renderSection({ data: { api_key: [] }, loading: false });

    // The copy control's accessible name is provider-independent by design —
    // any provider name in it collides with the picker's getByRole queries.
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /copy/i }));
    });

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("YOUR_API_KEY"),
    );
    expect(writeText.mock.calls[0][0]).toContain(`${ORIGIN}/api/mcp`);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Read-only viewers
describe("Team settings credentials [canWrite=false]", () => {
  it("still shows the MCP block to a non-writing viewer who has keys", () => {
    renderSection({ data: { api_key: [makeKey()] }, loading: false }, false);

    expect(screen.getByText(`${ORIGIN}/api/mcp`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /codex/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /new key/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("create-key-modal")).not.toBeInTheDocument();
  });

  it("still shows the MCP block to a non-writing viewer with no keys", () => {
    renderSection({ data: { api_key: [] }, loading: false }, false);

    expect(screen.getByText(`${ORIGIN}/api/mcp`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /codex/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /create new key/i }),
    ).not.toBeInTheDocument();
  });
});
// #endregion
