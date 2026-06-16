import { GET } from "@/api/v4/app-status/[id]";
import { NextRequest } from "next/server";

// #region Mocks
const GetAppStatusByAppId = jest.fn();
const GetAppStatusByRpId = jest.fn();

jest.mock("../../../lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock(
  "../../../api/v4/app-status/[id]/graphql/get-app-status.generated",
  () => ({
    getSdk: () => ({
      GetAppStatusByAppId,
      GetAppStatusByRpId,
    }),
  }),
);

jest.mock("../../../api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));
// #endregion

// #region Test Data
const appId = "app_0123456789abcdef0123456789abcdef";
const rpId = "rp_abc123def4560000";

const createRequest = (id: string) =>
  new NextRequest(
    new URL(`/api/v4/app-status/${id}`, "http://localhost:3000"),
    { method: "GET" },
  );

const createContext = (id: string) => ({
  params: Promise.resolve({ id }),
});

const makeRegistration = (
  overrides: Partial<{
    verifiedMetadata: Array<{ id: string }>;
  }> = {},
) => {
  const { verifiedMetadata, ...registrationOverrides } = overrides;

  return {
    app: {
      verified_app_metadata: verifiedMetadata ?? [{ id: "meta_1" }],
    },
    ...registrationOverrides,
  };
};

const makeApp = (
  overrides: Partial<{
    verifiedMetadata: Array<{ id: string }>;
  }> = {},
) => {
  const { verifiedMetadata, ...appOverrides } = overrides;

  return {
    verified_app_metadata: verifiedMetadata ?? [{ id: "meta_1" }],
    ...appOverrides,
  };
};
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region Successful lookups
describe("/api/v4/app-status/[id] [successful lookups]", () => {
  it("looks up app status by app_id", async () => {
    GetAppStatusByAppId.mockResolvedValue({
      app_by_pk: makeApp(),
    });

    const res = await GET(createRequest(appId), createContext(appId));

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe(
      "public, max-age=5, stale-if-error=300",
    );
    await expect(res.json()).resolves.toEqual({
      verified: true,
    });
    expect(GetAppStatusByAppId).toHaveBeenCalledWith({
      app_id: appId,
    });
    expect(GetAppStatusByRpId).not.toHaveBeenCalled();
  });

  it("looks up app status by rp_id", async () => {
    GetAppStatusByRpId.mockResolvedValue({
      rp_registration: [makeRegistration()],
    });

    const res = await GET(createRequest(rpId), createContext(rpId));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      verified: true,
    });
    expect(GetAppStatusByRpId).toHaveBeenCalledWith({
      rp_id: rpId,
    });
    expect(GetAppStatusByAppId).not.toHaveBeenCalled();
  });

  it("returns verified true when verified app_metadata exists", async () => {
    GetAppStatusByAppId.mockResolvedValue({
      app_by_pk: makeApp({ verifiedMetadata: [{ id: "meta_verified" }] }),
    });

    const res = await GET(createRequest(appId), createContext(appId));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(true);
  });

  it("returns verified false when verified app_metadata is absent", async () => {
    GetAppStatusByAppId.mockResolvedValue({
      app_by_pk: makeApp({ verifiedMetadata: [] }),
    });

    const res = await GET(createRequest(appId), createContext(appId));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.verified).toBe(false);
  });

  it("returns verified true for app_id even when no rp_registration exists", async () => {
    GetAppStatusByAppId.mockResolvedValue({
      app_by_pk: makeApp(),
    });

    const res = await GET(createRequest(appId), createContext(appId));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      verified: true,
    });
  });
});
// #endregion

// #region Error cases
describe("/api/v4/app-status/[id] [error cases]", () => {
  it("returns 400 for invalid id format", async () => {
    const res = await GET(
      createRequest("app_invalid"),
      createContext("app_invalid"),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: "invalid_id",
      attribute: "id",
    });
    expect(GetAppStatusByAppId).not.toHaveBeenCalled();
    expect(GetAppStatusByRpId).not.toHaveBeenCalled();
  });

  it("returns 404 when app_id does not exist", async () => {
    GetAppStatusByAppId.mockResolvedValue({
      app_by_pk: null,
    });

    const res = await GET(createRequest(appId), createContext(appId));

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      code: "not_found",
      attribute: "id",
    });
  });

  it("returns 404 when rp_id registration does not exist", async () => {
    GetAppStatusByRpId.mockResolvedValue({
      rp_registration: [],
    });

    const res = await GET(createRequest(rpId), createContext(rpId));

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      code: "not_found",
      attribute: "id",
    });
  });
});
// #endregion
