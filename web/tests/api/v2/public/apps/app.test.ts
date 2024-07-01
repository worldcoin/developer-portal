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
            app_id: "1",
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
      }),
    })),
  }),
);

describe("/api/public/app/[app_id]", () => {
  test("Returns correct value for valid app", async () => {
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
        logo_img_url: "https://cdn.test.com/1/logo.png",
        showcase_img_urls: [
          "https://cdn.test.com/1/showcase1.png",
          "https://cdn.test.com/1/showcase2.png",
        ],
        hero_image_url: "https://cdn.test.com/1/hero.png",
        category: "Productivity",
        integration_url: "https://example.com/integration",
        app_website_url: "https://example.com",
        source_code_url: "https://github.com/example/app",
        team_name: "Example Team",
        whitelisted_addresses: ["0x1234", "0x5678"],
        app_mode: "mini-app",
        ratings_external_nullifier:
          "0x00051f128f73eec6f444e98dca57697f9cce04fb3f2e0e63dea5351ccde35b8e",
        support_email: "andy@gmail.com",
        supported_countries: ["us"],
        supported_languages: ["en", "es"],
        app_rating: 3.4,
        unique_users: 0,
        description: {
          how_it_works: "few",
          how_to_connect: "fewf",
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
      }),
    }));

    const response = await GET(request, { params: { app_id: "TEST_APP" } });
    expect(await response.json()).toEqual({
      app_data: {
        name: "Example App",
        app_id: "TEST_APP",
        logo_img_url: "https://cdn.test.com/app_test_123/logo.png",
        hero_image_url: "https://cdn.test.com/app_test_123/hero.png",
        showcase_img_urls: [
          "https://cdn.test.com/app_test_123/showcase1.png",
          "https://cdn.test.com/app_test_123/showcase2.png",
        ],
        team_name: "Example Team",
        app_mode: "native",
        integration_url: "worldapp://test",
        app_website_url: "https://example.com",
        source_code_url: "https://github.com/example/app",
        ratings_external_nullifier:
          "0x00ca597c4f12f9f85a633bb04cfdc877af7c2d91a6c1c7fe45031b495a227a58",
        support_email: "andy@gmail.com",
        supported_countries: ["us"],
        supported_languages: ["en", "es"],
        app_rating: 3.4,
        unique_users: 0,
        whitelisted_addresses: ["0x1234", "0x5678"],
        category: "Social",
        description: {
          how_it_works: "few",
          how_to_connect: "fewf",
          overview: "fewf",
        },
        world_app_button_text: "Use Integration",
        world_app_description:
          "This is an example app designed to showcase the capabilities of our platform.",
      },
    });
  });
});
