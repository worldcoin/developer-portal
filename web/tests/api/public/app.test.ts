import { GET } from "@/api/public/app/[app_id]";
import { AppLocaliseKeys } from "@/lib/types";
import { createLocaliseCategory, createLocaliseField } from "@/lib/utils";
import { NextRequest } from "next/server";
import { getSdk as getAppMetadataSdk } from "../../../api/public/app/[app_id]/graphql/get-app-metadata.generated";

// Mock the external dependencies
jest.mock("@/api/helpers/graphql", () => ({
  getAPIServiceGraphqlClient: jest.fn(),
}));

jest.mock(
  "../../../api/public/app/[app_id]/graphql/get-app-metadata.generated",
  () => ({
    getSdk: jest.fn(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [
          {
            name: "Example App",
            app_id: "1",
            logo_img_url: "logo.png",
            showcase_img_urls: ["showcase1.png", "showcase2.png"],
            hero_image_url: "",
            world_app_description:
              "This is an example app designed to showcase the capabilities of our platform.",
            category: "Productivity",
            integration_url: "https://example.com/integration",
            app_website_url: "https://example.com",
            source_code_url: "https://github.com/example/app",
            whitelisted_addresses: ["0x1234", "0x5678"],
            app_mode: "mini-app",
            associated_domains: ["https://worldcoin.org"],
            description:
              '{"description_overview":"fewf","description_how_it_works":"few","description_connect":"fewf"}',
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
  test("Should return correct value", async () => {
    const request = new NextRequest(
      "https://cdn.test.com/api/public/apps?country=US",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );
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
        hero_image_url: "",
        category: createLocaliseCategory("Productivity"),
        integration_url: "https://example.com/integration",
        app_website_url: "https://example.com",
        source_code_url: "https://github.com/example/app",
        associated_domains: ["https://worldcoin.org"],
        team_name: "Example Team",
        whitelisted_addresses: ["0x1234", "0x5678"],
        app_mode: "mini-app",
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
    });
  });

  test("should return 200 with non-empty rankings for valid platform and country parameters", async () => {
    jest.mocked(getAppMetadataSdk).mockImplementation(() => ({
      GetAppMetadata: jest.fn().mockResolvedValue({
        app_metadata: [],
      }),
    }));
    const request = new NextRequest(
      "https://cdn.test.com/api/public/apps?country=US",
      {
        headers: {
          host: "cdn.test.com",
        },
      },
    );
    const response = await GET(request, { params: { app_id: "2" } });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({
      error: "App not found",
    });
  });
});
