"use server";

import { createSignedFetcher } from "aws-sigv4-fetch";

/**
 * Checks if a URL is for API calls from localhost
 */
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
  const isLocal = isLocalhost(url);
  console.log("isLocal", isLocal, url);
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
      method: options.method || "GET",
      headers: {
        // NOTE: some required api calls for dev
        "client-name": "android",
        "client-version": "999.9.9",
        ...defaultHeaders,
        Authorization:
          "Bearer eyJhbGciOiJFQ0RILUVTK0EyNTZLVyIsImVuYyI6IkEyNTZHQ00iLCJraWQiOiJlMmQwMjY2ZS1lMDM0LTQ2YzMtOWNlOC1hYjRkNjM5ZjBmMWUiLCJ0eXBlIjoiYWNjZXNzX3Rva2VuIiwiZXBrIjp7IngiOiJfa21QMWlPUXRHdkdndlVMeml4WGZJZFRKcldralBwYk52Y2NVcVNxdTFNOEhPTFppenNKSHR4eE5vYk1iX3htSGk0dEItWkhNZFUiLCJjcnYiOiJYNDQ4Iiwia3R5IjoiT0tQIn19.ISk5OhCBgVBqGUWQK1VFxU01rtsJcJCaojdMJ2U46X_RWJKKjb3xtQ.Rw5PY-h3TJQIBBC_.8vm0uLL-tv4H06Qc4bmuO86punmbTRCcV8MjuzH74nTCZWMohaFPI6EUF4aPcWsiUFReoFPavSEBE172NbfTb_SYWN9inWMw_hzi-M2Jbn8Olt_wl6FiWCiPmqoelCjHe5CqrRnNMDQ1D4xWK_wmom8HVsYfwDgd2-VHM40I621ym9T-e_8LBTmSCJIjLfHOIIzZ8hwYCdOX80nyGeY9HGsSOS27Idpg8hwELpm9mBeufo_A1NtJGq3jLagr0Tyn_Vq3LNiAGizXHvbk49Si9VzrjwPtMUFnue1x6Bv6EZG5_sqx_X7Rim36eS3l85yblEVdQ0_MqY1XmUToyfOBDtc03k_D0lq9yXNRnj7QZQFNMp07mf9scvK7oF2kW-tIzuQMBwQ2-hXXCb7pGESM0bs.OR71etksu5R-LlSTO26YGQ",
      },
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
