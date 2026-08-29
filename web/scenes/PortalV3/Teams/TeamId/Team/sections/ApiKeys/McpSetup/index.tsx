"use client";
import {
  getMcpEndpoint,
  getProviderSnippets,
  PROVIDERS,
  type ProviderId,
} from "@/scenes/common/Teams/TeamId/Team/ApiKeys/page/mcp-snippets";
import clsx from "clsx";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";

const KEY_PLACEHOLDER = "YOUR_API_KEY";

export const McpSetup = () => {
  // Origin is unknown during SSR; correct on mount rather than hydrate a wrong one.
  const [endpoint, setEndpoint] = useState(() => getMcpEndpoint(undefined));
  useEffect(() => setEndpoint(getMcpEndpoint(window.location.origin)), []);

  const [providerId, setProviderId] = useState<ProviderId>("codex");

  // The real key is shown once at creation; this section never handles one.
  const snippets = useMemo(
    () => getProviderSnippets(KEY_PLACEHOLDER, endpoint),
    [endpoint],
  );
  const command = snippets[providerId].command;
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const copyCommand = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(command);
      toast.success("Setup command copied to clipboard");
      setCopied(true);

      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error("Couldn't copy. Select the command and copy it manually");
    }
  };

  return (
    <section aria-labelledby="mcp-endpoint-heading">
      <h2
        id="mcp-endpoint-heading"
        className="font-world text-17 leading-[1.2] font-[450] tracking-[-0.01em] text-portal-ink"
      >
        MCP endpoint
      </h2>

      <div className="mt-4 flex h-10 w-full items-center overflow-hidden rounded-[10px] border border-portal-border bg-white px-[15px]">
        <code className="block min-w-0 truncate font-world text-15 leading-[1.3] font-[350] text-portal-ink">
          {endpoint}
        </code>
      </div>

      <div className="mt-4 min-h-[162px] rounded-[10px] border border-portal-border bg-white p-[19px]">
        <h3 className="font-world text-15 leading-[1.2] font-[450] text-portal-ink">
          Run in your terminal
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {PROVIDERS.map((item) => {
            const isSelected = item.id === providerId;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setProviderId(item.id)}
                className={clsx(
                  "flex h-8 items-center rounded-full px-[14px] font-world text-13 leading-[1.2] font-[550] tracking-[-0.01em] outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2",
                  {
                    "w-[68px]": item.id === "codex",
                    "w-[71px]": item.id === "claude",
                    "w-[69px]": item.id === "cursor",
                    "w-[85px]": item.id === "chatgpt",
                    "w-[52px]": item.id === "zed",
                  },
                  {
                    "bg-portal-ink text-white hover:bg-portal-ink-hover":
                      isSelected,
                    "bg-portal-canvas text-portal-ink hover:bg-portal-border":
                      !isSelected,
                  },
                )}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex h-10 min-w-0 items-center gap-4 rounded-[10px] border border-portal-border bg-white px-[15px]">
          <code className="block min-w-0 flex-1 truncate font-world text-15 leading-[1.3] font-[350] text-portal-ink">
            {command}
          </code>

          <button
            type="button"
            aria-label="Copy MCP setup command"
            className="relative flex size-5 shrink-0 items-center justify-center rounded outline-hidden before:absolute before:-inset-1.5 hover:opacity-70 focus-visible:ring-2 focus-visible:ring-grey-300 focus-visible:ring-offset-2"
            onClick={copyCommand}
          >
            <Image
              src="/icons/mcp-copy.svg"
              width={20}
              height={20}
              alt=""
              aria-hidden
            />
          </button>

          <span className="sr-only" role="status" aria-live="polite">
            {copied ? "Copied to clipboard" : ""}
          </span>
        </div>
      </div>
    </section>
  );
};
