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

beforeEach(() => {
  jest.resetAllMocks();
});

describe("/api/public/apps", () => {
  test("should return 400 for missing platform parameter", async () => {
    const request = new NextRequest(
      "https://cdn.test.com/api/public/apps?country=US",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );
    const response = await GET(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid or missing platform parameter. Must be 'web' or 'app'.",
    });
  });

  test("should handle empty rankings correctly", async () => {
    jest.mocked(getAppRankingsSdk).mockImplementation(() => ({
      GetAppRankings: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    }));

    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        ranked_apps: [],
        unranked_apps: [],
      }),
    }));

    const request = new NextRequest(
      "https://cdn.test.com/api/public/apps?platform=web&country=US",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ apps: [] });
  });

  test("should return 200 with non-empty rankings for valid platform and country parameters", async () => {
    // Mocking the response to simulate non-empty rankings
    jest.mocked(getAppRankingsSdk).mockImplementation(() => ({
      GetAppRankings: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: ["2", "1", "3"] }],
      }),
    }));

    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        ranked_apps: [
          {
            app_id: "1",
            name: "Test App",
            logo_img_url: "logo.png",
          },
          {
            app_id: "2",
            name: "Test App2",
            logo_img_url: "logo.png",
          },
          {
            app_id: "3",
            name: "Test App3",
            logo_img_url: "logo.png",
          },
        ],
        unranked_apps: [],
      }),
    }));

    const request = new NextRequest(
      "https://cdn.test.com/api/public/apps?platform=app&country=US",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );
    const response = await GET(request);

    expect(await response.json()).toEqual({
      apps: [
        {
          app_id: "2",
          name: "Test App2",
          logo_img_url: "https://cdn.test.com/2/logo.png",
        },
        {
          app_id: "1",
          name: "Test App",
          logo_img_url: "https://cdn.test.com/1/logo.png",
        },
        {
          app_id: "3",
          name: "Test App3",
          logo_img_url: "https://cdn.test.com/3/logo.png",
        },
      ],
    });
  });
});
