import { errorHasuraQuery } from "@/api/helpers/errors";
import { invalidateAppCatalogCache } from "@/api/helpers/invalidate-app-catalog-cache";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

// This function serves to invalidate the cache after making changes to app store directory
export const POST = async (req: NextRequest) => {
  if (
    !process.env.ASSETS_S3_REGION ||
    !process.env.CLOUDFRONT_DISTRIBUTION_ID
  ) {
    logger.error("AWS config is not set.");
    return errorHasuraQuery({
      req,
      detail: "AWS config is not set.",
      code: "invalid_config",
    });
  }

  const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
  if (!isAuthenticated) {
    return errorResponse;
  }

  const body = await req.json();
  if (body?.action.name !== "invalidate_cache") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  if (
    !["reviewer", "admin"].includes(body.session_variables["x-hasura-role"])
  ) {
    logger.error("Unauthorized access."),
      { role: body.session_variables["x-hasura-role"] };
    return errorHasuraQuery({ req });
  }

  try {
    await invalidateAppCatalogCache({
      callerReference: `legacy:${Date.now()}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error invalidating cache.", { error });

    return errorHasuraQuery({
      req,
      detail: "Error invalidating cache.",
      code: "internal_server_error",
    });
  }
};
