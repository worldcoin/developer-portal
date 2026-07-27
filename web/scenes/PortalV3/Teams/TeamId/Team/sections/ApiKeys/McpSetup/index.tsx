"use client";
import { CopyIcon } from "@/components/Icons/CopyIcon";
import { TYPOGRAPHY, Typography } from "@/components/Typography";
import {
  getMcpEndpoint,
  getProviderSnippets,
  PROVIDERS,
  type ProviderId,
} from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";
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

  return (
    <section className="order-2 grid gap-y-3 md:pb-8">
      <Typography variant={TYPOGRAPHY.M4} className="text-grey-400 uppercase">
        MCP endpoint
      </Typography>

      <code className="font-ibm text-sm break-all text-grey-900">
        {endpoint}
      </code>

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
                "flex h-9 items-center rounded-full border px-3 text-grey-500 transition-colors hover:border-blue-150 hover:bg-blue-50 hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden",
                {
                  "border-blue-150 bg-blue-50 text-grey-900": isSelected,
                  "border-transparent bg-grey-0": !isSelected,
                },
              )}
            >
              <Typography variant={TYPOGRAPHY.M5}>{item.name}</Typography>
            </button>
          );
        })}
      </div>

      <div className="grid min-h-12 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-12 bg-grey-0 px-3 py-2 shadow-button">
        <pre className="min-w-0 overflow-x-auto font-ibm text-xs leading-5 whitespace-pre text-grey-900">
          <code>{command}</code>
        </pre>

        <button
          type="button"
          aria-label="Copy MCP setup command"
          className="flex size-8 shrink-0 items-center justify-center rounded-12 text-blue-500 transition-colors hover:text-grey-900 focus-visible:ring-2 focus-visible:ring-blue-150 focus-visible:outline-hidden"
          onClick={() =>
            navigator.clipboard
              .writeText(command)
              .then(() => toast.success("Setup command copied to clipboard"))
              .catch(() =>
                toast.error(
                  "Couldn't copy — select the command and copy it manually",
                ),
              )
          }
        >
          <CopyIcon className="size-4" />
        </button>
      </div>
    </section>
  );
};
