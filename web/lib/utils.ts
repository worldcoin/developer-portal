import { Role_Enum } from "@/graphql/graphql";
import { LegacyVerificationLevel } from "@/lib/idkit";
import { Auth0EmailUser, Auth0User } from "@/lib/types";
import {
  DOCUMENT_SEQUENCER,
  DOCUMENT_SEQUENCER_STAGING,
  FACE_SEQUENCER,
  FACE_SEQUENCER_STAGING,
  ORB_SEQUENCER,
  ORB_SEQUENCER_STAGING,
  PARTNER_TEAM_IDS,
  PHONE_SEQUENCER,
  PHONE_SEQUENCER_STAGING,
  SECURE_DOCUMENT_SEQUENCER,
  SECURE_DOCUMENT_SEQUENCER_STAGING,
} from "./constants";
import { Auth0SessionUser } from "./types";

/**
 * Sequencer mapping
 * @param verificationLevel - The verification level to get the sequencer for
 * @returns The sequencer for the verification level
 */
export const sequencerMapping: Record<
  LegacyVerificationLevel,
  { [key: string]: string | undefined }
> = {
  [LegacyVerificationLevel.Orb]: {
    true: ORB_SEQUENCER_STAGING,
    false: ORB_SEQUENCER,
  },
  [LegacyVerificationLevel.Device]: {
    true: PHONE_SEQUENCER_STAGING,
    false: PHONE_SEQUENCER,
  },
  [LegacyVerificationLevel.Document]: {
    true: DOCUMENT_SEQUENCER_STAGING,
    false: DOCUMENT_SEQUENCER,
  },
  [LegacyVerificationLevel.SecureDocument]: {
    true: SECURE_DOCUMENT_SEQUENCER_STAGING,
    false: SECURE_DOCUMENT_SEQUENCER,
  },
  [LegacyVerificationLevel.Face]: {
    true: FACE_SEQUENCER_STAGING,
    false: FACE_SEQUENCER,
  },
};

/**
 * Validates a string is a valid URL
 * @param candidate
 * @returns
 */
export const validateUrl = (candidate: string, isStaging: boolean): boolean => {
  let parsedUrl;
  try {
    parsedUrl = new URL(candidate);
  } catch (_) {
    return false;
  }

  const isLocalhost = parsedUrl.hostname === "localhost";
  const isHttps = parsedUrl.protocol === "https:";

  if (!isLocalhost) {
    return isHttps;
  }

  // If the URL is localhost, we only allow it if we're in a staging environment
  if (!isStaging) return false;

  const localhostRegex =
    /^https?:\/\/localhost(:[0-9]+)?(\/[^\s?]*)(\\?[^\s]*)?$/;

  return localhostRegex.test(candidate);
};

/**
 * Validates the string looks like a valid email address
 * @param candidate
 * @returns
 */
export const validateEmail = (candidate: string): boolean => {
  return Boolean(
    candidate.match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    ),
  );
};

const URI_SCHEME_REGEX = /^([a-z][a-z0-9+.-]*):/i;
const DISALLOWED_SCHEMES = new Set([
  // iOS/Android-specific schemes that can lead to system UI or settings
  "intent",
  "market",
  "itms",
  "itmss",
  "itms-apps",
  "itms-services",
  "itms-beta",
  // Web/execution vectors to prevent XSS-style payloads
  "javascript",
  "data",
  "vbscript",
]);

/**
 * Validates generic URIs, supporting custom schemes while blocking known-dangerous ones.
 * Mirrors validateUrl() for https/http, but is permissive of allowlisted custom schemes.
 */
export const validateUri = (candidate: string, isStaging: boolean): boolean => {
  const value = candidate?.trim();
  if (!value) return false;

  // Reject control characters/newlines to avoid smuggling
  if (/[\u0000-\u001F\u007F]/.test(value)) return false;

  const match = value.match(URI_SCHEME_REGEX);
  if (!match) return false;

  const scheme = match[1].toLowerCase();
  if (DISALLOWED_SCHEMES.has(scheme)) return false;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  const protocol = parsed.protocol.toLowerCase();
  const isHttps = protocol === "https:";
  const isHttp = protocol === "http:";
  const isLocalhost = parsed.hostname === "localhost";

  if (isHttps) return true;
  if (isHttp) return isStaging && isLocalhost;

  // Custom scheme: scheme grammar already enforced; allow any target (host or path)
  return true;
};

/**
 * Parses a canonical dotted-decimal IPv4 string into its four octets.
 * Returns null when the value is not a plain dotted-decimal IPv4 literal.
 *
 * The WHATWG URL parser already canonicalizes alternate IPv4 encodings
 * (hex `0x7f000001`, octal `0177.0.0.1`, decimal `2130706433`, shorthand
 * `127.1`, bare integers) to dotted-decimal in `URL.hostname`, so only the
 * canonical form needs to be handled here.
 */
const parseIPv4Octets = (host: string): number[] | null => {
  const parts = host.split(".");
  if (parts.length !== 4) return null;

  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    octets.push(value);
  }
  return octets;
};

/**
 * True when an IPv4 address falls in a loopback, private, link-local, or other
 * non-public range that a webhook target must never point at.
 */
const isBlockedIPv4 = (octets: number[]): boolean => {
  const [a, b] = octets;

  if (a === 0) return true; // 0.0.0.0/8 "this host"
  if (a === 10) return true; // 10.0.0.0/8 private
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. cloud metadata 169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 private

  return false;
};

/**
 * Extracts the embedded IPv4 address from an IPv4-mapped IPv6 literal
 * (`::ffff:a.b.c.d`). `URL.hostname` canonicalizes the trailing IPv4 to two hex
 * groups (e.g. `::ffff:7f00:1`), so both the dotted and the hex forms are
 * handled. Requires the `::ffff:` marker so only genuine IPv4-mapped addresses
 * match; the deprecated IPv4-compatible form (`::a.b.c.d`) and other `::/96`
 * literals are handled by isBlockedIPv6's `::/96` rule instead.
 */
const extractEmbeddedIPv4 = (addr: string): number[] | null => {
  const dotted = addr.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted) return parseIPv4Octets(dotted[1]);

  const mapped = addr.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) {
    const hi = parseInt(mapped[1], 16);
    const lo = parseInt(mapped[2], 16);
    return [(hi >> 8) & 0xff, hi & 0xff, (lo >> 8) & 0xff, lo & 0xff];
  }
  return null;
};

/**
 * True when an IPv6 address (without surrounding brackets) is loopback,
 * unspecified, unique-local, link-local, an IPv4-mapped address that itself
 * points at a blocked IPv4 range, or any other `::/96` literal.
 */
const isBlockedIPv6 = (host: string): boolean => {
  const addr = host.toLowerCase();

  if (addr === "::" || addr === "::1") return true; // unspecified / loopback

  // IPv4-mapped (::ffff:a.b.c.d): block based on the embedded IPv4.
  const embedded = extractEmbeddedIPv4(addr);
  if (embedded) return isBlockedIPv4(embedded);

  // ::/96 (first 96 bits zero) covers the unspecified range and the deprecated
  // IPv4-compatible form (::a.b.c.d, which URL canonicalizes to ::hhhh:hhhh —
  // e.g. ::127.0.0.1 -> ::7f00:1). None of it is publicly routable, so block
  // the whole range: "::" followed by at most the low 32 bits (<=2 hextets or a
  // dotted quad).
  if (
    /^::([0-9a-f]{1,4}(:[0-9a-f]{1,4})?|\d{1,3}(\.\d{1,3}){3})?$/.test(addr)
  ) {
    return true;
  }

  const firstHextet = addr.split(":")[0];
  if (firstHextet) {
    const value = parseInt(firstHextet, 16);
    if (!Number.isNaN(value)) {
      if (value >= 0xfc00 && value <= 0xfdff) return true; // fc00::/7 unique-local
      if (value >= 0xfe80 && value <= 0xfebf) return true; // fe80::/10 link-local
      if (value >= 0xfec0 && value <= 0xfeff) return true; // fec0::/10 deprecated site-local
    }
  }
  return false;
};

/**
 * True when the string contains an ASCII control character (0x00-0x1F) or DEL
 * (0x7F). Used to reject request/header smuggling attempts in a webhook URL.
 */
const containsControlCharacter = (value: string): boolean => {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
};

/**
 * Validates a partner action webhook URL before it is stored.
 *
 * app-backend later fetches this value server-side and POSTs the (RSA-encrypted)
 * proof payload to it, so an attacker-controlled URL is a Server-Side Request
 * Forgery (SSRF) sink (VULN-6369 / CE25-C014). This is the write-layer denylist:
 * it requires HTTPS and rejects literal loopback, private, link-local, cloud
 * metadata, and IPv6 loopback/unique-local/link-local targets — including
 * alternate IPv4 encodings and IPv4-mapped IPv6 that `URL` canonicalizes.
 *
 * This does NOT resolve DNS: a hostname that resolves to a private address, and
 * DNS-rebinding between validation and fetch, must be defended at egress time in
 * app-backend, which is the component that performs the request.
 */
export const validateWebhookUrl = (candidate: string): boolean => {
  const value = candidate?.trim();
  if (!value) return false;

  // Reject control characters / newlines to avoid request or header smuggling.
  if (containsControlCharacter(value)) return false;

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  // Webhooks carry sensitive proof payloads and are fetched server-side, so
  // require HTTPS regardless of environment.
  if (parsed.protocol !== "https:") return false;

  // `URL.hostname` keeps the brackets around IPv6 literals; strip them. Also
  // strip a trailing "root" dot: URL preserves it on names (`localhost.`,
  // `foo.localhost.`) though not on IPs, and a resolver may treat the
  // root-qualified special-use name as loopback — normalize before the checks.
  const hostname = parsed.hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.+$/, "")
    .toLowerCase();
  if (!hostname) return false;

  // Block localhost by name (and any *.localhost subdomain).
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return false;
  }

  const ipv4 = parseIPv4Octets(hostname);
  if (ipv4) return !isBlockedIPv4(ipv4);

  if (hostname.includes(":")) return !isBlockedIPv6(hostname);

  // A DNS name that is not a literal IP — allowed at the write layer.
  return true;
};

/**
 * Checks if the code is running in the server
 * @returns True if the code is running in the server, false otherwise
 */
export const isSSR = () => typeof window === "undefined";

/**
 * Checks if a user is an email user
 * @param user - The user to check
 */
export const isEmailUser = (user: Auth0User): user is Auth0EmailUser =>
  user.sub.startsWith("email|");
/**
 * Gets the CDN image URL
 * @param app_id - The ID of the app
 * @param path - The path to the image
 * @param isAppVerified - Whether the app is verified
 * @param locale - Optional locale for localized images
 * @returns The CDN image URL
 */
export const getCDNImageUrl = (
  app_id: string,
  path: string,
  isAppVerified = true,
  locale?: string,
) =>
  isAppVerified
    ? `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/${app_id}${locale && locale !== "en" ? `/${locale}` : ""}/${path}`
    : `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/unverified/${app_id}${locale && locale !== "en" ? `/${locale}` : ""}/${path}`;

export const getDefaultLogoImgCDNUrl = () => {
  return `${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}/default/default-logo-image.png`;
};

/**
 * Gets the logo image CDN URL
 * @param app_id - The ID of the app
 * @param path - The path to the logo image
 * @param isAppVerified - Whether the app is verified
 * @returns The logo image CDN URL
 */
export const getLogoImgCDNUrl = (
  app_id: string,
  path: string,
  isAppVerified = true,
) => {
  if (!path) {
    return getDefaultLogoImgCDNUrl();
  }
  return getCDNImageUrl(app_id, path, isAppVerified);
};

/**
 * Checks if a user has the required roles
 * @param user - The user to check
 * @param teamId - The ID of the team to check
 * @param validRoles - The roles to check for
 * @returns True if the user has the required roles, false otherwise
 */
export const checkUserPermissions = (
  user: Auth0SessionUser["user"],
  teamId: string,
  validRoles: Role_Enum[] | string[],
) => {
  const membership = user?.hasura?.memberships.find(
    (m) => m.team?.id == teamId,
  );

  if (!membership) {
    return false;
  }
  return validRoles.includes(membership?.role);
};

/**
 * Gets the nullifier name
 * @param nullifier - The nullifier to get the name of
 * @returns The nullifier name
 */
export const getNullifierName = (nullifier: string | undefined | null) => {
  if (!nullifier) return null;
  return `${nullifier.slice(0, 6)}...${nullifier.slice(-4)}`;
};

/**
 * Truncates a string
 * @param str - The string to truncate
 * @param length - The length to truncate the string to
 * @returns The truncated string
 */
export const truncateString = (
  str: string | undefined | null,
  length: number,
) => {
  if (!str) {
    return "";
  }

  if (str.length <= length) {
    return str;
  }

  return `${str.slice(0, length)}...`;
};

/**
 * Validates the host name of a request
 * @param request - The request to validate
 * @returns True if the host name is valid, false otherwise
 */
export const isValidHostName = (request: Request) => {
  const hostName =
    request.headers.get("host") || request.headers.get(":authority");

  if (!hostName) {
    return false;
  }

  // Skip check for development and staging (staging may not have custom domains)
  // TODO(CORPLAT-689): Remove staging bypass after DNS cutover
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_APP_ENV === "staging"
  ) {
    return true;
  }
  const cdnHost = process.env.NEXT_PUBLIC_IMAGES_CDN_URL;
  if (!cdnHost) {
    return false;
  }

  // env var may be a full URL ("https://cdn.example.com") or a bare host ("cdn.example.com");
  // compare hostnames only (port-insensitive) since the Host header may or may not include a port
  const stripPort = (h: string) => h.replace(/:\d+$/, "");
  let cdnHostName: string;
  if (cdnHost.includes("://")) {
    try {
      cdnHostName = new URL(cdnHost).hostname;
    } catch {
      return false;
    }
  } else {
    cdnHostName = stripPort(cdnHost);
  }

  return cdnHostName !== "" && cdnHostName === stripPort(hostName);
};

/**
 * Creates a localise category
 * @param category - The category to create a localise category for
 * @returns The localise category
 */
export const createLocaliseCategory = (category: string) => {
  return `world_id_partner_category_${category.toLowerCase()}`;
};

export const createLocaliseField = (appId: string, field: string) => {
  return `world_id_partner_${appId}_${field}`;
};

/**
 * Converts the stringified array of string arrays to a format that can be used in a query
 * @param stringifiedArray - The stringified array of string arrays to convert
 * @returns The converted array
 */
export const formatMultipleStringInput = (
  stringifiedArray: string | null | undefined,
) => {
  if (!stringifiedArray) return null;

  const formattedArray = `{${stringifiedArray
    .split(",")
    .map((str) => str.trim())
    .filter((str) => str.length > 0) // Remove empty strings
    .map((str) => `"${str}"`)
    .join(",")}}`;

  return formattedArray;
};

/**
 * Converts an array to a Hasura array
 * @param array - The array to convert
 * @returns The converted array
 */
export const convertArrayToHasuraArray = (
  array: string[] | null | undefined,
) => {
  if (!array) return null;
  return `{${array.join(",")}}`;
};

/**
 * Creates a transaction hash URL
 * @param transactionHash - The transaction hash to create a URL for
 * @param network - The network to create a URL for
 * @returns The transaction hash URL
 */
export const createTransactionHashUrl = (
  transactionHash: string | null,
  network: string,
) => {
  if (!transactionHash) return "";
  if (network === "optimism") {
    return `https://optimistic.etherscan.io/tx/${transactionHash}`;
  }
  if (network === "worldchain") {
    return `https://worldscan.org/tx/${transactionHash}`;
  }
  return "Invalid network";
};

/**
 * Tries to parse a JSON string
 * @param input - The string to parse
 * @returns The parsed JSON object or null if the string is not a valid JSON
 */
export const tryParseJSON = <T extends {}>(
  input: string | null | undefined,
): T | null => {
  if (!input) return null;
  try {
    const o = JSON.parse(input);

    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {
    console.warn("Error parsing JSON", { error: JSON.stringify(e), input });
    return null;
  }

  return null;
};

/**
 * Gets the file type of an image
 * @param imageType - The type of image to get the file type of
 * @returns The file type of the image
 */
export const getImageEndpoint = (imageType: string) => {
  const fileType = imageType.split(".").pop();
  if (fileType === "png" || fileType === "jpg") {
    return fileType;
  } else {
    throw new Error("Unsupported image file type");
  }
};

/**
 * Checks if a team is a partner team
 * @param teamId - The ID of the team to check
 * @returns True if the team is a partner team, false otherwise
 */
export const checkIfPartnerTeam = (teamId: string) => {
  const envTeamIds =
    PARTNER_TEAM_IDS[
      process.env.NEXT_PUBLIC_APP_ENV as keyof typeof PARTNER_TEAM_IDS
    ];

  // Always return true if it's a staging app
  if (process.env.NEXT_PUBLIC_APP_ENV === "staging") {
    return true;
  }
  return envTeamIds.includes(teamId);
};

/**
 * Checks if the app is in a production environment
 */
export const checkIfProduction = (): boolean => {
  return process.env.NEXT_PUBLIC_APP_ENV === "production";
};

/**
 * Fetch request with timeout
 * @param url - The URL to fetch
 * @param options - The options to pass to the fetch request
 * @param fetchTimeoutInMS - The timeout in milliseconds
 * @param fetchFunction - The function to use to fetch the request
 * @returns
 */
export const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  fetchTimeoutInMS: number = DEFAULT_FETCH_TIMEOUT,
  fetchFunction: (
    url: string,
    options: RequestInit,
  ) => Promise<Response> = fetch,
): Promise<Response> => {
  const controller = new AbortController();
  const promise = fetchFunction(url, {
    signal: controller.signal,
    ...options,
  });
  const timeout = setTimeout(() => controller.abort(), fetchTimeoutInMS);
  return promise.finally(() => clearTimeout(timeout));
};

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_RETRY_DELAY = 500;
const DEFAULT_FETCH_TIMEOUT = 5000;

export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  initialRetryDelayInMS: number = DEFAULT_INITIAL_RETRY_DELAY,
  fetchTimeoutInMS: number = DEFAULT_FETCH_TIMEOUT,
  throwOnError: boolean = true,
  fetchFunction: (
    url: string,
    options: RequestInit,
  ) => Promise<Response> = fetch,
): Promise<Response> => {
  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      lastResponse = await fetchWithTimeout(
        url,
        options,
        fetchTimeoutInMS,
        fetchFunction,
      );
      if (lastResponse.ok) {
        return lastResponse;
      }
      lastError = new Error(`HTTP status ${lastResponse.status}`);
      // Retry transient statuses only: 5xx, plus 408 (timeout) and 429 (rate limit).
      // Other 4xx are definitive client errors — surface them immediately.
      const isRetryableStatus =
        lastResponse.status >= 500 ||
        lastResponse.status === 408 ||
        lastResponse.status === 429;
      if (!isRetryableStatus) {
        break;
      }
    } catch (error) {
      lastError = error as Error;
      lastResponse = null;
    }

    if (attempt < maxRetries - 1) {
      const delay = initialRetryDelayInMS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  if (!throwOnError) {
    // Return a Response-like object with failure info
    return (
      lastResponse ||
      new Response(
        JSON.stringify({ error: lastError?.message || "Unknown error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    );
  }

  throw lastError;
};
