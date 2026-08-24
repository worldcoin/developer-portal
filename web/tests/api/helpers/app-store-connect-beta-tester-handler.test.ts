import {
  addSandboxBetaTester,
  AppStoreConnectRequestError,
  removeSandboxBetaTester,
} from "@/api/helpers/app-store-connect/beta-tester-handler";
import {
  AppStoreConnectConfigurationError,
  getAppStoreConnectConfig,
} from "@/api/helpers/app-store-connect/config";
import { exportPKCS8, generateKeyPair } from "jose";

// #region Test Data
const ENV_KEYS = [
  "APP_STORE_CONNECT_API_KEY_ID",
  "APP_STORE_CONNECT_ISSUER_ID",
  "APP_STORE_CONNECT_API_KEY_CONTENT",
  "APP_STORE_CONNECT_BETA_GROUP_ID",
] as const;
const originalEnv = Object.fromEntries(
  ENV_KEYS.map((key) => [key, process.env[key]]),
);
const fetchMock = jest.fn();

const response = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
  });

const testerList = (ids: string[]) => ({
  data: ids.map((id) => ({
    type: "betaTesters",
    id,
    attributes: { email: "tester@example.com" },
  })),
});

const groupList = (ids: string[]) => ({
  data: ids.map((id) => ({ type: "betaGroups", id })),
});
// #endregion

beforeAll(async () => {
  const { privateKey } = await generateKeyPair("ES256");
  process.env.APP_STORE_CONNECT_API_KEY_CONTENT = await exportPKCS8(privateKey);
});

beforeEach(() => {
  jest.clearAllMocks();
  process.env.APP_STORE_CONNECT_API_KEY_ID = "KEY123";
  process.env.APP_STORE_CONNECT_ISSUER_ID = "issuer-123";
  process.env.APP_STORE_CONNECT_BETA_GROUP_ID = "group-sandbox";
  global.fetch = fetchMock as unknown as typeof fetch;
});

afterAll(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

// #region Configuration
describe("App Store Connect configuration", () => {
  it("decodes escaped private-key newlines", () => {
    process.env.APP_STORE_CONNECT_API_KEY_CONTENT =
      process.env.APP_STORE_CONNECT_API_KEY_CONTENT!.replace(/\n/g, "\\n");

    expect(getAppStoreConnectConfig().privateKey).toContain(
      "\n-----END PRIVATE KEY-----",
    );
  });

  it("fails closed when a required key is missing", async () => {
    delete process.env.APP_STORE_CONNECT_ISSUER_ID;

    await expect(addSandboxBetaTester("tester@example.com")).rejects.toThrow(
      AppStoreConnectConfigurationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when deployment omits the sandbox beta group", async () => {
    delete process.env.APP_STORE_CONNECT_BETA_GROUP_ID;

    await expect(addSandboxBetaTester("tester@example.com")).rejects.toThrow(
      "Missing App Store Connect configuration: APP_STORE_CONNECT_BETA_GROUP_ID",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
// #endregion

// #region Enrollment
describe("addSandboxBetaTester", () => {
  it("creates a new tester directly in the sandbox beta group", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, testerList([])))
      .mockResolvedValueOnce(
        response(201, {
          data: { type: "betaTesters", id: "tester-1" },
        }),
      );

    await addSandboxBetaTester("tester@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://api.appstoreconnect.apple.com/v1/betaTesters");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual(
      expect.objectContaining({
        Authorization: expect.stringMatching(/^Bearer /),
      }),
    );
    expect(JSON.parse(String(init.body))).toEqual({
      data: {
        type: "betaTesters",
        attributes: { email: "tester@example.com" },
        relationships: {
          betaGroups: {
            data: [{ type: "betaGroups", id: "group-sandbox" }],
          },
        },
      },
    });
  });

  it("adds an existing tester when they are not yet in the group", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, testerList(["tester-1"])))
      .mockResolvedValueOnce(response(200, groupList([])))
      .mockResolvedValueOnce(response(204));

    await addSandboxBetaTester("tester@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [url, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toBe(
      "https://api.appstoreconnect.apple.com/v1/betaTesters/tester-1/relationships/betaGroups",
    );
    expect(init.method).toBe("POST");
  });

  it("recovers when another approval creates the tester concurrently", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, testerList([])))
      .mockResolvedValueOnce(
        response(409, {
          errors: [{ code: "ENTITY_ERROR.RELATIONSHIP.INVALID" }],
        }),
      )
      .mockResolvedValueOnce(response(200, testerList(["tester-1"])))
      .mockResolvedValueOnce(response(200, groupList([])))
      .mockResolvedValueOnce(response(204));

    await addSandboxBetaTester("tester@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("does nothing when the tester is already enrolled", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, testerList(["tester-1"])))
      .mockResolvedValueOnce(response(200, groupList(["group-sandbox"])));

    await addSandboxBetaTester("tester@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries a transient upstream 5xx with a bounded budget", async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(503, { errors: [{ code: "UNAVAILABLE" }] }),
      )
      .mockResolvedValueOnce(response(200, testerList([])))
      .mockResolvedValueOnce(
        response(201, {
          data: { type: "betaTesters", id: "tester-1" },
        }),
      );

    await addSandboxBetaTester("tester@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("surfaces network failures after the retry budget is exhausted", async () => {
    fetchMock.mockRejectedValue(new Error("socket timeout"));

    await expect(
      addSandboxBetaTester("tester@example.com"),
    ).rejects.toBeInstanceOf(AppStoreConnectRequestError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
// #endregion

// #region Removal
describe("removeSandboxBetaTester", () => {
  it("removes an enrolled tester from only the sandbox group", async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, testerList(["tester-1"])))
      .mockResolvedValueOnce(response(200, groupList(["group-sandbox"])))
      .mockResolvedValueOnce(response(204));

    await removeSandboxBetaTester("tester@example.com");

    const [url, init] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toBe(
      "https://api.appstoreconnect.apple.com/v1/betaTesters/tester-1/relationships/betaGroups",
    );
    expect(init.method).toBe("DELETE");
    expect(JSON.parse(String(init.body))).toEqual({
      data: [{ type: "betaGroups", id: "group-sandbox" }],
    });
  });

  it("does nothing when the email has no App Store Connect tester", async () => {
    fetchMock.mockResolvedValueOnce(response(200, testerList([])));

    await removeSandboxBetaTester("tester@example.com");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
// #endregion
