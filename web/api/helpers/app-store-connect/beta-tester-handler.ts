import "server-only";

import { importPKCS8, SignJWT } from "jose";
import { getAppStoreConnectConfig, type AppStoreConnectConfig } from "./config";

const APP_STORE_CONNECT_API_URL = "https://api.appstoreconnect.apple.com/v1";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_IDEMPOTENT_ATTEMPTS = 3;
const MAX_ERROR_BODY_LENGTH = 2_000;

type ResourceLinkage = { type: string; id: string };
type BetaTesterResource = ResourceLinkage & {
  attributes?: { email?: string };
};
type ResourceList<T extends ResourceLinkage> = { data: T[] };

export class AppStoreConnectRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AppStoreConnectRequestError";
  }
}

const createToken = async (config: AppStoreConnectConfig) => {
  const signingKey = await importPKCS8(config.privateKey, "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: config.keyId, typ: "JWT" })
    .setIssuer(config.issuerId)
    .setAudience("appstoreconnect-v1")
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(signingKey);
};

const waitBeforeRetry = (attempt: number) =>
  new Promise<void>((resolve) => {
    const exponentialDelay = Math.min(1_000, 100 * 2 ** attempt);
    const jitter = Math.floor(Math.random() * 100);
    setTimeout(resolve, exponentialDelay + jitter);
  });

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

const summarizeErrorResponse = (responseBody: string) => {
  try {
    const parsed = JSON.parse(responseBody) as {
      errors?: Array<{ code?: unknown; status?: unknown; title?: unknown }>;
    };
    const summary = parsed.errors
      ?.slice(0, 3)
      .map((error) =>
        [error.status, error.code, error.title]
          .filter((value): value is string => typeof value === "string")
          .join(" "),
      )
      .filter(Boolean)
      .join("; ");

    return summary
      ?.replace(/[\u0000-\u001f\u007f]/g, " ")
      .slice(0, MAX_ERROR_BODY_LENGTH);
  } catch {
    return undefined;
  }
};

const requestAppStoreConnect = async <T>(params: {
  token: string;
  path: string;
  operation: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
  expectedStatuses: number[];
  idempotent?: boolean;
}): Promise<T | null> => {
  const method = params.method ?? "GET";
  const attempts = params.idempotent ? MAX_IDEMPOTENT_ATTEMPTS : 1;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(
        `${APP_STORE_CONNECT_API_URL}${params.path}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${params.token}`,
            Accept: "application/json",
            ...(params.body ? { "Content-Type": "application/json" } : {}),
          },
          body: params.body ? JSON.stringify(params.body) : undefined,
          cache: "no-store",
          signal: controller.signal,
        },
      );
      const responseBody = await response.text();

      if (params.expectedStatuses.includes(response.status)) {
        if (!responseBody) return null;

        try {
          return JSON.parse(responseBody) as T;
        } catch {
          throw new AppStoreConnectRequestError(
            `${params.operation} returned malformed JSON`,
            response.status,
          );
        }
      }

      if (
        params.idempotent &&
        isRetryableStatus(response.status) &&
        attempt + 1 < attempts
      ) {
        await waitBeforeRetry(attempt);
        continue;
      }

      const detail = summarizeErrorResponse(responseBody);
      throw new AppStoreConnectRequestError(
        `${params.operation} failed with HTTP ${response.status}${detail ? `: ${detail}` : ""}`,
        response.status,
      );
    } catch (error) {
      if (error instanceof AppStoreConnectRequestError) throw error;

      if (params.idempotent && attempt + 1 < attempts) {
        await waitBeforeRetry(attempt);
        continue;
      }

      const failureClass =
        error instanceof Error ? error.name : "UnknownNetworkError";
      throw new AppStoreConnectRequestError(
        `${params.operation} failed before receiving a response (${failureClass})`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppStoreConnectRequestError(
    `${params.operation} exhausted its retry budget`,
  );
};

const isResourceList = <T extends ResourceLinkage>(
  value: unknown,
): value is ResourceList<T> =>
  Boolean(
    value &&
      typeof value === "object" &&
      "data" in value &&
      Array.isArray(value.data) &&
      value.data.every(
        (item) =>
          item &&
          typeof item === "object" &&
          "id" in item &&
          typeof item.id === "string" &&
          "type" in item &&
          typeof item.type === "string",
      ),
  );

const requireResourceList = <T extends ResourceLinkage>(
  value: unknown,
  operation: string,
): ResourceList<T> => {
  if (!isResourceList<T>(value)) {
    throw new AppStoreConnectRequestError(
      `${operation} returned an unexpected response shape`,
    );
  }

  return value;
};

const createClient = async () => {
  const config = getAppStoreConnectConfig();
  const token = await createToken(config);

  const findTester = async (email: string) => {
    const search = new URLSearchParams({
      "filter[email]": email,
      limit: "2",
    });
    const response = await requestAppStoreConnect<
      ResourceList<BetaTesterResource>
    >({
      token,
      path: `/betaTesters?${search.toString()}`,
      operation: "List App Store Connect beta testers",
      expectedStatuses: [200],
      idempotent: true,
    });
    const testers = requireResourceList<BetaTesterResource>(
      response,
      "List App Store Connect beta testers",
    ).data;

    if (testers.length > 1) {
      throw new AppStoreConnectRequestError(
        "App Store Connect returned multiple beta testers for one email",
      );
    }

    return testers[0] ?? null;
  };

  const getTesterGroupIds = async (testerId: string) => {
    const response = await requestAppStoreConnect<
      ResourceList<ResourceLinkage>
    >({
      token,
      path: `/betaTesters/${encodeURIComponent(testerId)}/relationships/betaGroups?limit=200`,
      operation: "List App Store Connect beta tester groups",
      expectedStatuses: [200],
      idempotent: true,
    });

    return requireResourceList<ResourceLinkage>(
      response,
      "List App Store Connect beta tester groups",
    ).data.map((group) => group.id);
  };

  const groupLinkage = {
    data: [{ type: "betaGroups", id: config.betaGroupId }],
  };

  return {
    config,
    findTester,
    getTesterGroupIds,
    token,
    groupLinkage,
  };
};

/** Ensures an email is enrolled in the configured World ID Sandbox group. */
export const addSandboxBetaTester = async (email: string): Promise<void> => {
  const client = await createClient();
  let tester = await client.findTester(email);

  if (!tester) {
    try {
      await requestAppStoreConnect<{ data: BetaTesterResource }>({
        token: client.token,
        path: "/betaTesters",
        operation: "Create App Store Connect beta tester",
        method: "POST",
        body: {
          data: {
            type: "betaTesters",
            attributes: { email },
            relationships: { betaGroups: client.groupLinkage },
          },
        },
        expectedStatuses: [201],
      });
      return;
    } catch (error) {
      if (
        !(error instanceof AppStoreConnectRequestError) ||
        error.status !== 409
      ) {
        throw error;
      }

      // A concurrent approval may have created the tester after our lookup.
      tester = await client.findTester(email);
      if (!tester) throw error;
    }
  }

  const groupIds = await client.getTesterGroupIds(tester.id);
  if (groupIds.includes(client.config.betaGroupId)) return;

  await requestAppStoreConnect<never>({
    token: client.token,
    path: `/betaTesters/${encodeURIComponent(tester.id)}/relationships/betaGroups`,
    operation: "Add App Store Connect beta tester to sandbox group",
    method: "POST",
    body: client.groupLinkage,
    expectedStatuses: [204],
    idempotent: true,
  });
};

/** Removes an email from only the configured World ID Sandbox group. */
export const removeSandboxBetaTester = async (email: string): Promise<void> => {
  const client = await createClient();
  const tester = await client.findTester(email);
  if (!tester) return;

  await requestAppStoreConnect<never>({
    token: client.token,
    path: `/betaTesters/${encodeURIComponent(tester.id)}/relationships/betaGroups`,
    operation: "Remove App Store Connect beta tester from sandbox group",
    method: "DELETE",
    body: client.groupLinkage,
    // A concurrent retry may have already removed the relationship. In that
    // case 404 means the desired absent state has also been reached.
    expectedStatuses: [204, 404],
    idempotent: true,
  });
};
