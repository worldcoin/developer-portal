import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { NextResponse } from "next/server";
import { getSdk as getAppMetadataSdk } from "./graphql/get-app-metadata.generated";

/**
 * Fetches the list of apps to be shown in the app store
 * @param req
 * Accepts: platform, country, page
 * @param res
 */

export async function GET(
  _: Request,
  { params }: { params: { app_id: string } },
) {
  const app_id = params.app_id;

  const client = await getAPIServiceGraphqlClient();
  // Return the metadata
  const { app_metadata } = await getAppMetadataSdk(client).GetAppMetadata({
    app_id,
  });

  if (!app_metadata || app_metadata.length === 0) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const dataToReturn = app_metadata[0];

  return NextResponse.json(
    { app_data: dataToReturn },
    {
      status: 200,
    },
  );
}
