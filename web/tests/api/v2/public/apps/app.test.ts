import { GET } from "@/api/v2/public/app/[app_id]";
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
});
