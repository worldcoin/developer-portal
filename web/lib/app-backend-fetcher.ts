"use server";
import { createSignedFetcher } from "aws-sigv4-fetch";

const isLocalhost = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === "app-backend.worldcoin.dev";
  } catch {
    return false;
  }
};

/**
 * Fetches from the app backend.
 * If the URL is localhost, uses regular fetch.
 * Otherwise, uses signed fetch with AWS SigV4.
 */
export const appBackendFetcher = async (
  url: string,
  options: RequestInit & {
    teamId: string;
  },
): Promise<Response> => {
  // Validate URL to prevent SSRF - only allow URLs from the configured backend
  const allowedBaseUrl = process.env.NEXT_SERVER_APP_BACKEND_BASE_URL;
  if (!allowedBaseUrl || !url.startsWith(allowedBaseUrl)) {
    throw new Error("Invalid backend URL");
  }

  const isLocal = isLocalhost(url);
  const { teamId, ...reqOptions } = options;

  const defaultHeaders = {
    "User-Agent": "DevPortal/1.0",
    "Content-Type": "application/json",
    "X-Dev-Portal-User-Id": `team_${teamId}`,
    ...reqOptions.headers,
  };

  if (isLocal) {
    // Use regular fetch for localhost
    return fetch(url, {
      ...reqOptions,
      method: options.method || "GET",
      headers: {
        // NOTE: some required api calls for dev
        "client-name": "android",
        "client-version": "999.9.9",
        ...defaultHeaders,
        // NOTE: add Authorization bearer here
      },
      body: reqOptions.body || undefined,
    });
  }

  // Use signed fetch for non-localhost
  let signedFetch = global.TransactionSignedFetcher;
  if (!signedFetch) {
    signedFetch = createSignedFetcher({
      service: "execute-api",
      region: process.env.TRANSACTION_BACKEND_REGION,
    });
  }

  return signedFetch(url, {
    method: options.method || "GET",
    headers: defaultHeaders,
  });
};
