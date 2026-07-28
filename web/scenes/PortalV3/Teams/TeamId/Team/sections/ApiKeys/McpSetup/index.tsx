"use client";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import {
  getMcpEndpoint,
  getProviderSnippets,
  PROVIDERS,
  type ProviderId,
} from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

const KEY_PLACEHOLDER = "YOUR_API_KEY";

export const McpSetup = () => {
  // Origin is unknown during SSR; correct on mount rather than hydrate a wrong one.
  const [endpoint, setEndpoint] = useState(() => getMcpEndpoint(undefined));
  useEffect(() => setEndpoint(getMcpEndpoint(window.location.origin)), []);

  const [providerId, setProviderId] = useState<ProviderId>("claude");

  // The real key is shown once at creation; this section never handles one.
  const snippets = useMemo(
    () => getProviderSnippets(KEY_PLACEHOLDER, endpoint),
    [endpoint],
  );
  const command = snippets[providerId].command;
  const setupLabel =
    PROVIDERS.find((provider) => provider.id === providerId)?.setupLabel ?? "";
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const copyCommand = () => {
    navigator.clipboard
      .writeText(command)
      .then(() => {
        toast.success("Setup command copied to clipboard");
        setCopied(true);

        if (copiedTimeoutRef.current) {
          clearTimeout(copiedTimeoutRef.current);
        }
        copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2_000);
      })
      .catch(() =>
        toast.error("Couldn't copy — select the command and copy it manually"),
      );
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-12 border border-grey-200 bg-white md:col-span-2">
      <div className="flex flex-col gap-3 border-b border-grey-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-twk text-17 leading-6 font-[550] text-grey-900">
          MCP endpoint
        </h2>

        <code className="max-w-full [scrollbar-width:thin] self-start overflow-x-auto rounded-8 border border-grey-100 bg-grey-50 px-2.5 py-1 font-ibm text-12 leading-5 whitespace-nowrap text-grey-700 sm:self-auto">
          {endpoint}
        </code>
      </div>

      <div className="grid gap-4 px-5 py-5">
        <div className="flex flex-wrap gap-1.5">
          {PROVIDERS.map((item) => {
            const isSelected = item.id === providerId;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setProviderId(item.id)}
                className={clsx(
                  "flex h-8 items-center rounded-full border px-3 font-world text-12 font-medium text-grey-500 transition-colors hover:border-blue-150 hover:bg-blue-50 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden",
                  {
                    "border-blue-150 bg-blue-50 text-grey-900": isSelected,
                    "border-grey-100 bg-grey-0": !isSelected,
                  },
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        <p className="font-gta text-12 leading-4 text-grey-400">{setupLabel}</p>

        <div className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-12 border border-grey-200 bg-grey-50 px-3 pt-2 pb-1.5">
          <pre className="min-h-8 min-w-0 [scrollbar-width:thin] overflow-x-auto pb-2 font-ibm text-12 leading-5 whitespace-pre text-grey-900">
            <code>{command}</code>
          </pre>

          <div className="flex shrink-0 items-center gap-2 pb-0.5">
            {copied ? (
              <span
                className="font-gta text-12 whitespace-nowrap text-grey-400"
                role="status"
              >
                Copied to clipboard
              </span>
            ) : null}

            <button
              type="button"
              aria-label="Copy MCP setup command"
              className="flex size-8 shrink-0 items-center justify-center rounded-8 text-blue-500 transition-colors hover:bg-grey-100 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden"
              onClick={copyCommand}
            >
              <CopyIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
