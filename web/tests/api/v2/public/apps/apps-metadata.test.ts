import { GET } from "@/api/v2/public/apps";
import { AppLocaliseKeys } from "@/lib/types";
import { createLocaliseField } from "@/lib/utils";
import { NextRequest } from "next/server";
import { getSdk as getAppsSdk } from "../../../../../api/v2/public/apps/graphql/get-app-rankings.generated";
import { getSdk as getHighlightsSdk } from "../../../../../api/v2/public/apps/graphql/get-app-web-highlights.generated";

// Mock the external dependencies
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

jest.mock(
  "../../../../../api/v2/public/apps/graphql/get-app-rankings.generated",
  () => ({
    getSdk: jest.fn(() => ({
      GetApps: jest.fn().mockResolvedValue({
        top_apps: [],
        highlights: [],
      }),
    })),
  }),
);

jest.mock(
  "../../../../../api/v2/public/apps/graphql/get-app-web-highlights.generated",
  () => ({
    getSdk: jest.fn(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    })),
  }),
);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("/api/v2/public/apps", () => {
  test("should handle empty rankings correctly", async () => {
    jest.mocked(getHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    }));

    jest.mocked(getAppsSdk).mockImplementation(() => ({
      GetApps: jest.fn().mockResolvedValue({
        top_apps: [],
        highlights: [],
      }),
    }));

    const request = new NextRequest(
      "https://cdn.test.com/api/v2/public/apps?platform=web&country=US",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );
    const response = await GET(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      app_rankings: { top_apps: [], highlights: [] },
      categories: [
        {
          name: "Social",
          lokalise_key: "world_id_partner_category_social",
        },
        {
          name: "Gaming",
          lokalise_key: "world_id_partner_category_gaming",
        },
        {
          name: "Business",
          lokalise_key: "world_id_partner_category_business",
        },
        {
          name: "Finance",
          lokalise_key: "world_id_partner_category_finance",
        },
        {
          name: "Productivity",
          lokalise_key: "world_id_partner_category_productivity",
        },
        {
          name: "Other",
          lokalise_key: "world_id_partner_category_other",
        },
      ],
    });
  });

  test("Valid payload", async () => {
    // Mocking the response to simulate non-empty rankings
    jest.mocked(getHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    }));

    jest.mocked(getAppsSdk).mockImplementation(() => ({
      GetApps: jest.fn().mockResolvedValue({
        top_apps: [
          {
            app_id: "1",
            name: "Test App",
            logo_img_url: "logo.png",
            hero_image_url: "hero1.png",
            showcase_img_urls: ["showcase1.png"],
            category: "social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
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
            hero_image_url: "hero.png",
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
            hero_image_url: "hero.png",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
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
        highlights: [],
      }),
    }));

    const request = new NextRequest("https://cdn.test.com/api/v2/public/apps", {
      headers: {
        host: "cdn.test.com",
      },
    });
    const response = await GET(request);

    expect(await response.json()).toEqual({
      app_rankings: {
        top_apps: [
          {
            app_id: "1",
            name: "Test App",
            logo_img_url: "https://cdn.test.com/1/logo.png",
            hero_image_url: "https://cdn.test.com/1/hero1.png",
            showcase_img_urls: ["https://cdn.test.com/1/showcase1.png"],
            team_name: "Example Team",
            unique_users: 0,
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
            category: [
              {
                name: "social",
                lokalise_key: "world_id_partner_category_social",
              },
            ],
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
            app_id: "2",
            name: "Test App2",
            logo_img_url: "https://cdn.test.com/2/logo.png",
            hero_image_url: "https://cdn.test.com/2/hero.png",
            category: [
              {
                name: "social",
                lokalise_key: "world_id_partner_category_social",
              },
            ],
            whitelisted_addresses: ["0x1234", "0x5678"],
            unique_users: 0,
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
            app_id: "3",
            name: "Test App3",
            logo_img_url: "https://cdn.test.com/3/logo.png",
            hero_image_url: "https://cdn.test.com/3/hero.png",
            showcase_img_urls: [
              "https://cdn.test.com/3/showcase1.png",
              "https://cdn.test.com/3/showcase2.png",
              "https://cdn.test.com/3/showcase3.png",
            ],
            whitelisted_addresses: ["0x1234", "0x5678"],
            unique_users: 0,
            app_mode: "mini-app",
            category: [
              {
                name: "social",
                lokalise_key: "world_id_partner_category_social",
              },
            ],
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
        highlights: [],
      },
      categories: [
        {
          name: "Social",
          lokalise_key: "world_id_partner_category_social",
        },
        {
          name: "Gaming",
          lokalise_key: "world_id_partner_category_gaming",
        },
        {
          name: "Business",
          lokalise_key: "world_id_partner_category_business",
        },
        {
          name: "Finance",
          lokalise_key: "world_id_partner_category_finance",
        },
        {
          name: "Productivity",
          lokalise_key: "world_id_partner_category_productivity",
        },
        {
          name: "Other",
          lokalise_key: "world_id_partner_category_other",
        },
      ],
    });
  });

  test("Native Apps", async () => {
    jest.mocked(getHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    }));

    jest.mocked(getAppsSdk).mockImplementation(() => ({
      GetApps: jest.fn().mockResolvedValue({
        top_apps: [
          {
            name: "Example App",
            app_id: "TEST_APP_ID",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            world_app_description:
              "This is an example app designed to showcase the capabilities of our platform.",
            world_app_button_text: "Use Integration",
            category: "social",
            description:
              '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
            integration_url: "https://example.com/integration",
            app_website_url: "https://example.com",
            source_code_url: "https://github.com/example/app",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
            support_email: "andy@gmail.com",
            supported_countries: ["us"],
            supported_languages: ["en", "es"],
            app_rating: 3.4,
            app: {
              team: {
                name: "Example Team",
              },
            },
          },
        ],
        highlights: [],
      }),
    }));
    const request = new NextRequest("https://cdn.test.com/api/v2/public/apps", {
      headers: {
        host: "cdn.test.com",
      },
    });
    const response = await GET(request);

    expect(await response.json()).toEqual({
      app_rankings: {
        top_apps: [
          {
            name: "Example App",
            app_id: "Test",
            logo_img_url: "https://cdn.test.com/TEST_APP_ID/logo.png",
            hero_image_url: "https://cdn.test.com/TEST_APP_ID/hero.png",
            showcase_img_urls: [
              "https://cdn.test.com/TEST_APP_ID/showcase1.png",
              "https://cdn.test.com/TEST_APP_ID/showcase2.png",
            ],
            team_name: "Example Team",
            app_mode: "native",
            integration_url: "worldapp://test",
            app_website_url: "https://example.com",
            source_code_url: "https://github.com/example/app",
            support_email: "andy@gmail.com",
            supported_countries: ["us"],
            supported_languages: ["en", "es"],
            app_rating: 3.4,
            unique_users: 0,
            whitelisted_addresses: ["0x1234", "0x5678"],
            category: [
              {
                name: "social",
                lokalise_key: "world_id_partner_category_social",
              },
            ],
            description: {
              how_it_works: createLocaliseField(
                "TEST_APP_ID",
                AppLocaliseKeys.description_how_it_works,
              ),
              how_to_connect: createLocaliseField(
                "TEST_APP_ID",
                AppLocaliseKeys.description_connect,
              ),
              overview: createLocaliseField(
                "TEST_APP_ID",
                AppLocaliseKeys.description_overview,
              ),
            },
            world_app_button_text: createLocaliseField(
              "TEST_APP_ID",
              AppLocaliseKeys.world_app_button_text,
            ),
            world_app_description: createLocaliseField(
              "TEST_APP_ID",
              AppLocaliseKeys.world_app_description,
            ),
          },
        ],
        highlights: [],
      },
      categories: [
        {
          name: "Social",
          lokalise_key: "world_id_partner_category_social",
        },
        {
          name: "Gaming",
          lokalise_key: "world_id_partner_category_gaming",
        },
        {
          name: "Business",
          lokalise_key: "world_id_partner_category_business",
        },
        {
          name: "Finance",
          lokalise_key: "world_id_partner_category_finance",
        },
        {
          name: "Productivity",
          lokalise_key: "world_id_partner_category_productivity",
        },
        {
          name: "Other",
          lokalise_key: "world_id_partner_category_other",
        },
      ],
    });
  });
});
