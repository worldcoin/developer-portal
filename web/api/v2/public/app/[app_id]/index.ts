import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { NativeAppToAppIdMapping, NativeApps } from "@/lib/constants";
import { formatAppMetadata, isValidHostName } from "@/lib/utils";
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
  if (!process.env.APP_ENV) {
    return NextResponse.json(
      {
        error: `Invalid configurations`,
      },
      { status: 400 },
    );
  }

  let app_id = params.app_id;

  // Native Apps have substituted app_ids so we pull their constant ID to get the metadata
  if (app_id in NativeAppToAppIdMapping[process.env.APP_ENV]) {
    app_id = NativeAppToAppIdMapping[process.env.APP_ENV][app_id];
  }

  const client = await getAPIServiceGraphqlClient();
  // Return the metadata
  const { app_metadata } = await getAppMetadataSdk(client).GetAppMetadata({
    app_id,
  });

  // // We only accept requests through the distribution origin
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

  const nativeAppMetadata = NativeApps[process.env.APP_ENV];

  let dataToReturn = formatAppMetadata(app_metadata[0]);

  if (dataToReturn.app_id in nativeAppMetadata) {
    const nativeAppItem = nativeAppMetadata[dataToReturn.app_id];

    dataToReturn = {
      ...dataToReturn,
      app_mode: "native",
      integration_url: nativeAppItem.integration_url,
      app_id: nativeAppItem.app_id,
    };
  }

  return NextResponse.json(
    { app_data: dataToReturn },
    {
      status: 200,
    },
  );
}
