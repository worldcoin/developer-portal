import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  AppStoreLayout,
  AppStoreLayoutBannerElement,
  AppStoreLayoutSecondaryCategoryElement,
} from "@/app/(temp)/types";
import {
  Layout_App_Collection_Insert_Input,
  Layout_App_Insert_Input,
  Layout_Banner_Collection_Insert_Input,
  Layout_Banner_Insert_Input,
  Layout_Insert_Input,
  Layout_Secondary_Category_Insert_Input,
} from "@/graphql/graphql";
import { parseLocale } from "@/lib/languages";
import { NextRequest, NextResponse } from "next/server";
import {
  getSdk as getGetLatestLayoutSdk,
  GetLatestLayoutQuery,
} from "./graphql/get-latest-layout.generated";
import {
  getSdk as getInsertLayoutSdk,
  InsertLayoutMutation,
} from "./graphql/insert-layout.generated";
import { AppStoreLayoutSchema } from "./post-app-store-layout-validation";

const resolveLayoutElements = (
  elements: AppStoreLayout[number]["elements"],
) => {
  let apps: Layout_App_Insert_Input[] = [];
  let banners: Layout_Banner_Insert_Input[] = [];
  let appCollections: Layout_App_Collection_Insert_Input[] = [];
  let bannerCollections: Layout_Banner_Collection_Insert_Input[] = [];
  let secondaryCategories: Layout_Secondary_Category_Insert_Input[] = [];
  elements.forEach((element, topLevelElementIndex) => {
    switch (element.elementType) {
      case "app":
        apps.push({
          app_id: element.elements.id,
          location_index: topLevelElementIndex,
        });
        break;
      case "banner":
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
        const resolvedLayoutElements = resolveLayoutElements(element.elements);

        secondaryCategories.push({
          location_index: topLevelElementIndex,
          title: element.title,
          subtitle: element.subtitle,
          background_color_hex: element.backgroundColorHex,
          background_image_url: element.backgroundImageUrl,
          layout_apps: { data: resolvedLayoutElements.layout_apps },
          layout_banners: {
            data: resolvedLayoutElements.layout_banners,
          },
          layout_app_collections: {
            data: resolvedLayoutElements.layout_app_collections,
          },
          layout_banner_collections: {
            data: resolvedLayoutElements.layout_banner_collections,
          },
        });
        break;
      default:
        console.log("Unknown Element", element);
        break;
    }
  });
  return {
    layout_apps: apps,
    layout_banners: banners,
    layout_app_collections: appCollections,
    layout_banner_collections: bannerCollections,
    layout_secondary_categories: secondaryCategories,
  } as const;
};

const resolveLayout = (appStoreLayout: AppStoreLayout): Layout_Insert_Input => {
  let mappedLayout = [] as {
    location_index: number;
    category: string;
    layout_apps: { data: Layout_App_Insert_Input[] };
    layout_banners: { data: Layout_Banner_Insert_Input[] };
    layout_app_collections: { data: Layout_App_Collection_Insert_Input[] };
    layout_banner_collections: {
      data: Layout_Banner_Collection_Insert_Input[];
    };
    layout_secondary_categories: {
      data: Layout_Secondary_Category_Insert_Input[];
    };
  }[];

  appStoreLayout.forEach((categoryLayout, index) => {
    const {
      layout_apps,
      layout_banners,
      layout_app_collections,
      layout_banner_collections,
      layout_secondary_categories,
    } = resolveLayoutElements(categoryLayout.elements);

    mappedLayout.push({
      location_index: index,
      category: categoryLayout.category,
      layout_apps: { data: layout_apps },
      layout_banners: { data: layout_banners },
      layout_app_collections: { data: layout_app_collections },
      layout_banner_collections: { data: layout_banner_collections },
      layout_secondary_categories: { data: layout_secondary_categories },
    });
  });
  return { layout_categories: { data: mappedLayout } };
};

export const POST = async (
  req: NextRequest,
): Promise<NextResponse<{ layout_id: string } | { error: string }>> => {
  let body = {};
  try {
    body = await req.json();
  } catch (error) {
    console.error("app-store-layout POST - error parsing req body", {
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
    console.error("app-store-layout POST - invalid request body", { body });
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      { status: 400 },
    );
  }

  const appStoreLayout = parsedBody as AppStoreLayout;
  const resolvedLayout = resolveLayout(appStoreLayout);

  const client = await getAPIServiceGraphqlClient();
  let insertLayoutData = {} as InsertLayoutMutation;
  try {
    insertLayoutData = await getInsertLayoutSdk(client).InsertLayout({
      layout: resolvedLayout,
    });
  } catch (error) {
    console.error("app-store-layout POST - error inserting layout", {
      error: JSON.stringify(error),
      parsedBody,
      resolvedLayout,
    });
    return NextResponse.json(
      {
        error: "Unknown error inserting layout.",
      },
      { status: 500 },
    );
  }

  if (
    !insertLayoutData.insert_layout_one ||
    !insertLayoutData.insert_layout_one.id
  ) {
    return NextResponse.json(
      {
        error: "Unknown error inserting layout.",
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    layout_id: insertLayoutData.insert_layout_one.id,
  });
};

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

const sortByLocationIndex = <
  A extends { location_index: number },
  B extends { location_index: number },
>(
  a: A,
  b: B,
) => a.location_index - b.location_index;

const mapCategoryElementToResponse = (
  element:
    | GetLatestLayoutQuery["layout"][number]["layout_categories"][number]["layout_apps"][number]
    | GetLatestLayoutQuery["layout"][number]["layout_categories"][number]["layout_banners"][number]
    | GetLatestLayoutQuery["layout"][number]["layout_categories"][number]["layout_app_collections"][number]
    | GetLatestLayoutQuery["layout"][number]["layout_categories"][number]["layout_banner_collections"][number]
    | GetLatestLayoutQuery["layout"][number]["layout_categories"][number]["layout_secondary_categories"][number],
): Pick<AppStoreLayout[number], "elements">["elements"][number] | undefined => {
  switch (element.__typename) {
    case "layout_app":
      return {
        elementType: "app",
        elements: element.app.app_metadata[0],
      };
    case "layout_banner":
      return {
        elementType: "banner",
        elements: {
          title: element.title,
          titleColorHex: element.title_color_hex,
          subtitle: element.subtitle,
          subtitleColorHex: element.subtitle_color_hex,
          highlightColorHex: element.highlight_color_hex,
          backgroundColorHex: element?.background_color_hex ?? undefined,
          backgroundImageUrl: element?.background_image_url ?? undefined,
        } as AppStoreLayoutBannerElement["elements"],
      };
    case "layout_app_collection":
      return {
        elementType: "app-collection",
        title: element.title,
        indexed: element.indexed,
        elements: element.layout_apps
          .toSorted(sortByLocationIndex)
          .map((app) => app.app.app_metadata[0] as any),
      };
    case "layout_banner_collection":
      return {
        elementType: "banner-collection",
        title: element.title,
        elements: element.layout_banners.toSorted(sortByLocationIndex).map(
          (banner) =>
            ({
              title: banner.title,
              titleColorHex: banner.title_color_hex,
              subtitle: banner.subtitle,
              subtitleColorHex: banner.subtitle_color_hex,
              highlightColorHex: banner.highlight_color_hex,
              backgroundColorHex: banner.background_color_hex ?? undefined,
              backgroundImageUrl: banner.background_image_url ?? undefined,
            }) as AppStoreLayoutBannerElement["elements"],
        ),
      };
    case "layout_secondary_category":
      const secondaryCategoryElements = mapDbCategoryToResponse({
        location_index: element.location_index,
        layout_apps: element.layout_apps,
        layout_banners: element.layout_banners,
        layout_app_collections: element.layout_app_collections,
        layout_banner_collections: element.layout_banner_collections,
      } as Parameters<typeof mapDbCategoryToResponse>[0]);

      return {
        elementType: "secondary-category",
        title: element.title,
        subtitle: element.subtitle,
        backgroundColorHex: element?.background_color_hex ?? undefined,
        backgroundImageUrl: element?.background_image_url ?? undefined,
        elements:
          secondaryCategoryElements.elements as AppStoreLayoutSecondaryCategoryElement["elements"],
      } as AppStoreLayoutSecondaryCategoryElement;
    default:
      console.error("Unknown Element", element);
      return;
  }
};

const mapDbCategoryToResponse = (
  category: Partial<
    GetLatestLayoutQuery["layout"][number]["layout_categories"][number]
  >,
): AppStoreLayout[number] => {
  let appStoreElements: AppStoreLayout[number]["elements"] = [];

  let topLevelSortedElements = [
    category.layout_apps,
    category.layout_banners,
    category.layout_app_collections,
    category.layout_banner_collections,
    category.layout_secondary_categories,
  ]
    .flat()
    .filter(isDefined)
    .toSorted(sortByLocationIndex);

  topLevelSortedElements.forEach((element) => {
    const mappedElement = mapCategoryElementToResponse(element);
    if (!mappedElement) return;
    appStoreElements.push(mappedElement);
  });
  return { category: category?.category || "", elements: appStoreElements };
};

export const GET = async (
  req: NextRequest,
): Promise<NextResponse<AppStoreLayout | { error: string }>> => {
  const headers = req.headers;
  const locale = parseLocale(headers.get("x-accept-language") ?? "");

  const client = await getAPIServiceGraphqlClient();
  let layoutData = {} as GetLatestLayoutQuery;
  try {
    layoutData = await getGetLatestLayoutSdk(client).GetLatestLayout({
      locale,
    });
  } catch (error) {
    console.error("app-store-layout GET - error getting layout", {
      error: JSON.stringify(error),
      locale,
    });
    return NextResponse.json(
      {
        error: "Unknown error getting layout.",
      },
      { status: 500 },
    );
  }

  const layout: AppStoreLayout = layoutData.layout[0].layout_categories.map(
    mapDbCategoryToResponse,
  );

  return NextResponse.json(layout);
};
