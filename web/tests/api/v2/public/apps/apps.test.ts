import { GET } from "@/api/v2/public/apps";
import { Categories } from "@/lib/constants";
import { NextRequest } from "next/server";
import { getSdk as getAppsSdk } from "../../../../../api/v2/public/apps/graphql/get-app-rankings.generated";
import { getSdk as getWebHighlightsSdk } from "../../../../../api/v2/public/apps/graphql/get-app-web-highlights.generated";
import { getSdk as getHighlightsSdk } from "../../../../../api/v2/public/apps/graphql/get-highlighted-apps.generated";

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

jest.mock(
  "../../../../../api/v2/public/apps/graphql/get-highlighted-apps.generated",
  () => ({
    getSdk: jest.fn(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        highlights: [],
      }),
    })),
  }),
);

beforeEach(() => {
  jest.resetAllMocks();
});

describe("/api/v2/public/apps", () => {
  describe("country selection", () => {
    const mockAppsWithCountries = [
      {
        app_id: "1",
        name: "Test App",
        short_name: "test",
        logo_img_url: "logo.png",
        hero_image_url: "hero.png",
        showcase_img_urls: ["showcase1.png"],
        category: "Social",
        world_app_button_text: "random",
        world_app_description: "random",
        whitelisted_addresses: ["0x1234"],
        app_mode: "mini-app",
        supported_countries: ["US", "GB"],
        verification_status: "verified",
        is_allowed_unlimited_notifications: false,
        max_notifications_per_day: 10,
        description: JSON.stringify({
          description_overview: "test",
          description_how_it_works: "",
          description_connect: "",
        }),
        app: {
          team: { name: "Test Team" },
          rating_sum: 10,
          rating_count: 2,
        },
      },
      {
        app_id: "2",
        name: "Test App",
        short_name: "test",
        logo_img_url: "logo.png",
        hero_image_url: "hero.png",
        showcase_img_urls: ["showcase1.png"],
        category: "Social",
        world_app_button_text: "random",
        world_app_description: "random",
        whitelisted_addresses: ["0x1234"],
        app_mode: "mini-app",
        supported_countries: ["US"],
        verification_status: "verified",
        is_allowed_unlimited_notifications: false,
        max_notifications_per_day: 10,
        description: JSON.stringify({
          description_overview: "test",
          description_how_it_works: "",
          description_connect: "",
        }),
        app: {
          team: { name: "Test Team" },
          rating_sum: 10,
          rating_count: 2,
        },
      },
    ];

    beforeEach(() => {
      jest.mocked(getWebHighlightsSdk).mockImplementation(() => ({
        GetHighlights: jest.fn().mockResolvedValue({
          app_rankings: [{ rankings: [] }],
        }),
      }));

      jest.mocked(getHighlightsSdk).mockImplementation(() => ({
        GetHighlights: jest.fn().mockResolvedValue({
          highlights: [],
        }),
      }));
    });

    test("should prioritize country from query parameter over CloudFront header", async () => {
      jest.mocked(getAppsSdk).mockImplementation(() => ({
        GetApps: jest.fn().mockResolvedValue({
          top_apps: mockAppsWithCountries,
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps?override_country=GB",
        {
          headers: {
            host: "cdn.test.com",
            "CloudFront-Viewer-Country": "US",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      // App should be included as GB is in supported_countries
      expect(data.app_rankings.top_apps).toHaveLength(1);
      expect(data.app_rankings.top_apps[0].app_id).toBe("1");
    });

    test("should fall back to CloudFront header when no query parameter is provided", async () => {
      jest.mocked(getAppsSdk).mockImplementation(() => ({
        GetApps: jest.fn().mockResolvedValue({
          top_apps: mockAppsWithCountries,
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
            "CloudFront-Viewer-Country": "US",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      // App should be included as US is in supported_countries
      expect(data.app_rankings.top_apps).toHaveLength(2);
      expect(data.app_rankings.top_apps[0].app_id).toBe("1");
      expect(data.app_rankings.top_apps[1].app_id).toBe("2");
    });

    test("should filter out apps not supporting the specified country", async () => {
      jest.mocked(getAppsSdk).mockImplementation(() => ({
        GetApps: jest.fn().mockResolvedValue({
          top_apps: mockAppsWithCountries,
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps?override_country=FR",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      // App should be filtered out as FR is not in supported_countries
      expect(data.app_rankings.top_apps).toHaveLength(0);
    });
  });

  describe("locale parsing", () => {
    beforeEach(() => {
      jest.mocked(getWebHighlightsSdk).mockImplementation(() => ({
        GetHighlights: jest.fn().mockResolvedValue({
          app_rankings: [{ rankings: [] }],
        }),
      }));

      jest.mocked(getHighlightsSdk).mockImplementation(() => ({
        GetHighlights: jest.fn().mockResolvedValue({
          highlights: [],
        }),
      }));

      jest.mocked(getAppsSdk).mockImplementation(() => ({
        GetApps: jest.fn().mockResolvedValue({
          top_apps: [],
        }),
      }));
    });

    test("should use 'en' locale when no x-accept-language header is provided", async () => {
      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );

      await GET(request);

      expect(getAppsSdk).toHaveBeenCalled();
      expect(
        jest.mocked(getAppsSdk).mock.results[0].value.GetApps,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "en",
        }),
      );
    });

    test("should parse simple language code from x-accept-language header", async () => {
      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
            "x-accept-language": "es",
          },
        },
      );

      await GET(request);

      expect(getAppsSdk).toHaveBeenCalled();
      expect(
        jest.mocked(getAppsSdk).mock.results[0].value.GetApps,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "es",
        }),
      );
    });

    test("should parse language code with region from x-accept-language header", async () => {
      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
            "x-accept-language": "en-US",
          },
        },
      );

      await GET(request);

      expect(getAppsSdk).toHaveBeenCalled();
      expect(
        jest.mocked(getAppsSdk).mock.results[0].value.GetApps,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "en",
        }),
      );
    });

    test("should handle multiple language preferences in x-accept-language header", async () => {
      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
            "x-accept-language": "th-TH,fr;q=0.9,en-US;q=0.8,en;q=0.7",
          },
        },
      );

      await GET(request);

      expect(getAppsSdk).toHaveBeenCalled();
      expect(
        jest.mocked(getAppsSdk).mock.results[0].value.GetApps,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "th",
        }),
      );
    });
  });

  test("should handle empty rankings correctly", async () => {
    jest.mocked(getWebHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    }));

    jest.mocked(getHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        highlights: [],
      }),
    }));

    jest.mocked(getAppsSdk).mockImplementation(() => ({
      GetApps: jest.fn().mockResolvedValue({
        top_apps: [],
        highlights: [],
      }),
    }));

    const request = new NextRequest(
      "https://cdn.test.com/api/v2/public/apps?platform=web&override_country=US",
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
      categories: Categories.filter((category) => category.id !== "external"),
    });
  });

  test("Valid payload", async () => {
    // Mocking the response to simulate non-empty rankings
    jest.mocked(getWebHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    }));
    jest.mocked(getHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        highlights: [],
      }),
    }));
    jest.mocked(getAppsSdk).mockImplementation(() => ({
      GetApps: jest.fn().mockResolvedValue({
        top_apps: [
          {
            app_id: "1",
            name: "Test App",
            short_name: "test",
            logo_img_url: "logo.png",
            hero_image_url: "hero1.png",
            showcase_img_urls: ["showcase1.png"],
            category: "Social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            description: JSON.stringify({
              description_overview: "random string",
              description_how_it_works: "",
              description_connect: "",
            }),
            verification_status: "verified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
            app: {
              team: {
                name: "Example Team",
              },
              rating_sum: 10,
              rating_count: 3,
            },
          },
          {
            app_id: "2",
            name: "Test App2",
            short_name: "test",
            logo_img_url: "logo.png",
            hero_image_url: "hero.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            category: "Social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            app_mode: "external",
            verification_status: "verified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
            description: JSON.stringify({
              description_overview: "fwefw",
              description_how_it_works: "",
              description_connect: "",
            }),
            app: {
              team: {
                name: "Example Team",
              },
              rating_sum: 10,
              rating_count: 3,
            },
          },
          {
            app_id: "3",
            name: "Test App3",
            short_name: "test",
            logo_img_url: "logo.png",
            hero_image_url: "hero.png",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            app_mode: "mini-app",
            showcase_img_urls: [
              "showcase1.png",
              "showcase2.png",
              "showcase3.png",
            ],
            category: "Social",
            verification_status: "unverified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
            description: JSON.stringify({
              description_overview: "random",
              description_how_it_works: "",
              description_connect: "",
            }),
            app: {
              team: {
                name: "Example Team",
              },
              rating_sum: 10,
              rating_count: 3,
            },
          },
        ],
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
        highlights: [],
        top_apps: [
          {
            app_id: "1",
            name: "Test App",
            short_name: "test",
            ratings_external_nullifier:
              "0x00051f128f73eec6f444e98dca57697f9cce04fb3f2e0e63dea5351ccde35b8e",
            logo_img_url: "https://cdn.test.com/1/logo.png",
            hero_image_url: "https://cdn.test.com/1/hero1.png",
            showcase_img_urls: ["https://cdn.test.com/1/showcase1.png"],
            team_name: "Example Team",
            unique_users: 0,
            impressions: 0,
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
            category: { id: "social", name: "Social" },
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            description: {
              overview: "random string",
              how_it_works: "",
              how_to_connect: "",
            },
            world_app_button_text: "random",
            world_app_description: "random",
            app_rating: 3.33,
            verification_status: "verified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
          },
          {
            app_id: "2",
            name: "Test App2",
            short_name: "test",
            ratings_external_nullifier:
              "0x00fc298ff1e90b9bcbd7635266377d41b389cf96426db379b5871dd85a837020",
            logo_img_url: "https://cdn.test.com/2/logo.png",
            hero_image_url: "https://cdn.test.com/2/hero.png",
            category: { id: "social", name: "Social" },
            whitelisted_addresses: ["0x1234", "0x5678"],
            unique_users: 0,
            impressions: 0,
            app_mode: "external",
            description: {
              overview: "fwefw",
              how_it_works: "",
              how_to_connect: "",
            },
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            showcase_img_urls: [
              "https://cdn.test.com/2/showcase1.png",
              "https://cdn.test.com/2/showcase2.png",
            ],
            team_name: "Example Team",
            world_app_button_text: "random",
            world_app_description: "random",
            app_rating: 3.33,
            verification_status: "verified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
          },
          {
            app_id: "3",
            name: "Test App3",
            short_name: "test",
            logo_img_url: "https://cdn.test.com/unverified/3/logo.png",
            hero_image_url: "https://cdn.test.com/unverified/3/hero.png",
            ratings_external_nullifier:
              "0x00a8ca23f766684e799bbbf19666342bb13b830c80aba71b9e25036990b539f1",
            showcase_img_urls: [
              "https://cdn.test.com/unverified/3/showcase1.png",
              "https://cdn.test.com/unverified/3/showcase2.png",
              "https://cdn.test.com/unverified/3/showcase3.png",
            ],
            whitelisted_addresses: ["0x1234", "0x5678"],
            unique_users: 0,
            impressions: 0,
            app_rating: 3.33,
            app_mode: "mini-app",
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            category: { id: "social", name: "Social" },
            description: {
              how_it_works: "",
              how_to_connect: "",
              overview: "random",
            },
            team_name: "Example Team",
            world_app_button_text: "random",
            world_app_description: "random",
            verification_status: "unverified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
          },
        ],
      },
      categories: Categories.filter((category) => category.id !== "external"),
    });
  });

  test("Native Apps", async () => {
    jest.mocked(getWebHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        app_rankings: [{ rankings: [] }],
      }),
    }));
    jest.mocked(getHighlightsSdk).mockImplementation(() => ({
      GetHighlights: jest.fn().mockResolvedValue({
        highlights: [],
      }),
    }));

    jest.mocked(getAppsSdk).mockImplementation(() => ({
      GetApps: jest.fn().mockResolvedValue({
        top_apps: [
          {
            name: "Example App",
            app_id: "app_test_123",
            short_name: "test",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            world_app_description:
              "This is an example app designed to showcase the capabilities of our platform.",
            world_app_button_text: "Use Integration",
            category: "Social",
            description:
              '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
            integration_url: "https://example.com/integration",
            app_website_url: "https://example.com",
            source_code_url: "https://github.com/example/app",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
            support_link: "andy@gmail.com",
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            supported_countries: ["us"],
            supported_languages: ["en", "es"],
            verification_status: "verified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
            app: {
              team: {
                name: "Example Team",
              },
              rating_sum: 10,
              rating_count: 3,
            },
          },
        ],
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
            app_id: "TEST_APP",
            short_name: "test",
            logo_img_url: "https://cdn.test.com/app_test_123/logo.png",
            hero_image_url: "https://cdn.test.com/app_test_123/hero.png",
            showcase_img_urls: [
              "https://cdn.test.com/app_test_123/showcase1.png",
              "https://cdn.test.com/app_test_123/showcase2.png",
            ],
            team_name: "Example Team",
            app_mode: "native",
            integration_url: "worldapp://test",
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            app_website_url: "https://example.com",
            source_code_url: "https://github.com/example/app",
            support_link: "andy@gmail.com",
            supported_countries: ["us"],
            supported_languages: ["en", "es"],
            ratings_external_nullifier:
              "0x00ca597c4f12f9f85a633bb04cfdc877af7c2d91a6c1c7fe45031b495a227a58",
            app_rating: 3.33,
            unique_users: 0,
            impressions: 0,
            whitelisted_addresses: ["0x1234", "0x5678"],
            category: { id: "social", name: "Social" },
            description: {
              how_it_works: "",
              how_to_connect: "",
              overview: "fewf",
            },
            world_app_button_text: "Use Integration",
            world_app_description:
              "This is an example app designed to showcase the capabilities of our platform.",
            verification_status: "verified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
          },
        ],
        highlights: [],
      },
      categories: Categories.filter((category) => category.id !== "external"),
    });
  });
});
