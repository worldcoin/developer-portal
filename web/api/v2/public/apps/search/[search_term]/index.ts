import { NativeApps } from "@/lib/constants";
import { isValidHostName } from "@/lib/utils";
import { NextResponse } from "next/server";

/**
 * Fetches the list of app ids that match the search term.
 * @param req
 * Accepts: search term, currently runs the search only on the app name.
 * @param res
 */
export async function GET(
  request: Request,
  { params }: { params: { search_term: string } },
) {
  if (!process.env.NEXT_PUBLIC_APP_ENV) {
    return NextResponse.json(
      {
        error: `Invalid Environment Configuration`,
      },
      { status: 400 },
    );
  }

  // We only accept requests through the distribution origin
  if (!isValidHostName(request)) {
    return NextResponse.json(
      {
        error: `Invalid Request Origin, please use ${process.env.NEXT_PUBLIC_IMAGES_CDN_URL}`,
      },
      { status: 400 },
    );
  }

  let search_term = params.search_term;

  let app_ids = await global.OpenSearchClient?.searchApps(
    search_term,
    "verified",
    true,
  );

  if (!app_ids) {
    return NextResponse.json({ app_ids: [] }, { status: 404 });
  }

  const nativeApps = NativeApps[process.env.NEXT_PUBLIC_APP_ENV];

  app_ids = app_ids.map((app_id) => {
    // Native Apps have substituted app_ids
    if (app_id in nativeApps) {
      return nativeApps[app_id].app_id;
    }
    return app_id;
  });

  return NextResponse.json(
    { app_ids },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=5, stale-if-error=86400",
      },
    },
  );
}
