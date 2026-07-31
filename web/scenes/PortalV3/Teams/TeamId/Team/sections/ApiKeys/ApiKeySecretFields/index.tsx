"use client";

import { CopyCheckIcon } from "@/components/Icons/CopyCheckIcon";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { ExternalLinkIcon } from "@/components/Icons/ExternalLinkIcon";
import { LockIcon } from "@/components/Icons/LockIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  getMcpEndpoint,
  getProviderSnippets,
  PROVIDERS,
  type ProviderId,
} from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";

const getApiKeyPreview = (apiKey: string) => {
  if (apiKey.length <= 34) {
    return apiKey;
  }

  return `${apiKey.slice(0, 18)}...${apiKey.slice(-12)}`;
};

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
        "flex shrink-0 items-center justify-center text-blue-500 transition-colors hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden",
        {
          "h-9 gap-1.5 rounded-12 border border-grey-200 bg-grey-0 px-3 text-sm font-medium shadow-button":
            variant === "pill",
          "size-8 rounded-12": variant === "icon",
        },
      )}
      aria-label={variant === "icon" ? `Copy ${fieldName}` : undefined}
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
      <pre className="min-w-0 overflow-x-auto font-ibm text-xs leading-5 whitespace-pre text-grey-900">
        <code>{value}</code>
      </pre>
    );
  }

  const firstSpace = value.indexOf(" ");
  const firstToken = firstSpace === -1 ? value : value.slice(0, firstSpace);
  const rest = firstSpace === -1 ? "" : value.slice(firstSpace);

  return (
    <pre className="min-w-0 overflow-x-auto font-ibm text-xs leading-5 whitespace-pre text-grey-900 md:text-sm">
      <code>
        <span className="text-blue-500">{firstToken}</span>
        {rest}
      </code>
    </pre>
  );
};

export const ApiKeySecretFields = (props: { apiKey: string }) => {
  const { apiKey } = props;
  const apiKeyPreview = getApiKeyPreview(apiKey);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("codex");
  const [showRawConfig, setShowRawConfig] = useState(false);
  // Only ever rendered post-mutation inside CreateKeyModal, so `window` exists.
  const snippets = useMemo(
    () => getProviderSnippets(apiKey, getMcpEndpoint(window.location.origin)),
    [apiKey],
  );
  const provider = PROVIDERS.find((item) => item.id === selectedProvider)!;
  const snippet = snippets[selectedProvider];
  const snippetValue = showRawConfig ? snippet.rawConfig : snippet.command;

  return (
    <div className="grid w-full gap-y-5">
      <section className="grid gap-y-2">
        <div className="flex items-center justify-between gap-4 px-1">
          <Typography
            variant={TYPOGRAPHY.M4}
            className="text-grey-400 uppercase"
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
          <code className="min-w-0 font-ibm text-sm break-all text-grey-900">
            {apiKeyPreview}
          </code>

          <CopyControl fieldName="API Key" fieldValue={apiKey} variant="pill" />
        </div>
      </section>

      <section className="grid gap-y-2">
        <div className="flex items-center justify-between gap-4 px-1">
          <Typography
            variant={TYPOGRAPHY.M4}
            className="text-grey-400 uppercase"
          >
            Connect to
          </Typography>

          <button
            type="button"
            className="flex items-center gap-1 text-sm font-medium text-blue-500 transition-colors hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden"
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
                  "flex h-9 items-center rounded-full border px-3 text-grey-500 transition-colors hover:border-blue-150 hover:bg-blue-50 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden",
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
