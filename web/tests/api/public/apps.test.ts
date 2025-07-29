import { GET } from "@/api/public/apps";
import { AppLocaliseKeys } from "@/lib/types";
import { createLocaliseCategory, createLocaliseField } from "@/lib/utils";
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
    expect(await response.json()).toEqual({ apps: [], featured: [] });
  });

  test("Valid app platform and country parameters", async () => {
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
            hero_image_url: "",
            showcase_img_urls: ["showcase1.png"],
            category: "social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "external",
            description: {
              how_it_works: "23423",
              how_to_connect: "4fwfewf",
              overview: "random string",
            },
            app: {
              team: {
                name: "Example Team",
              },
            },
          },
          {
            app_id: "2",
            name: "Test App2",
            logo_img_url: "logo.png",
            hero_image_url: "",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            category: "social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "external",
            description: {
              how_it_works: "fwefw",
              how_to_connect: "fewfw",
              overview: "fwefew",
            },
            app: {
              team: {
                name: "Example Team",
              },
            },
          },
          {
            app_id: "3",
            name: "Test App3",
            logo_img_url: "logo.png",
            hero_image_url: "",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "external",
            showcase_img_urls: [
              "showcase1.png",
              "showcase2.png",
              "showcase3.png",
            ],
            category: "social",
            description: {
              how_it_works: "random",
              how_to_connect: "random",
              overview: "random",
            },
            app: {
              team: {
                name: "Example Team",
              },
            },
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
      featured: [],
      apps: [
        {
          app_id: "2",
          name: "Test App2",
          logo_img_url: "https://cdn.test.com/2/logo.png",
          hero_image_url: "",
          category: createLocaliseCategory("social"),
          whitelisted_addresses: ["0x1234", "0x5678"],
          app_mode: "external",
          description: {
            overview: createLocaliseField(
              "2",
              AppLocaliseKeys.description_overview,
            ),
            how_it_works: createLocaliseField(
              "2",
              AppLocaliseKeys.description_how_it_works,
            ),
            how_to_connect: createLocaliseField(
              "2",
              AppLocaliseKeys.description_connect,
            ),
          },
          showcase_img_urls: [
            "https://cdn.test.com/2/showcase1.png",
            "https://cdn.test.com/2/showcase2.png",
          ],
          team_name: "Example Team",
          world_app_button_text: createLocaliseField(
            "2",
            AppLocaliseKeys.world_app_button_text,
          ),
          world_app_description: createLocaliseField(
            "2",
            AppLocaliseKeys.world_app_description,
          ),
        },
        {
          app_id: "1",
          name: "Test App",
          logo_img_url: "https://cdn.test.com/1/logo.png",
          hero_image_url: "",
          showcase_img_urls: ["https://cdn.test.com/1/showcase1.png"],
          team_name: "Example Team",
          whitelisted_addresses: ["0x1234", "0x5678"],
          app_mode: "external",
          category: createLocaliseCategory("social"),
          description: {
            how_it_works: createLocaliseField(
              "1",
              AppLocaliseKeys.description_how_it_works,
            ),
            how_to_connect: createLocaliseField(
              "1",
              AppLocaliseKeys.description_connect,
            ),
            overview: createLocaliseField(
              "1",
              AppLocaliseKeys.description_overview,
            ),
          },
          world_app_button_text: createLocaliseField(
            "1",
            AppLocaliseKeys.world_app_button_text,
          ),
          world_app_description: createLocaliseField(
            "1",
            AppLocaliseKeys.world_app_description,
          ),
        },
        {
          app_id: "3",
          name: "Test App3",
          logo_img_url: "https://cdn.test.com/3/logo.png",
          hero_image_url: "",
          showcase_img_urls: [
            "https://cdn.test.com/3/showcase1.png",
            "https://cdn.test.com/3/showcase2.png",
            "https://cdn.test.com/3/showcase3.png",
          ],
          whitelisted_addresses: ["0x1234", "0x5678"],
          app_mode: "external",
          category: createLocaliseCategory("social"),
          description: {
            how_it_works: createLocaliseField(
              "3",
              AppLocaliseKeys.description_how_it_works,
            ),
            how_to_connect: createLocaliseField(
              "3",
              AppLocaliseKeys.description_connect,
            ),
            overview: createLocaliseField(
              "3",
              AppLocaliseKeys.description_overview,
            ),
          },
          team_name: "Example Team",
          world_app_button_text: createLocaliseField(
            "3",
            AppLocaliseKeys.world_app_button_text,
          ),
          world_app_description: createLocaliseField(
            "3",
            AppLocaliseKeys.world_app_description,
          ),
        },
      ],
    });
  });

  test("Valid web platform and country parameters", async () => {
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
            hero_image_url: "",
            showcase_img_urls: ["showcase1.png"],
            category: "social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "external",
            description: {
              how_it_works: "23423",
              how_to_connect: "4fwfewf",
              overview: "random string",
            },
            app: {
              team: {
                name: "Example Team",
              },
            },
          },
          {
            app_id: "2",
            name: "Test App2",
            logo_img_url: "logo.png",
            hero_image_url: "",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            category: "social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "external",
            description: {
              how_it_works: "fwefw",
              how_to_connect: "fewfw",
              overview: "fwefew",
            },
            app: {
              team: {
                name: "Example Team",
              },
            },
          },
          {
            app_id: "3",
            name: "Test App3",
            logo_img_url: "logo.png",
            hero_image_url: "",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "external",
            showcase_img_urls: [
              "showcase1.png",
              "showcase2.png",
              "showcase3.png",
            ],
            category: "social",
            description: {
              how_it_works: "random",
              how_to_connect: "random",
              overview: "random",
            },
            app: {
              team: {
                name: "Example Team",
              },
            },
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
      featured: [],
      apps: [
        {
          app_id: "2",
          name: "Test App2",
          logo_img_url: "https://cdn.test.com/2/logo.png",
          hero_image_url: "",
          category: createLocaliseCategory("social"),
          whitelisted_addresses: ["0x1234", "0x5678"],
          app_mode: "external",
          description: {
            overview: createLocaliseField(
              "2",
              AppLocaliseKeys.description_overview,
            ),
            how_it_works: createLocaliseField(
              "2",
              AppLocaliseKeys.description_how_it_works,
            ),
            how_to_connect: createLocaliseField(
              "2",
              AppLocaliseKeys.description_connect,
            ),
          },
          showcase_img_urls: [
            "https://cdn.test.com/2/showcase1.png",
            "https://cdn.test.com/2/showcase2.png",
          ],
          team_name: "Example Team",
          world_app_button_text: createLocaliseField(
            "2",
            AppLocaliseKeys.world_app_button_text,
          ),
          world_app_description: createLocaliseField(
            "2",
            AppLocaliseKeys.world_app_description,
          ),
        },
        {
          app_id: "1",
          name: "Test App",
          logo_img_url: "https://cdn.test.com/1/logo.png",
          hero_image_url: "",
          showcase_img_urls: ["https://cdn.test.com/1/showcase1.png"],
          team_name: "Example Team",
          whitelisted_addresses: ["0x1234", "0x5678"],
          app_mode: "external",
          category: createLocaliseCategory("social"),
          description: {
            how_it_works: createLocaliseField(
              "1",
              AppLocaliseKeys.description_how_it_works,
            ),
            how_to_connect: createLocaliseField(
              "1",
              AppLocaliseKeys.description_connect,
            ),
            overview: createLocaliseField(
              "1",
              AppLocaliseKeys.description_overview,
            ),
          },
          world_app_button_text: createLocaliseField(
            "1",
            AppLocaliseKeys.world_app_button_text,
          ),
          world_app_description: createLocaliseField(
            "1",
            AppLocaliseKeys.world_app_description,
          ),
        },
        {
          app_id: "3",
          name: "Test App3",
          logo_img_url: "https://cdn.test.com/3/logo.png",
          hero_image_url: "",
          showcase_img_urls: [
            "https://cdn.test.com/3/showcase1.png",
            "https://cdn.test.com/3/showcase2.png",
            "https://cdn.test.com/3/showcase3.png",
          ],
          whitelisted_addresses: ["0x1234", "0x5678"],
          app_mode: "external",
          category: createLocaliseCategory("social"),
          description: {
            how_it_works: createLocaliseField(
              "3",
              AppLocaliseKeys.description_how_it_works,
            ),
            how_to_connect: createLocaliseField(
              "3",
              AppLocaliseKeys.description_connect,
            ),
            overview: createLocaliseField(
              "3",
              AppLocaliseKeys.description_overview,
            ),
          },
          team_name: "Example Team",
          world_app_button_text: createLocaliseField(
            "3",
            AppLocaliseKeys.world_app_button_text,
          ),
          world_app_description: createLocaliseField(
            "3",
            AppLocaliseKeys.world_app_description,
          ),
        },
      ],
    });
  });
});
