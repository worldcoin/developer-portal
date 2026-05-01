"use client";

import { CopyCheckIcon } from "@/components/Icons/CopyCheckIcon";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { ExternalLinkIcon } from "@/components/Icons/ExternalLinkIcon";
import { LockIcon } from "@/components/Icons/LockIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

const MCP_SERVER_NAME = "worldcoin-developer-portal";
const MCP_ENDPOINT = "https://developer.world.org/api/mcp";
const MCP_API_KEY_ENV_VAR = "WORLD_DEVELOPER_API_KEY";

type ProviderId =
  | "codex"
  | "claude"
  | "cursor"
  | "windsurf"
  | "chatgpt"
  | "zed";

type Provider = {
  id: ProviderId;
  name: string;
  setupLabel: string;
};

type ProviderSnippet = {
  command: string;
  rawConfig: string;
};

const shellQuote = (value: string) => `'${value.replace(/'/g, "'\\''")}'`;
const envReference = (name: string) => `\${${name}}`;
const tomlString = (value: string) => JSON.stringify(value);

export const getClaudeMcpCommand = (apiKey: string) =>
  `claude mcp add --transport http --scope project --header "Authorization: Bearer ${apiKey}" ${MCP_SERVER_NAME} ${MCP_ENDPOINT}`;

export const getCodexMcpCommand = (apiKey: string) =>
  `codex mcp add ${MCP_SERVER_NAME} --env ${MCP_API_KEY_ENV_VAR}=${shellQuote(apiKey)} -- npx -y mcp-remote ${MCP_ENDPOINT} --transport http-only --header 'Authorization:Bearer ${envReference(MCP_API_KEY_ENV_VAR)}'`;

const getClaudeJsonConfig = (apiKey: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SERVER_NAME]: {
          type: "http",
          url: MCP_ENDPOINT,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

const getCursorJsonConfig = (apiKey: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SERVER_NAME]: {
          url: MCP_ENDPOINT,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

const getWindsurfJsonConfig = (apiKey: string) =>
  JSON.stringify(
    {
      mcpServers: {
        [MCP_SERVER_NAME]: {
          serverUrl: MCP_ENDPOINT,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

const getChatGptConnectorConfig = (apiKey: string) =>
  [
    `Name: World Developer Portal`,
    `URL: ${MCP_ENDPOINT}`,
    `Authorization: Bearer ${apiKey}`,
  ].join("\n");

const getZedJsonConfig = (apiKey: string) =>
  JSON.stringify(
    {
      context_servers: {
        [MCP_SERVER_NAME]: {
          url: MCP_ENDPOINT,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2,
  );

const getProviderSnippets = (
  apiKey: string,
): Record<ProviderId, ProviderSnippet> => {
  const claudeJsonConfig = getClaudeJsonConfig(apiKey);
  const cursorJsonConfig = getCursorJsonConfig(apiKey);
  const windsurfJsonConfig = getWindsurfJsonConfig(apiKey);
  const chatGptConnectorConfig = getChatGptConnectorConfig(apiKey);
  const zedJsonConfig = getZedJsonConfig(apiKey);

  return {
    codex: {
      command: getCodexMcpCommand(apiKey),
      rawConfig: [
        `[mcp_servers.${MCP_SERVER_NAME}]`,
        `command = "npx"`,
        `args = ["-y", "mcp-remote", ${tomlString(MCP_ENDPOINT)}, "--transport", "http-only", "--header", ${tomlString(`Authorization:Bearer ${envReference(MCP_API_KEY_ENV_VAR)}`)}]`,
        "",
        `[mcp_servers.${MCP_SERVER_NAME}.env]`,
        `${MCP_API_KEY_ENV_VAR} = ${tomlString(apiKey)}`,
      ].join("\n"),
    },
    claude: {
      command: getClaudeMcpCommand(apiKey),
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

const PROVIDERS: Provider[] = [
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

const CopyControl = (props: {
  fieldName: string;
  fieldValue: string;
  variant: "pill" | "icon";
}) => {
  const { fieldName, fieldValue, variant } = props;
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    setIsCopied(true);
    navigator.clipboard.writeText(fieldValue);
    toast.success(`${fieldName} copied to clipboard`);

    setTimeout(() => {
      setIsCopied(false);
    }, 4000);
  };

  const Icon = isCopied ? CopyCheckIcon : CopyIcon;

  return (
    <button
      type="button"
      className={clsx(
        "flex shrink-0 items-center justify-center text-blue-500 transition-colors hover:text-grey-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-150",
        {
          "h-9 gap-1.5 rounded-12 border border-grey-200 bg-grey-0 px-3 text-sm font-medium shadow-button":
            variant === "pill",
          "size-8 rounded-12": variant === "icon",
        },
      )}
      onClick={copyToClipboard}
    >
      <Icon className="size-4" />
      {variant === "pill" && <span>{isCopied ? "Copied" : "Copy"}</span>}
    </button>
  );
};

const SnippetText = (props: { value: string; isRawConfig: boolean }) => {
  const { value, isRawConfig } = props;

  if (isRawConfig) {
    return (
      <pre className="min-w-0 overflow-x-auto whitespace-pre font-ibm text-xs leading-5 text-grey-900">
        <code>{value}</code>
      </pre>
    );
  }

  const firstSpace = value.indexOf(" ");
  const firstEquals = value.indexOf("=");
  const splitAt =
    firstSpace === -1
      ? firstEquals
      : firstEquals === -1
        ? firstSpace
        : Math.min(firstSpace, firstEquals);
  const firstToken = splitAt === -1 ? value : value.slice(0, splitAt);
  const rest = splitAt === -1 ? "" : value.slice(splitAt);

  return (
    <pre className="min-w-0 overflow-x-auto whitespace-pre font-ibm text-xs leading-5 text-grey-900 md:text-sm">
      <code>
        <span className="text-blue-500">{firstToken}</span>
        {rest}
      </code>
    </pre>
  );
};

export const ApiKeySecretFields = (props: { apiKey: string }) => {
  const { apiKey } = props;
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("codex");
  const [showRawConfig, setShowRawConfig] = useState(false);
  const snippets = useMemo(() => getProviderSnippets(apiKey), [apiKey]);
  const provider = PROVIDERS.find((item) => item.id === selectedProvider)!;
  const snippet = snippets[selectedProvider];
  const snippetValue = showRawConfig ? snippet.rawConfig : snippet.command;

  return (
    <div className="grid w-full gap-y-5">
      <section className="grid gap-y-2">
        <div className="flex items-center justify-between gap-4 px-1">
          <Typography
            variant={TYPOGRAPHY.M4}
            className="uppercase text-grey-400"
          >
            API key
          </Typography>

          <Typography
            variant={TYPOGRAPHY.M4}
            className="flex items-center gap-1 text-grey-400"
          >
            <LockIcon className="size-4" />
            Shown once
          </Typography>
        </div>

        <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-12 border border-blue-150 bg-blue-50 p-1.5 pl-3">
          <code
            className="truncate font-ibm text-sm text-grey-900"
            title={apiKey}
          >
            {apiKey}
          </code>

          <CopyControl fieldName="API Key" fieldValue={apiKey} variant="pill" />
        </div>
      </section>

      <section className="grid gap-y-2">
        <div className="flex items-center justify-between gap-4 px-1">
          <Typography
            variant={TYPOGRAPHY.M4}
            className="uppercase text-grey-400"
          >
            Connect to
          </Typography>

          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-blue-500 transition-colors hover:text-grey-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-150"
            onClick={() => setShowRawConfig((value) => !value)}
          >
            {showRawConfig ? "Command" : "Raw config"}
            {!showRawConfig && <ExternalLinkIcon />}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PROVIDERS.map((item) => {
            const isSelected = item.id === selectedProvider;

            return (
              <button
                key={item.id}
                type="button"
                className={clsx(
                  "flex h-9 items-center rounded-full border px-3 text-grey-500 transition-colors hover:border-blue-150 hover:bg-blue-50 hover:text-grey-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-150",
                  {
                    "border-blue-150 bg-blue-50 text-grey-900": isSelected,
                    "border-transparent bg-grey-0": !isSelected,
                  },
                )}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedProvider(item.id);
                  setShowRawConfig(false);
                }}
              >
                <Typography variant={TYPOGRAPHY.M5}>{item.name}</Typography>
              </button>
            );
          })}
        </div>

        <div className="grid gap-y-2 rounded-12 border border-grey-200 bg-grey-50 p-3">
          <Typography
            variant={TYPOGRAPHY.M4}
            className="flex items-center gap-2 text-grey-400"
          >
            <span className="font-ibm">&gt;_</span>
            {showRawConfig ? "Raw config" : provider.setupLabel}
          </Typography>

          <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-12 bg-grey-0 px-3 py-2 shadow-button">
            <SnippetText value={snippetValue} isRawConfig={showRawConfig} />
            <CopyControl
              fieldName={`${provider.name} ${showRawConfig ? "config" : "setup"}`}
              fieldValue={snippetValue}
              variant="icon"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
