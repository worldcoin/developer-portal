import { GET } from "@/api/v2/public/app/[app_id]";
import { NativeAppToAppIdMapping } from "@/lib/constants";
import { NextRequest } from "next/server";
import { getSdk as getAppMetadataSdk } from "../../../../../api/v2/public/app/[app_id]/graphql/get-app-metadata.generated";

// Mock the external dependencies
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

jest.mock(
  "../../../../../api/v2/public/app/[app_id]/graphql/get-app-metadata.generated",
  () => ({
    getSdk: jest.fn(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
          {
            name: "Example App",
            app_id: "2",
            short_name: "test",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            world_app_description:
              "This is an example app designed to showcase the capabilities of our platform.",
            world_app_button_text: "Use Integration",
            category: "Productivity",
            description:
              '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
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
            verification_status: "unverified",
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
    })),
  }),
);

describe("/api/public/app/[app_id]", () => {
  test("Returns correct value for valid unverified app", async () => {
    const request = new NextRequest("https://cdn.test.com/api/public/app/1", {
      headers: {
        host: "cdn.test.com",
      },
    });
    const response = await GET(request, { params: { app_id: "2" } });
    expect(await response.json()).toEqual({
      app_data: {
        name: "Example App",
        app_id: "2",
        short_name: "test",
        logo_img_url: "https://cdn.test.com/unverified/2/logo.png",
        showcase_img_urls: [
          "https://cdn.test.com/unverified/2/showcase1.png",
          "https://cdn.test.com/unverified/2/showcase2.png",
        ],
        hero_image_url: "https://cdn.test.com/unverified/2/hero.png",
        category: {
          id: "productivity",
          name: "Productivity",
        },
        integration_url: "https://example.com/integration",
        app_website_url: "https://example.com",
        source_code_url: "https://github.com/example/app",
        team_name: "Example Team",
        whitelisted_addresses: ["0x1234", "0x5678"],
        app_mode: "mini-app",
        associated_domains: ["https://worldcoin.org"],
        contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
        permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
        ratings_external_nullifier:
          "0x00fc298ff1e90b9bcbd7635266377d41b389cf96426db379b5871dd85a837020",
        support_link: "andy@gmail.com",
        supported_countries: ["us"],
        supported_languages: ["en", "es"],
        app_rating: 3.33,
        unique_users: 0,
        impressions: 0,
        verification_status: "unverified",
        is_allowed_unlimited_notifications: false,
        max_notifications_per_day: 10,
        description: {
          how_it_works: "",
          how_to_connect: "",
          overview: "fewf",
        },
        world_app_button_text: "Use Integration",
        world_app_description:
          "This is an example app designed to showcase the capabilities of our platform.",
      },
    });
  });

  test("Returns correct value for valid verified app", async () => {
    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
          {
            name: "Example App",
            app_id: "1",
            short_name: "test",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            world_app_description:
              "This is an example app designed to showcase the capabilities of our platform.",
            world_app_button_text: "Use Integration",
            category: "Productivity",
            description:
              '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
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
          },
        ],
      }),
    }));

    const request = new NextRequest("https://cdn.test.com/api/public/app/1", {
      headers: {
        host: "cdn.test.com",
      },
    });
    const response = await GET(request, { params: { app_id: "1" } });
    expect(await response.json()).toEqual({
      app_data: {
        name: "Example App",
        app_id: "1",
        app_rating: 3.33,
        short_name: "test",
        logo_img_url: "https://cdn.test.com/1/logo.png",
        showcase_img_urls: [
          "https://cdn.test.com/1/showcase1.png",
          "https://cdn.test.com/1/showcase2.png",
        ],
        hero_image_url: "https://cdn.test.com/1/hero.png",
        category: {
          id: "productivity",
          name: "Productivity",
        },
        integration_url: "https://example.com/integration",
        app_website_url: "https://example.com",
        source_code_url: "https://github.com/example/app",
        team_name: "Example Team",
        whitelisted_addresses: ["0x1234", "0x5678"],
        app_mode: "mini-app",
        associated_domains: ["https://worldcoin.org"],
        contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
        permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
        ratings_external_nullifier:
          "0x00051f128f73eec6f444e98dca57697f9cce04fb3f2e0e63dea5351ccde35b8e",
        support_link: "andy@gmail.com",
        supported_countries: ["us"],
        supported_languages: ["en", "es"],
        unique_users: 0,
        impressions: 0,
        verification_status: "verified",
        is_allowed_unlimited_notifications: false,
        max_notifications_per_day: 10,
        description: {
          how_it_works: "",
          how_to_connect: "",
          overview: "fewf",
        },
        world_app_button_text: "Use Integration",
        world_app_description:
          "This is an example app designed to showcase the capabilities of our platform.",
      },
    });
  });

  test("Implements native app correctly", async () => {
    const request = new NextRequest(
      "https://cdn.test.com/api/v2/public/app/TEST_APP",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );

    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
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

    const response = await GET(request, { params: { app_id: "TEST_APP" } });
    expect(await response.json()).toEqual({
      app_data: {
        name: "Example App",
        app_id: "TEST_APP",
        short_name: "test",
        logo_img_url: "https://cdn.test.com/unverified/app_test_123/logo.png",
        hero_image_url: "https://cdn.test.com/unverified/app_test_123/hero.png",
        showcase_img_urls: [
          "https://cdn.test.com/unverified/app_test_123/showcase1.png",
          "https://cdn.test.com/unverified/app_test_123/showcase2.png",
        ],
        team_name: "Example Team",
        app_mode: "native",
        integration_url: "worldapp://test",
        app_website_url: "https://example.com",
        source_code_url: "https://github.com/example/app",
        ratings_external_nullifier:
          "0x00ca597c4f12f9f85a633bb04cfdc877af7c2d91a6c1c7fe45031b495a227a58",
        support_link: "andy@gmail.com",
        supported_countries: ["us"],
        supported_languages: ["en", "es"],
        associated_domains: ["https://worldcoin.org"],
        contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
        permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
        app_rating: 3.33,
        unique_users: 0,
        impressions: 0,
        whitelisted_addresses: ["0x1234", "0x5678"],
        category: { id: "social", name: "Social" },
        is_allowed_unlimited_notifications: false,
        max_notifications_per_day: 10,
        description: {
          how_it_works: "",
          how_to_connect: "",
          overview: "fewf",
        },
        world_app_button_text: "Use Integration",
        world_app_description:
          "This is an example app designed to showcase the capabilities of our platform.",
      },
    });
  });

  describe("App metadata selection logic", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should select metadata by draft_id when provided", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              id: "1",
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description:
                "This is an example app designed to showcase the capabilities of our platform.",
              world_app_button_text: "Use Integration",
              category: "Productivity",
              description:
                '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
              integration_url: "https://example.com/integration",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "takis@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              supported_languages: ["en", "es"],
              verification_status: "verified",
              is_allowed_unlimited_notifications: false,
              max_notifications_per_day: 10,
              is_reviewer_world_app_approved: true,
              app: {
                team: {
                  name: "Example Team",
                },
                rating_sum: 10,
                rating_count: 3,
              },
            },
            {
              id: "2",
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description:
                "This is an example app designed to showcase the capabilities of our platform.",
              world_app_button_text: "Use Integration",
              category: "Productivity",
              description:
                '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
              integration_url: "https://example.com/integration-unverified",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "takis@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              supported_languages: ["en", "es"],
              is_reviewer_world_app_approved: false,
              verification_status: "unverified",
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

      const request = new NextRequest(
        "https://cdn.test.com/api/public/app/test-app?draft_id=2",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );
      const response = await GET(request, { params: { app_id: "test-app" } });
      const data = await response.json();
      expect(data.app_data.name).toBe("Example App");
      expect(data.app_data.app_rating).toBe(3.33);
      expect(data.app_data.integration_url).toBe(
        "https://example.com/integration-unverified",
      );
      expect(data.app_data.draft_id).toBe("2");
    });

    test("should select reviewer approved metadata when no draft_id provided", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              id: "1",
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description:
                "This is an example app designed to showcase the capabilities of our platform.",
              world_app_button_text: "Use Integration",
              category: "Productivity",
              description:
                '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
              integration_url: "https://example.com/integration",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "takis@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              supported_languages: ["en", "es"],
              verification_status: "verified",
              is_allowed_unlimited_notifications: false,
              max_notifications_per_day: 10,
              is_reviewer_world_app_approved: true,
              app: {
                team: {
                  name: "Example Team",
                },
                rating_sum: 10,
                rating_count: 3,
              },
            },
            {
              id: "2",
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description:
                "This is an example app designed to showcase the capabilities of our platform.",
              world_app_button_text: "Use Integration",
              category: "Productivity",
              description:
                '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
              integration_url: "https://example.com/integration-unverified",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "takis@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              supported_languages: ["en", "es"],
              is_reviewer_world_app_approved: false,
              verification_status: "unverified",
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

      const request = new NextRequest(
        "https://cdn.test.com/api/public/app/test-app",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );
      const response = await GET(request, { params: { app_id: "test-app" } });
      const data = await response.json();
      expect(data.app_data.name).toBe("Example App");
      expect(data.app_data.app_rating).toBe(3.33);
      expect(data.app_data.integration_url).toBe(
        "https://example.com/integration",
      );
      expect(data.app_data.draft_id).toBeUndefined();
    });

    test("should return 404 when draft_id is invalid", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              id: "1",
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description:
                "This is an example app designed to showcase the capabilities of our platform.",
              world_app_button_text: "Use Integration",
              category: "Productivity",
              description:
                '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
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
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/public/app/test-app?draft_id=non-existent",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );
      const response = await GET(request, { params: { app_id: "test-app" } });
      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.error).toBe("Draft not found");
    });

    test("should return 404 when a draft_id is provided for native app", async () => {
      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/app/TEST_APP?draft_id=123",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );

      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
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

      const response = await GET(request, {
        params: { app_id: "TEST_APP" },
      });
      expect(response.status).toBe(404);
    });

    test("should return 400 when draft_id is already verified", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              id: "1",
              name: "Example App",
              app_id: "test-app",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description:
                "This is an example app designed to showcase the capabilities of our platform.",
              world_app_button_text: "Use Integration",
              category: "Productivity",
              description:
                '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
              integration_url: "https://example.com/integration",
              app_website_url: "https://example.com",
              source_code_url: "https://github.com/example/app",
              whitelisted_addresses: ["0x1234", "0x5678"],
              app_mode: "mini-app",
              support_link: "michal@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              supported_languages: ["en", "es"],
              is_reviewer_world_app_approved: true,
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

      const request = new NextRequest(
        "https://cdn.test.com/api/public/app/test-app?draft_id=1",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );
      const response = await GET(request, { params: { app_id: "test-app" } });
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe("Draft already verified");
    });
  });
  describe("response integrity", () => {
    test("should return 404 when category is invalid", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              id: "1",
              name: "Example App",
              app_id: "test-app",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
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
              support_link: "michal@gmail.com",
              supported_countries: ["us"],
              associated_domains: ["https://worldcoin.org"],
              contracts: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              permit2_tokens: ["0x0c892815f0B058E69987920A23FBb33c834289cf"],
              supported_languages: ["en", "es"],
              is_reviewer_world_app_approved: true,
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

      const request = new NextRequest(
        "https://cdn.test.com/api/public/app/test-app",
        {
          headers: {
            host: "cdn.test.com",
          },
        },
      );
      const response = await GET(request, { params: { app_id: "test-app" } });
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: "Invalid category" });
    });
  });

  test("Returns 404 when override_country is provided but not supported", async () => {
    // Mock app metadata with only the US as a supported country
    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
          {
            name: "Country Limited App",
            app_id: "3",
            short_name: "country-limited",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            category: "Productivity",
            description: '{"description_overview":"test"}',
            integration_url: "https://example.com/integration",
            verification_status: "verified",
            supported_countries: ["us"], // Only supports US
            app: {
              team: {
                name: "Test Team",
              },
              rating_sum: 0,
              rating_count: 0,
            },
          },
        ],
      }),
    }));

    // Create request with UK as override_country
    const request = new NextRequest(
      "https://cdn.test.com/api/v2/public/app/3?override_country=uk",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );

    const response = await GET(request, { params: { app_id: "3" } });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "App not available in country",
    });
  });

  test("Returns app data when override_country is provided and supported", async () => {
    // Mock app metadata with multiple supported countries
    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
          {
            name: "Multi Country App",
            app_id: "4",
            short_name: "multi-country",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            category: "Productivity",
            description: '{"description_overview":"test"}',
            integration_url: "https://example.com/integration",
            verification_status: "verified",
            supported_countries: ["us", "uk", "ca"], // Supports multiple countries
            app: {
              team: {
                name: "Test Team",
              },
              rating_sum: 0,
              rating_count: 0,
            },
          },
        ],
      }),
    }));

    // Create request with UK as override_country (which is supported)
    const request = new NextRequest(
      "https://cdn.test.com/api/v2/public/app/4?override_country=uk",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );

    const response = await GET(request, { params: { app_id: "4" } });

    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toHaveProperty("app_data");
    expect(responseData.app_data.app_id).toBe("4");
    expect(responseData.app_data.name).toBe("Multi Country App");
    expect(responseData.app_data.supported_countries).toContain("uk");
  });

  test("Returns app data when override_country is not provided", async () => {
    // Mock app metadata with limited country support
    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
          {
            name: "Limited Country App",
            app_id: "5",
            short_name: "limited-country",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            category: "Productivity",
            description: '{"description_overview":"test"}',
            integration_url: "https://example.com/integration",
            verification_status: "verified",
            supported_countries: ["us", "ca"], // Only supports US and Canada
            app: {
              team: {
                name: "Test Team",
              },
              rating_sum: 0,
              rating_count: 0,
            },
          },
        ],
      }),
    }));

    // Create request without override_country
    const request = new NextRequest(
      "https://cdn.test.com/api/v2/public/app/5",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );

    const response = await GET(request, { params: { app_id: "5" } });

    // Should return the app regardless of country restrictions
    // as override_country is not specified
    expect(response.status).toBe(200);

    const responseData = await response.json();
    expect(responseData).toHaveProperty("app_data");
    expect(responseData.app_data.app_id).toBe("5");
    expect(responseData.app_data.name).toBe("Limited Country App");
    expect(responseData.app_data.supported_countries).toEqual(["us", "ca"]);
  });

  test("Returns app data when override_country is provided but app has no supported_countries", async () => {
    // Mock app metadata without supported_countries field
    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
          {
            name: "Global App",
            app_id: "6",
            short_name: "global-app",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "hero.png",
            category: "Productivity",
            description: '{"description_overview":"test"}',
            integration_url: "https://example.com/integration",
            verification_status: "verified",
            // No supported_countries field
            app: {
              team: {
                name: "Test Team",
              },
              rating_sum: 0,
              rating_count: 0,
            },
          },
        ],
      }),
    }));

    // Create request with override_country
    const request = new NextRequest(
      "https://cdn.test.com/api/v2/public/app/6?override_country=uk",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );

    const response = await GET(request, { params: { app_id: "6" } });

    // Should return 404 as the app has no supported_countries field
    // and the code checks !parsedAppMetadata.supported_countries?.includes(override_country)
    // which evaluates to true when supported_countries is undefined
    expect(response.status).toBe(404);

    expect(await response.json()).toEqual({
      error: "App not available in country",
    });
  });

  describe("localization behavior", () => {
    test("should use localized image URLs and text fields when all are available", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description: "Default description",
              world_app_button_text: "Default button",
              category: "Productivity",
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
                  hero_image_url: "hero-es.png",
                  showcase_img_urls: ["showcase1-es.png", "showcase2-es.png"],
                },
              ],
            },
          ],
        }),
      }));

      const request = new NextRequest("https://cdn.test.com/api/public/app/1", {
        headers: {
          host: "cdn.test.com",
          "x-accept-language": "es",
        },
      });
      const response = await GET(request, { params: { app_id: "1" } });
      const data = await response.json();

      expect(data.app_data.name).toBe("Aplicación de Ejemplo");
      expect(data.app_data.short_name).toBe("test-es");
      expect(data.app_data.hero_image_url).toBe(
        "https://cdn.test.com/1/es/hero-es.png",
      );
      expect(data.app_data.showcase_img_urls).toEqual([
        "https://cdn.test.com/1/es/showcase1-es.png",
        "https://cdn.test.com/1/es/showcase2-es.png",
      ]);
      expect(data.app_data.world_app_description).toBe(
        "Descripción en español",
      );
      expect(data.app_data.world_app_button_text).toBe("Botón en español");
      expect(data.app_data.description.overview).toBe("español");
    });

    test("should use default image URLs when localization has only text fields", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description: "Default description",
              world_app_button_text: "Default button",
              category: "Productivity",
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

      const request = new NextRequest("https://cdn.test.com/api/public/app/1", {
        headers: {
          host: "cdn.test.com",
          "x-accept-language": "es",
        },
      });
      const response = await GET(request, { params: { app_id: "1" } });
      const data = await response.json();

      expect(data.app_data.name).toBe("Aplicación de Ejemplo");
      expect(data.app_data.short_name).toBe("test-es");
      expect(data.app_data.hero_image_url).toBe(
        "https://cdn.test.com/1/hero.png",
      );
      expect(data.app_data.showcase_img_urls).toEqual([
        "https://cdn.test.com/1/showcase1.png",
        "https://cdn.test.com/1/showcase2.png",
      ]);
      expect(data.app_data.world_app_description).toBe(
        "Descripción en español",
      );
      expect(data.app_data.world_app_button_text).toBe("Botón en español");
      expect(data.app_data.description.overview).toBe("español");
    });

    test("should use default image URLs when localization images are available but text fields are missing", async () => {
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              name: "Example App",
              app_id: "1",
              short_name: "test",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              world_app_description: "Default description",
              world_app_button_text: "Default button",
              category: "Productivity",
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
                  hero_image_url: "hero-es.png",
                  showcase_img_urls: ["showcase1-es.png", "showcase2-es.png"],
                },
              ],
            },
          ],
        }),
      }));

      const request = new NextRequest("https://cdn.test.com/api/public/app/1", {
        headers: {
          host: "cdn.test.com",
          "x-accept-language": "es",
        },
      });
      const response = await GET(request, { params: { app_id: "1" } });
      const data = await response.json();

      expect(data.app_data.name).toBe("Example App");
      expect(data.app_data.short_name).toBe("test");
      expect(data.app_data.hero_image_url).toBe(
        "https://cdn.test.com/1/hero.png",
      );
      expect(data.app_data.showcase_img_urls).toEqual([
        "https://cdn.test.com/1/showcase1.png",
        "https://cdn.test.com/1/showcase2.png",
      ]);
      expect(data.app_data.world_app_description).toBe("Default description");
      expect(data.app_data.world_app_button_text).toBe("Default button");
      expect(data.app_data.description.overview).toBe("default");
    });
  });

  describe("contacts app version filtering", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_APP_ENV = "production";
      process.env.NEXT_PUBLIC_IMAGES_CDN_URL = "cdn.test.com";
      global.fetch = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          status: 200,
          json: () => Promise.resolve({}),
        });
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should return 404 when requesting contacts app with client version below minimum", async () => {
      // Setup mock to return contacts app metadata
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              name: "Contacts App",
              app_id: NativeAppToAppIdMapping["production"].contacts, // contacts app
              short_name: "contacts",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              category: "Social",
              description: '{"description_overview":"Contacts app"}',
              integration_url: "https://example.com/integration",
              verification_status: "verified",
              supported_countries: ["us", "uk"],
              is_allowed_unlimited_notifications: false,
              max_notifications_per_day: 10,
              app: {
                team: {
                  name: "Test Team",
                },
                rating_sum: 10,
                rating_count: 2,
              },
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/app/contacts",
        {
          headers: {
            host: "cdn.test.com",
            "client-version": "2.8.7800", // below the minimum version
          },
        },
      );

      const response = await GET(request, { params: { app_id: "contacts" } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "App not available" });
    });

    test("should return 404 when requesting contacts app with missing client version", async () => {
      // Setup mock to return contacts app metadata
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              name: "Contacts App",
              app_id: NativeAppToAppIdMapping["production"].contacts, // contacts app
              short_name: "contacts",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              category: "Social",
              description: '{"description_overview":"Contacts app"}',
              integration_url: "https://example.com/integration",
              verification_status: "verified",
              supported_countries: ["us", "uk"],
              is_allowed_unlimited_notifications: false,
              max_notifications_per_day: 10,
              app: {
                team: {
                  name: "Test Team",
                },
                rating_sum: 10,
                rating_count: 2,
              },
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/app/contacts",
        {
          headers: {
            host: "cdn.test.com",
            // No client-version header
          },
        },
      );

      const response = await GET(request, { params: { app_id: "contacts" } });

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: "App not available" });
    });

    test("should return app data when requesting contacts app with client version at minimum", async () => {
      // Setup mock to return contacts app metadata
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              name: "Contacts App",
              app_id: NativeAppToAppIdMapping["production"].contacts, // contacts app
              short_name: "contacts",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              category: "Social",
              description: '{"description_overview":"Contacts app"}',
              integration_url: "https://example.com/integration",
              verification_status: "verified",
              supported_countries: ["us", "uk"],
              is_allowed_unlimited_notifications: false,
              max_notifications_per_day: 10,
              app: {
                team: {
                  name: "Test Team",
                },
                rating_sum: 10,
                rating_count: 2,
              },
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/app/contacts",
        {
          headers: {
            host: "cdn.test.com",
            "client-version": "2.8.7803", // exactly the minimum version
          },
        },
      );

      const response = await GET(request, { params: { app_id: "contacts" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("app_data");
      expect(data.app_data.name).toBe("Contacts App");
    });

    test("should return app data when requesting contacts app with client version above minimum", async () => {
      // Setup mock to return contacts app metadata
      jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
        GetAppMetadata: jest.fn().mockResolvedValue({
          app_metadata: [
            {
              name: "Contacts App",
              app_id: NativeAppToAppIdMapping["production"].contacts, // contacts app
              short_name: "contacts",
              logo_img_url: "logo.png",
              showcase_img_urls: ["showcase1.png", "showcase2.png"],
              hero_image_url: "hero.png",
              category: "Social",
              description: '{"description_overview":"Contacts app"}',
              integration_url: "https://example.com/integration",
              verification_status: "verified",
              supported_countries: ["us", "uk"],
              is_allowed_unlimited_notifications: false,
              max_notifications_per_day: 10,
              app: {
                team: {
                  name: "Test Team",
                },
                rating_sum: 10,
                rating_count: 2,
              },
            },
          ],
        }),
      }));

      const request = new NextRequest(
        "https://cdn.test.com/api/v2/public/app/contacts",
        {
          headers: {
            host: "cdn.test.com",
            "client-version": "2.9.0", // above the minimum version
          },
        },
      );

      const response = await GET(request, { params: { app_id: "contacts" } });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("app_data");
      expect(data.app_data.name).toBe("Contacts App");
    });
  });
});
