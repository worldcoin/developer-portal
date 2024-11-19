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
import { parseLocale } from "@/lib/languages";
import { NextRequest, NextResponse } from "next/server";
import {
  getSdk as getGetLayoutSdk,
  GetLayoutQuery,
} from "./graphql/get-layout.generated";
import {
  getSdk as getInsertLayoutSdk,
  InsertLayoutMutation,
} from "./graphql/insert-layout.generated";
import { AppStoreLayoutSchema } from "./post-app-store-layout-validation";

const resolveLayoutElements = (elements: AppStoreLayout["elements"]) => {
  let apps: Layout_App_Insert_Input[] = [];
  let banners: Layout_Banner_Insert_Input[] = [];
  let appCollections: Layout_App_Collection_Insert_Input[] = [];
  let bannerCollections: Layout_Banner_Collection_Insert_Input[] = [];
  let secondaryCategories: Layout_Secondary_Category_Insert_Input[] = [];
  elements.forEach((element, topLevelElementIndex) => {
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
      case "secondary-category":
        console.log("Secondary Category Element");

        const resolvedLayoutElements = resolveLayoutElements(element.elements);

        secondaryCategories.push({
          location_index: topLevelElementIndex,
          title: element.title,
          subtitle: element.subtitle,
          background_color_hex: element.backgroundColorHex,
          background_image_url: element.backgroundImageUrl,
          layout_apps: { data: resolvedLayoutElements.layoutApps },
          layout_banners: {
            data: resolvedLayoutElements.layoutBanners,
          },
          layout_app_collections: {
            data: resolvedLayoutElements.layoutAppCollections,
          },
          layout_banner_collections: {
            data: resolvedLayoutElements.layoutBannerCollections,
          },
        });
        break;
      default:
        console.log("Unknown Element");
        break;
    }
  });
  return {
    layoutApps: apps,
    layoutBanners: banners,
    layoutAppCollections: appCollections,
    layoutBannerCollections: bannerCollections,
    layoutSecondaryCategories: secondaryCategories,
  } as const;
};

export const POST = async (
  req: NextRequest,
): Promise<NextResponse<{ layout_id: string } | { error: string }>> => {
  let body = {};
  try {
    body = await req.json();
  } catch (error) {
    console.log("app-store-layout - error parsing req body", {
      error: JSON.stringify(error),
      body,
    });
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const { isValid, parsedParams: parsedBody } = await validateRequestSchema({
    value: body,
    schema: AppStoreLayoutSchema,
  });

  if (!isValid || !parsedBody) {
    console.log("app-store-layout - invalid request body", { body });
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const AppStoreLayoutElements =
    parsedBody.elements as AppStoreLayout["elements"];
  const resolvedLayoutElements = resolveLayoutElements(AppStoreLayoutElements);

  const client = await getAPIServiceGraphqlClient();
  let insertLayoutData = {} as InsertLayoutMutation;
  try {
    insertLayoutData = await getInsertLayoutSdk(client).InsertLayout(
      resolvedLayoutElements,
    );
  } catch (error) {
    console.error("app-store-layout - error inserting layout", {
      error: JSON.stringify(error),
      parsedBody,
      resolvedLayoutElements,
    });
  }

  if (
    !insertLayoutData.insert_layout_one ||
    !insertLayoutData.insert_layout_one.id
  ) {
    return NextResponse.json(
      {
        error: "app-store-layout - unknown error inserting layout.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    layout_id: insertLayoutData.insert_layout_one.id,
  });
};

export const GET = async (
  req: NextRequest,
): Promise<
  NextResponse<GetLayoutQuery["layout_by_pk"] | { error: string }>
> => {
  const layout_id = req.nextUrl.searchParams.get("layout_id");
  const headers = req.headers;
  const locale = parseLocale(headers.get("x-accept-language") ?? "");

  if (!layout_id) {
    console.log("app-store-layout - no layout_id provided.");
    return NextResponse.json(
      {
        error: "Invalid request, missing layout_id param.",
      },
      { status: 400 },
    );
  }

  const client = await getAPIServiceGraphqlClient();
  let layoutData = {} as GetLayoutQuery;
  try {
    layoutData = await getGetLayoutSdk(client).GetLayout({ layout_id, locale });
  } catch (error) {
    console.error("app-store-layout - error getting layout", {
      error: JSON.stringify(error),
      layout_id,
      locale,
    });
  }

  const layout = {
    ...layoutData.layout_by_pk!,
  } as const;

  return NextResponse.json(layout);
};
