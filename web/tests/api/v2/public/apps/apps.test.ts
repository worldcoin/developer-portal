import { GET } from "@/api/v2/public/apps";
import { AllCategory } from "@/lib/categories";
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
        hero_image_url: "",
        meta_tag_image_url: "meta_tag_image.png",
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
        hero_image_url: "",
        meta_tag_image_url: "meta_tag_image.png",
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

  describe("external app mode filtering", () => {
    const mockAppsWithMixedModes = [
      {
        app_id: "1",
        name: "Test App 1",
        short_name: "test1",
        logo_img_url: "logo.png",
        hero_image_url: "",
        showcase_img_urls: ["showcase1.png"],
        category: "Social",
        world_app_button_text: "random",
        world_app_description: "random",
        whitelisted_addresses: ["0x1234"],
        app_mode: "mini-app",
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
        name: "Test App 2",
        short_name: "test2",
        logo_img_url: "logo.png",
        hero_image_url: "",
        showcase_img_urls: ["showcase1.png"],
        category: "Social", // Not external category
        world_app_button_text: "random",
        world_app_description: "random",
        whitelisted_addresses: ["0x1234"],
        app_mode: "external", // External app mode
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
        app_id: "3",
        name: "Test App 3",
        short_name: "test3",
        logo_img_url: "logo.png",
        hero_image_url: "",
        showcase_img_urls: ["showcase1.png"],
        category: "External", // External category
        world_app_button_text: "random",
        world_app_description: "random",
        whitelisted_addresses: ["0x1234"],
        app_mode: "mini-app", // Not external app mode
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
        app_id: "4",
        name: "Test App 4",
        short_name: "test4",
        logo_img_url: "logo.png",
        hero_image_url: "",
        showcase_img_urls: ["showcase1.png"],
        category: "External", // External category
        world_app_button_text: "random",
        world_app_description: "random",
        whitelisted_addresses: ["0x1234"],
        app_mode: "external", // External app mode
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

      jest.mocked(getAppsSdk).mockImplementation(() => ({
        GetApps: jest.fn().mockResolvedValue({
          top_apps: mockAppsWithMixedModes,
        }),
      }));
    });

    test("should filter out apps with app_mode='external' or category='external' by default", async () => {
      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      const filteredAppIds = data.app_rankings.top_apps.map(
        (app: any) => app.app_id,
      );

      // App ID 1 should remain (category="Social", app_mode="mini-app")
      expect(filteredAppIds).toContain("1");

      // App ID 2 should be filtered out (category="Social", app_mode="external")
      expect(filteredAppIds).not.toContain("2");

      // App ID 3 should be filtered out (category="External" but app_mode="mini-app")
      expect(filteredAppIds).not.toContain("3");

      // App ID 4 should be filtered out (both category="External" and app_mode="external")
      expect(filteredAppIds).not.toContain("4");
    });

    test("should include apps with app_mode='external' when show_external=true", async () => {
      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps?show_external=true",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      // Verify that all apps are included when show_external=true
      const filteredAppIds = data.app_rankings.top_apps.map(
        (app: any) => app.app_id,
      );

      // All app IDs should be present
      expect(filteredAppIds).toContain("1");
      expect(filteredAppIds).toContain("2");
      expect(filteredAppIds).toContain("3");
      expect(filteredAppIds).toContain("4");
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
      all_category: AllCategory,
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
            hero_image_url: "",
            meta_tag_image_url: "meta_tag_image.png",
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
            hero_image_url: "",
            meta_tag_image_url: "meta_tag_image.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            category: "Social",
            world_app_button_text: "random",
            world_app_description: "random",
            whitelisted_addresses: ["0x1234", "0x5678"],
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            app_mode: "mini-app",
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
            hero_image_url: "",
            meta_tag_image_url: "meta_tag_image.png",
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
            category: "Gaming",
            verification_status: "verified",
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
            hero_image_url: "",
            meta_tag_image_url: "https://cdn.test.com/1/meta_tag_image.png",
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
            category_ranking: 1,
            avg_notification_open_rate: null,
          },
          {
            app_id: "2",
            name: "Test App2",
            short_name: "test",
            ratings_external_nullifier:
              "0x00fc298ff1e90b9bcbd7635266377d41b389cf96426db379b5871dd85a837020",
            logo_img_url: "https://cdn.test.com/2/logo.png",
            hero_image_url: "",
            meta_tag_image_url: "https://cdn.test.com/2/meta_tag_image.png",
            category: { id: "social", name: "Social" },
            whitelisted_addresses: ["0x1234", "0x5678"],
            unique_users: 0,
            impressions: 0,
            app_mode: "mini-app",
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
            category_ranking: 2,
            avg_notification_open_rate: null,
          },
          {
            app_id: "3",
            name: "Test App3",
            short_name: "test",
            logo_img_url: "https://cdn.test.com/3/logo.png",
            hero_image_url: "",
            meta_tag_image_url: "https://cdn.test.com/3/meta_tag_image.png",
            ratings_external_nullifier:
              "0x00a8ca23f766684e799bbbf19666342bb13b830c80aba71b9e25036990b539f1",
            showcase_img_urls: [
              "https://cdn.test.com/3/showcase1.png",
              "https://cdn.test.com/3/showcase2.png",
              "https://cdn.test.com/3/showcase3.png",
            ],
            whitelisted_addresses: ["0x1234", "0x5678"],
            unique_users: 0,
            impressions: 0,
            app_rating: 3.33,
            app_mode: "mini-app",
            associated_domains: ["https://worldcoin.org"],
            contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
            category: { id: "gaming", name: "Gaming" },
            description: {
              how_it_works: "",
              how_to_connect: "",
              overview: "random",
            },
            team_name: "Example Team",
            world_app_button_text: "random",
            world_app_description: "random",
            verification_status: "verified",
            is_allowed_unlimited_notifications: false,
            max_notifications_per_day: 10,
            category_ranking: 1,
            avg_notification_open_rate: null,
          },
        ],
      },
      categories: Categories.filter((category) => category.id !== "external"),
      all_category: AllCategory,
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
            meta_tag_image_url: "meta_tag_image.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "",
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
            hero_image_url: "",
            meta_tag_image_url:
              "https://cdn.test.com/app_test_123/meta_tag_image.png",
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
            category_ranking: 1,
            avg_notification_open_rate: null,
          },
        ],
        highlights: [],
      },
      categories: Categories.filter((category) => category.id !== "external"),
      all_category: AllCategory,
    });
  });

  test("Error on invalid category", async () => {
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
            hero_image_url: "",
            world_app_description:
              "This is an example app designed to showcase the capabilities of our platform.",
            world_app_button_text: "Use Integration",
            category: "INVALID!!",
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

    expect(response.status).toEqual(500);
  });

  describe("localization behavior", () => {
    test("should use localized image URLs and text fields when all are available", async () => {
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
              name: "Example App",
              short_name: "test",
              logo_img_url: "logo.png",
              meta_tag_image_url: "meta_tag_image.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "",
              world_app_description: "Default description",
              world_app_button_text: "Default button",
              category: "Social",
              description:
                '{"description_overview":"default","description_how_it_works":"default","description_connect":"default"}',
              integration_url: "https://example.com/integration",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "andy@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
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
              localisations: [
                {
                  locale: "es",
                  name: "Aplicación de Ejemplo",
                  world_app_button_text: "Botón en español",
                  world_app_description: "Descripción en español",
                  short_name: "test-es",
                  description:
                    '{"description_overview":"español","description_how_it_works":"español","description_connect":"español"}',
                  hero_image_url: "",
                  meta_tag_image_url: "meta_tag_image-es.png",
                  showcase_img_urls: ["showcase1-es.png", "showcase2-es.png"],
                },
              ],
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
            "x-accept-language": "es",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.app_rankings.top_apps[0].name).toBe("Aplicación de Ejemplo");
      expect(data.app_rankings.top_apps[0].short_name).toBe("test-es");
      expect(data.app_rankings.top_apps[0].hero_image_url).toBe("");
      expect(data.app_rankings.top_apps[0].meta_tag_image_url).toBe(
        "https://cdn.test.com/1/es/meta_tag_image-es.png",
      );
      expect(data.app_rankings.top_apps[0].showcase_img_urls).toEqual([
        "https://cdn.test.com/1/es/showcase1-es.png",
        "https://cdn.test.com/1/es/showcase2-es.png",
      ]);
      expect(data.app_rankings.top_apps[0].world_app_description).toBe(
        "Descripción en español",
      );
      expect(data.app_rankings.top_apps[0].world_app_button_text).toBe(
        "Botón en español",
      );
      expect(data.app_rankings.top_apps[0].description.overview).toBe(
        "español",
      );
    });

    test("should use default image URLs when localization has only text fields", async () => {
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
              name: "Example App",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "",
              world_app_description: "Default description",
              world_app_button_text: "Default button",
              category: "Social",
              description:
                '{"description_overview":"default","description_how_it_works":"default","description_connect":"default"}',
              integration_url: "https://example.com/integration",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "andy@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
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
              localisations: [
                {
                  locale: "es",
                  name: "Aplicación de Ejemplo",
                  world_app_button_text: "Botón en español",
                  world_app_description: "Descripción en español",
                  short_name: "test-es",
                  description:
                    '{"description_overview":"español","description_how_it_works":"español","description_connect":"español"}',
                },
              ],
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
            "x-accept-language": "es",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.app_rankings.top_apps[0].name).toBe("Aplicación de Ejemplo");
      expect(data.app_rankings.top_apps[0].short_name).toBe("test-es");
      expect(data.app_rankings.top_apps[0].hero_image_url).toBe("");
      expect(data.app_rankings.top_apps[0].showcase_img_urls).toEqual([
        "https://cdn.test.com/1/showcase1.png",
        "https://cdn.test.com/1/showcase2.png",
      ]);
      expect(data.app_rankings.top_apps[0].world_app_description).toBe(
        "Descripción en español",
      );
      expect(data.app_rankings.top_apps[0].world_app_button_text).toBe(
        "Botón en español",
      );
      expect(data.app_rankings.top_apps[0].description.overview).toBe(
        "español",
      );
    });

    test("should use default image URLs when localization images are available but text fields are missing", async () => {
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
              name: "Example App",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "",
              world_app_description: "Default description",
              world_app_button_text: "Default button",
              category: "Social",
              description:
                '{"description_overview":"default","description_how_it_works":"default","description_connect":"default"}',
              integration_url: "https://example.com/integration",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "andy@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
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
              localisations: [
                {
                  locale: "es",
                  hero_image_url: "",
                  showcase_img_urls: ["showcase1-es.png", "showcase2-es.png"],
                },
              ],
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/apps",
        {
          headers: {
            host: "cdn.test.com",
            "x-accept-language": "es",
          },
        },
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.app_rankings.top_apps[0].name).toBe("Example App");
      expect(data.app_rankings.top_apps[0].short_name).toBe("test");
      expect(data.app_rankings.top_apps[0].hero_image_url).toBe("");
      expect(data.app_rankings.top_apps[0].showcase_img_urls).toEqual([
        "https://cdn.test.com/1/showcase1.png",
        "https://cdn.test.com/1/showcase2.png",
      ]);
      expect(data.app_rankings.top_apps[0].world_app_description).toBe(
        "Default description",
      );
      expect(data.app_rankings.top_apps[0].world_app_button_text).toBe(
        "Default button",
      );
      expect(data.app_rankings.top_apps[0].description.overview).toBe(
        "default",
      );
    });
  });
});
