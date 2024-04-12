import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getCDNImageUrl, isValidHostName } from "@/lib/utils";
import { NextResponse } from "next/server";
import { getSdk as getAppMetadataSdk } from "./graphql/get-app-metadata.generated";

/**
 * Fetches the list of apps to be shown in the app store
 * @param req
 * Accepts: platform, country, page
 * @param res
 */

export async function GET(
  request: Request,
  { params }: { params: { app_id: string } },
) {
  const app_id = params.app_id;

  const client = await getAPIServiceGraphqlClient();
  // Return the metadata
  const { app_metadata } = await getAppMetadataSdk(client).GetAppMetadata({
    app_id,
  });

  // We only accept requests through the distribution origin
  if (!isValidHostName(request)) {
    return NextResponse.json(
      {
        error: `Invalid Request Origin, please use ${process.env.NEXT_PUBLIC_VERIFIED_IMAGES_CDN_URL}`,
      },
      { status: 400 },
    );
  }

  if (!app_metadata || app_metadata.length === 0) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const { app, ...appMetadataReturned } = app_metadata[0];
  const dataToReturn = {
    ...appMetadataReturned,
    description: JSON.parse(appMetadataReturned.description),
    logo_img_url: getCDNImageUrl(app_id, appMetadataReturned.logo_img_url),
    hero_image_url: appMetadataReturned.hero_image_url
      ? getCDNImageUrl(app_id, appMetadataReturned?.hero_image_url)
      : "",
    showcase_img_urls: appMetadataReturned.showcase_img_urls
      ? appMetadataReturned.showcase_img_urls?.map((showcase_img: string) =>
          getCDNImageUrl(app_id, showcase_img),
        )
      : [],
    team_name: app.team.name,
  };

  return NextResponse.json(
    { app_data: dataToReturn },
    {
      status: 200,
    },
  );
}
