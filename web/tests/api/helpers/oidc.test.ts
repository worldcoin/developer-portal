import { authenticateOIDCEndpoint } from "@/api/helpers/oidc";

// #region Mocks
const mockFetchAppSecret = jest.fn();

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock(
  "@/api/helpers/oidc/graphql/fetch-app-secret-query.generated",
  () => ({
    getSdk: () => ({
      FetchAppSecret: mockFetchAppSecret,
    }),
  }),
);

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const basicAuth = (appId: string, secret: string) =>
  `Basic ${Buffer.from(`${appId}:${secret}`).toString("base64")}`;
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
});

// #region OIDC endpoint authentication
describe("authenticateOIDCEndpoint", () => {
  it("rejects apps excluded from active app secret lookup", async () => {
    mockFetchAppSecret.mockResolvedValue({ app: [] });

    const result = await authenticateOIDCEndpoint(
      basicAuth("app_11223344556677889900aabbccddeeff", "secret"),
    );

    expect(result).toBeNull();
    expect(mockFetchAppSecret).toHaveBeenCalledWith({
      app_id: "app_11223344556677889900aabbccddeeff",
    });
  });
});
// #endregion
