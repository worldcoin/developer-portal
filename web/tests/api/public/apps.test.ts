import { GET } from "@/api/public/apps";
import { NextRequest } from "next/server";
import { getSdk as getAppMetadataSdk } from "../../../api/public/apps/graphql/get-app-metadata.generated";
import { getSdk as getAppRankingsSdk } from "../../../api/public/apps/graphql/get-app-rankings.generated";

// Mock the external dependencies
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

jest.mock(
  "../../../api/public/apps/graphql/get-app-metadata.generated",
  () => ({
    getSdk: jest.fn(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        ranked_apps: [],
        unranked_apps: [],
      }),
    })),
  }),
);
jest.mock(
  "../../../api/public/apps/graphql/get-app-rankings.generated",
  () => ({
    getSdk: jest.fn(() => ({
      GetAppRankings: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    })),
  }),
);

describe("/api/public/apps", () => {
  test("should return 400 for missing platform parameter", async () => {
    const request = new NextRequest(
      "http://localhost/api/public/apps?country=US",
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid or missing platform parameter. Must be 'web' or 'app'.",
    });
  });

  test("should handle empty rankings correctly", async () => {
    const request = new NextRequest(
      "http://localhost/api/public/apps?platform=web&country=US",
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ apps: [] });
  });

  test("should return 200 with non-empty rankings for valid platform and country parameters", async () => {
    // Mocking the response to simulate non-empty rankings
    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        ranked_apps: [{ appId: "1", name: "Test App" }],
        unranked_apps: [],
      }),
    }));

    jest.mocked(getAppRankingsSdk).mockImplementation(() => ({
      GetAppRankings: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [{ appId: "1" }] }],
      }),
    }));
    const request = new NextRequest(
      "http://localhost/api/public/apps?platform=app&country=US",
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      apps: [{ appId: "1", name: "Test App" }],
    });
  });
});

