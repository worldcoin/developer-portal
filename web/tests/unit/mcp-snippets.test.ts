import {
  getMcpEndpoint,
  getProviderSnippets,
  PROVIDERS,
  type ProviderId,
} from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets";
import { execFileSync } from "node:child_process";

// #region Test Data
const KEY = "api_TESTKEY";
// Host must be disjoint from production: "staging-developer.world.org" would
// *contain* "developer.world.org" and red-fail case 7 against correct code.
const ENDPOINT = "https://staging.example.test:8443/api/mcp";
const SERVER_NAME = "worldcoin-developer-portal";

const snippetsFor = (apiKey = KEY, endpoint = ENDPOINT) =>
  getProviderSnippets(apiKey, endpoint);

const allStrings = (apiKey = KEY, endpoint = ENDPOINT) =>
  Object.values(snippetsFor(apiKey, endpoint)).flatMap((snippet) => [
    snippet.command,
    snippet.rawConfig,
  ]);
// #endregion

// #region getMcpEndpoint
describe("getMcpEndpoint()", () => {
  it("appends the MCP path to a bare origin", () => {
    expect(getMcpEndpoint("https://staging.example.test")).toBe(
      "https://staging.example.test/api/mcp",
    );
  });

  it.each([
    ["https://x.test/", "https://x.test/api/mcp"],
    ["https://x.test//", "https://x.test/api/mcp"],
    ["http://localhost:3000", "http://localhost:3000/api/mcp"],
    ["https://x.test:8443/", "https://x.test:8443/api/mcp"],
  ])(
    "collapses trailing slashes and keeps scheme and port (%s)",
    (origin, expected) => {
      const result = getMcpEndpoint(origin);

      expect(result).toBe(expected);
      // An unanchored /\/+/g would mangle "https://" into "https:/".
      expect(result).not.toContain("//api");
    },
  );

  it.each([["" as const], ["null" as const], [undefined]])(
    "degrades to a relative path rather than throwing on a degenerate origin (%s)",
    (origin) => {
      expect(() => getMcpEndpoint(origin)).not.toThrow();

      const result = getMcpEndpoint(origin);
      expect(result).toBe("/api/mcp");
      expect(result).not.toContain("null/api/mcp");
      expect(result).not.toContain("undefined");
    },
  );

  it("passes a worldcoin.org origin through instead of canonicalising it", () => {
    expect(getMcpEndpoint("https://developer.worldcoin.org")).toBe(
      "https://developer.worldcoin.org/api/mcp",
    );
  });
});
// #endregion

// #region Module hygiene
describe("mcp-snippets module", () => {
  it("does not read window at import time", () => {
    expect(typeof globalThis.window).toBe("undefined");
    expect(() =>
      require("@/scenes/PortalV3/Teams/TeamId/Team/sections/ApiKeys/ApiKeySecretFields"),
    ).not.toThrow();
  });

  it("returns exactly the provider ids declared in PROVIDERS", () => {
    expect(Object.keys(snippetsFor()).sort()).toEqual(
      PROVIDERS.map((provider) => provider.id).sort(),
    );
  });
});
// #endregion

// #region Endpoint threading
describe("provider snippets — endpoint", () => {
  it.each(PROVIDERS.map((provider) => provider.id))(
    "embeds the supplied endpoint exactly once (%s)",
    (id) => {
      const snippet = snippetsFor()[id as ProviderId];

      expect(snippet.command.split(ENDPOINT).length - 1).toBe(1);
      expect(snippet.rawConfig.split(ENDPOINT).length - 1).toBe(1);
    },
  );

  it("never leaks a hardcoded production host", () => {
    const joined = allStrings().join("\n");

    expect(joined).not.toContain("developer.world.org");
    // With the .org — MCP_SERVER_NAME is "worldcoin-developer-portal".
    expect(joined).not.toContain("worldcoin.org");
    expect(joined).not.toContain("undefined");
  });
});
// #endregion

// #region Codex
describe("codex snippets", () => {
  it("matches the shape verified against codex-cli and mcp-remote", () => {
    expect(snippetsFor().codex.command).toBe(
      "codex mcp add worldcoin-developer-portal --env WORLD_DEVELOPER_API_KEY='api_TESTKEY' -- npx -y mcp-remote https://staging.example.test:8443/api/mcp --transport http-only --header 'Authorization:Bearer ${WORLD_DEVELOPER_API_KEY}'",
    );
  });

  it("keeps the raw key out of the header", () => {
    const key = "api_a$b`c;d";
    const command = snippetsFor(key).codex.command;

    expect(command).toContain(
      "--header 'Authorization:Bearer ${WORLD_DEVELOPER_API_KEY}'",
    );
    // Double quotes would let the user's shell expand the var at add-time.
    expect(command).not.toContain('"Authorization:Bearer');
    // A space after the colon makes mcp-remote's header regex drop the scheme.
    expect(command).not.toContain("Authorization: Bearer ${");
    expect(command.slice(command.indexOf("--header"))).not.toContain(key);
  });

  it("survives a real POSIX shell and agrees with its own TOML argv", () => {
    const key = "api_ab'cd";
    const command = snippetsFor(key).codex.command;

    const quoted = command
      .slice(command.indexOf("--env WORLD_DEVELOPER_API_KEY=") + 30)
      .split(" -- ")[0];
    expect(quoted).toBe("'api_ab'\\''cd'");
    expect(
      execFileSync("/bin/sh", ["-c", `printf %s ${quoted}`]).toString(),
    ).toBe(key);

    // Round-trip the CLI tail through the shell rather than splitting on
    // spaces — the header value legitimately contains one.
    const argv = execFileSync("/bin/sh", [
      "-c",
      `printf '%s\n' ${command.split(" -- ")[1]}`,
    ])
      .toString()
      .split("\n")
      .filter(Boolean);

    const argsLine = snippetsFor(key)
      .codex.rawConfig.split("\n")
      .find((line) => line.startsWith("args = "))!;
    const tomlArgs = JSON.parse(argsLine.slice("args = ".length));

    expect(argv).toEqual(["npx", ...tomlArgs]);
  });

  it("emits parseable TOML holding the key exactly once", () => {
    const rawConfig = snippetsFor().codex.rawConfig;
    const lines = rawConfig.split("\n");

    expect(lines[0]).toBe(`[mcp_servers.${SERVER_NAME}]`);
    expect(lines[1]).toBe('command = "npx"');
    expect(lines[4]).toBe(`[mcp_servers.${SERVER_NAME}.env]`);

    const argsLine = lines[2];
    expect(JSON.parse(argsLine.slice("args = ".length))).toEqual([
      "-y",
      "mcp-remote",
      ENDPOINT,
      "--transport",
      "http-only",
      "--header",
      "Authorization:Bearer ${WORLD_DEVELOPER_API_KEY}",
    ]);
    expect(argsLine).not.toContain(KEY);

    expect(
      JSON.parse(lines[5].slice("WORLD_DEVELOPER_API_KEY = ".length)),
    ).toBe(KEY);
    expect(rawConfig.indexOf(KEY)).toBe(rawConfig.lastIndexOf(KEY));
  });
});
// #endregion

// #region Claude
describe("claude snippets", () => {
  it("no longer writes a live secret into a committed .mcp.json", () => {
    const command = snippetsFor().claude.command;

    expect(command).not.toContain("--scope");
    expect(command).toBe(
      'claude mcp add worldcoin-developer-portal https://staging.example.test:8443/api/mcp --transport http --header "Authorization: Bearer api_TESTKEY"',
    );
  });

  it("emits an http-typed server entry", () => {
    expect(JSON.parse(snippetsFor().claude.rawConfig)).toEqual({
      mcpServers: {
        [SERVER_NAME]: {
          type: "http",
          url: ENDPOINT,
          headers: { Authorization: `Bearer ${KEY}` },
        },
      },
    });
  });
});
// #endregion

// #region Other providers
describe("JSON provider snippets", () => {
  const headers = { Authorization: `Bearer ${KEY}` };

  it.each([
    ["cursor", { mcpServers: { [SERVER_NAME]: { url: ENDPOINT, headers } } }],
    ["zed", { context_servers: { [SERVER_NAME]: { url: ENDPOINT, headers } } }],
  ])("keeps its own schema (%s)", (id, expected) => {
    const snippet = snippetsFor()[id as ProviderId];
    const parsed = JSON.parse(snippet.rawConfig);

    expect(parsed).toEqual(expected);
    expect(snippet.command).toBe(snippet.rawConfig);
  });

  it("renders the chatgpt connector as three labelled lines", () => {
    const lines = snippetsFor().chatgpt.rawConfig.split("\n");

    expect(lines).toEqual([
      "Name: World Developer Portal",
      `URL: ${ENDPOINT}`,
      `Authorization: Bearer ${KEY}`,
    ]);
    // ChatGPT does not normalize the URL; a trailing slash 404s the handshake.
    expect(lines[1].slice("URL: ".length)).toBe(ENDPOINT);
  });
});
// #endregion
