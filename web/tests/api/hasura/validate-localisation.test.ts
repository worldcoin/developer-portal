import { POST } from "@/api/hasura/validate-localisation";
import { NextRequest } from "next/server";

// #region Mocks
const GetLocales = jest.fn();
jest.mock(
  "@/api/hasura/validate-localisation/graphql/get-locales.generated",
  () => ({
    getSdk: () => ({ GetLocales }),
  }),
);

const GetLocalisations = jest.fn();
jest.mock(
  "@/api/hasura/validate-localisation/graphql/get-localisations.generated",
  () => ({ getSdk: () => ({ GetLocalisations }) }),
);

jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn().mockResolvedValue({}),
}));

jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
// #endregion

// #region Test Data
const appMetadataId = "meta_0123456789abcdef0123456789abcdef";
const teamId = "team_0123456789abcdef0123456789abcdef";
const userId = "usr_0123456789abcdef0123456789abcdef";

const createMockRequest = () =>
  new NextRequest(
    `http://localhost:3000/api/hasura/validate-localisation?app_metadata_id=${appMetadataId}&team_id=${teamId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.INTERNAL_ENDPOINTS_SECRET}`,
      },
      body: JSON.stringify({
        action: { name: "validate_localisation" },
        session_variables: {
          "x-hasura-role": "user",
          "x-hasura-user-id": userId,
        },
      }),
    },
  );
// #endregion

beforeEach(() => {
  jest.clearAllMocks();
  process.env.INTERNAL_ENDPOINTS_SECRET = "internal-secret";
  GetLocalisations.mockResolvedValue({ localisations: [] });
});

// #region App access
describe("/api/hasura/validate-localisation [app access]", () => {
  it("checks access before reading localisations", async () => {
    GetLocales.mockResolvedValue({ app_metadata: [] });

    const response = (await POST(createMockRequest()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      extensions: { code: "not_found" },
    });
    expect(GetLocales).toHaveBeenCalledWith({
      id: appMetadataId,
      team_id: teamId,
      user_id: userId,
    });
    expect(GetLocalisations).not.toHaveBeenCalled();
  });

  it("validates localisations for an authorized app", async () => {
    GetLocales.mockResolvedValue({
      app_metadata: [
        { supported_languages: ["en", "es"], app_mode: "mini-app" },
      ],
    });

    const response = (await POST(createMockRequest()))!;

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      extensions: { code: "missing_localisation" },
    });
    expect(GetLocalisations).toHaveBeenCalledWith({
      app_metadata_id: appMetadataId,
    });
  });
});
// #endregion
