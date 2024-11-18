import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { AppStoreLayout } from "@/app/(temp)/types";
import {
  Layout_App_Collection_Insert_Input,
  Layout_App_Insert_Input,
  Layout_Banner_Collection_Insert_Input,
  Layout_Banner_Insert_Input,
  Layout_Secondary_Category_Insert_Input,
} from "@/graphql/graphql";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getInsertLayoutSdk } from "./grapqhl/insert-layout.generated";
import { AppStoreLayoutSchema } from "./validation";

export const POST = async (req: NextRequest) => {
  const body = await req.json();
  const { isValid, parsedParams } = await validateRequestSchema({
    value: body,
    schema: AppStoreLayoutSchema,
  });

  if (!isValid || !parsedParams) {
    return NextResponse.json({
      status: 400,
      body: {
        error: "Invalid request body.",
      },
    });
  }
  const AppStoreLayoutElements =
    parsedParams.elements as AppStoreLayout["elements"];

  let apps: Layout_App_Insert_Input[] = [];
  let banners: Layout_Banner_Insert_Input[] = [];
  let appCollections: Layout_App_Collection_Insert_Input[] = [];
  let bannerCollections: Layout_Banner_Collection_Insert_Input[] = [];
  let secondaryCategories: Layout_Secondary_Category_Insert_Input[] = [];

  // order of elements in arrays is the order in which they should be displayed
  // indexed are guaranteed to be in ascending order
  // first index value is not guaranteed, e.g. indexes can start from 10 or 69
  // the number can reach values of a few thousand
  AppStoreLayoutElements.forEach((element, topLevelElementIndex) => {
    switch (element.elementType) {
      case "app":
        console.log("App Element");

        apps.push({
          app_id: element.elements.id,
          location_index: topLevelElementIndex,
        });
        break;
      case "banner":
        console.log("Banner Element");

        banners.push({
          location_index: topLevelElementIndex,
          title: element.elements.title,
          title_color_hex: element.elements.titleColorHex,
          subtitle: element.elements.subtitle,
          subtitle_color_hex: element.elements.subtitleColorHex,
          highlight_color_hex: element.elements.highlightColorHex,
          background_color_hex: element.elements.backgroundColorHex,
          background_image_url: element.elements.backgroundImageUrl,
        });
        break;
      case "app-collection":
        console.log("App Collection Element");

        appCollections.push({
          location_index: topLevelElementIndex,
          title: element.title,
          indexed: element.indexed,
          layout_apps: {
            data: element.elements.map((app, jndex) => ({
              app_id: app.id,
              location_index: topLevelElementIndex + jndex + 1,
            })),
          },
        });
        break;
      case "banner-collection":
        console.log("Banner Collection Element");

        bannerCollections.push({
          location_index: topLevelElementIndex,
          title: element.title,
          layout_banners: {
            data: element.elements.map((banner, jndex) => ({
              location_index: topLevelElementIndex + jndex + 1,
              title: banner.title,
              title_color_hex: banner.titleColorHex,
              subtitle: banner.subtitle,
              subtitle_color_hex: banner.subtitleColorHex,
              highlight_color_hex: banner.highlightColorHex,
              background_color_hex: banner.backgroundColorHex,
              background_image_url: banner.backgroundImageUrl,
            })),
          },
        });
        break;
      // case "secondary-category":
      //   console.log("Secondary Category Element");

      //   secondaryCategories.push({
      //     // ...element,
      //     // elements: element.elements.map((secondaryCategory, jndex) => ({
      //     //   ...secondaryCategory,
      //     //   location_index: topLevelElementIndex + jndex + 1,
      //     // })),
      //   });
      //   break;
      default:
        console.log("Unknown Element");
        break;
    }
  });

  const client = await getAPIServiceGraphqlClient();
  const data = await getInsertLayoutSdk(client).InsertLayout({
    layoutApps: apps,
    layoutBanners: banners,
    layoutAppCollections: appCollections,
    layoutBannerCollections: bannerCollections,
    layoutSecondaryCategories: {},
  });

  return NextResponse.json(data);
};

export const GET = async (req: NextRequest) => {
  return NextResponse.json({ success: true });
};
