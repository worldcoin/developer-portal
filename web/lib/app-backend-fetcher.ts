"use server";
import { createSignedFetcher } from "aws-sigv4-fetch";

const BASE = new URL(process.env.NEXT_SERVER_APP_BACKEND_BASE_URL ?? "");

function assertAndBuildBackendUrl(path: string): URL {
  if (!process.env.NEXT_SERVER_APP_BACKEND_BASE_URL) {
    throw new Error("Missing NEXT_SERVER_APP_BACKEND_BASE_URL env");
  }

  // 1) Only allow relative paths
  if (/^https?:\/\//i.test(path)) {
    throw new Error("Absolute URLs are not allowed");
  }

  // 1.5) Forbid path traversal and dangerous input
  if (/(\.\.\/|%2e%2e%2f|\\)/i.test(path)) {
    throw new Error("Path traversal or backslash not allowed in URL");
  }

  // Normalize leading slash to avoid “//”
  const safePath = path.replace(/^\/+/, "");

  // 2) Build structurally using URL, not string concat
  const url = new URL(safePath, BASE);

  // 3) Enforce strict allowlist
  if (url.origin !== BASE.origin) throw new Error("Origin not allowed");
  if (url.protocol !== "https:") throw new Error("HTTPS required");
  if (url.username || url.password)
    throw new Error("URL credentials not allowed");

  return url;
}

export const appBackendFetcher = async (
  path: string,
  options: RequestInit & { teamId: string },
): Promise<Response> => {
  const urlObj = assertAndBuildBackendUrl(path);

  const { teamId, ...reqOptions } = options;
  const defaultHeaders = {
    "User-Agent": "DevPortal/1.0",
    "Content-Type": "application/json",
    "X-Dev-Portal-User-Id": `team_${teamId}`,
    ...reqOptions.headers,
  };

  // Treat dev backend as “local” behavior if needed
  const isDevBackend = urlObj.hostname === "app-backend.worldcoin.dev";

  if (isDevBackend) {
    return fetch(urlObj.toString(), {
      ...reqOptions,
      method: options.method || "GET",
      headers: {
        "client-name": "android",
        "client-version": "999.9.9",
        ...defaultHeaders,
      },
      body: reqOptions.body ?? undefined,
    });
  }

  let signedFetch = globalThis.TransactionSignedFetcher;
  if (!signedFetch) {
    signedFetch = createSignedFetcher({
      service: "execute-api",
      region: process.env.TRANSACTION_BACKEND_REGION,
    });
    globalThis.TransactionSignedFetcher = signedFetch;
  }

  return signedFetch(urlObj.toString(), {
    method: options.method || "GET",
    headers: defaultHeaders,
  });
};
