const MCP_SERVER_NAME = "worldcoin-developer-portal";
const MCP_API_KEY_ENV_VAR = "WORLD_DEVELOPER_API_KEY";
const MCP_PATH = "/api/mcp";

export type ProviderId =
  | "codex"
  | "claude"
  | "cursor"
  | "windsurf"
  | "chatgpt"
  | "zed";

export type Provider = {
  id: ProviderId;
  name: string;
  setupLabel: string;
};

export type ProviderSnippet = {
  command: string;
  rawConfig: string;
};

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;
const envReference = (name: string) => `\${${name}}`;
const tomlString = (value: string) => JSON.stringify(value);

// Renders inside the useMemo that shows a one-shot secret, so it must never
// throw: "" and "null" are real origins and would blow up `new URL`.
export const getMcpEndpoint = (origin?: string | null): string => {
  if (!origin || origin === "null") {
    return MCP_PATH;
  }

  return `${origin.replace(/\/+$/, "")}${MCP_PATH}`;
};

const getClaudeMcpCommand = (apiKey: string, endpoint: string) =>
  `claude mcp add ${MCP_SERVER_NAME} ${endpoint} --transport http --header "Authorization: Bearer ${apiKey}"`;

const getCodexMcpCommand = (apiKey: string, endpoint: string) =>
  `codex mcp add ${MCP_SERVER_NAME} --env ${MCP_API_KEY_ENV_VAR}=${shellQuote(apiKey)} -- npx -y mcp-remote ${endpoint} --transport http-only --header 'Authorization:Bearer ${envReference(MCP_API_KEY_ENV_VAR)}'`;

const getClaudeJsonConfig = (apiKey: string, endpoint: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SERVER_NAME]: {
          type: "http",
          url: endpoint,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

const getCursorJsonConfig = (apiKey: string, endpoint: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SERVER_NAME]: {
          url: endpoint,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

const getWindsurfJsonConfig = (apiKey: string, endpoint: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SERVER_NAME]: {
          serverUrl: endpoint,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

const getChatGptConnectorConfig = (apiKey: string, endpoint: string) =>
  [
    `Name: World Developer Portal`,
    `URL: ${endpoint}`,
    `Authorization: Bearer ${apiKey}`,
  ].join("\n");

const getZedJsonConfig = (apiKey: string, endpoint: string) =>
  JSON.stringify(
    {
      context_servers: {
        [MCP_SERVER_NAME]: {
          url: endpoint,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

export const getProviderSnippets = (
  apiKey: string,
  endpoint: string,
): Record<ProviderId, ProviderSnippet> => {
  const claudeJsonConfig = getClaudeJsonConfig(apiKey, endpoint);
  const cursorJsonConfig = getCursorJsonConfig(apiKey, endpoint);
  const windsurfJsonConfig = getWindsurfJsonConfig(apiKey, endpoint);
  const chatGptConnectorConfig = getChatGptConnectorConfig(apiKey, endpoint);
  const zedJsonConfig = getZedJsonConfig(apiKey, endpoint);

  return {
    codex: {
      command: getCodexMcpCommand(apiKey, endpoint),
      rawConfig: [
        `[mcp_servers.${MCP_SERVER_NAME}]`,
        `command = "npx"`,
        `args = ["-y", "mcp-remote", ${tomlString(endpoint)}, "--transport", "http-only", "--header", ${tomlString(`Authorization:Bearer ${envReference(MCP_API_KEY_ENV_VAR)}`)}]`,
        "",
        `[mcp_servers.${MCP_SERVER_NAME}.env]`,
        `${MCP_API_KEY_ENV_VAR} = ${tomlString(apiKey)}`,
      ].join("\n"),
    },
    claude: {
      command: getClaudeMcpCommand(apiKey, endpoint),
      rawConfig: claudeJsonConfig,
    },
    cursor: {
      command: cursorJsonConfig,
      rawConfig: cursorJsonConfig,
    },
    windsurf: {
      command: windsurfJsonConfig,
      rawConfig: windsurfJsonConfig,
    },
    chatgpt: {
      command: chatGptConnectorConfig,
      rawConfig: chatGptConnectorConfig,
    },
    zed: {
      command: zedJsonConfig,
      rawConfig: zedJsonConfig,
    },
  };
};

export const PROVIDERS: Provider[] = [
  {
    id: "codex",
    name: "Codex",
    setupLabel: "Run in your terminal",
  },
  {
    id: "claude",
    name: "Claude",
    setupLabel: "Run in your terminal",
  },
  {
    id: "cursor",
    name: "Cursor",
    setupLabel: "Paste into .cursor/mcp.json",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    setupLabel: "Paste into MCP config",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    setupLabel: "Use as connector config",
  },
  {
    id: "zed",
    name: "Zed",
    setupLabel: "Paste into settings.json",
  },
];
