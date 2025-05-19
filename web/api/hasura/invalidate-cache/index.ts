import { errorHasuraQuery } from "@/api/helpers/errors";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
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

  const client = new CloudFrontClient({
    region: process.env.ASSETS_S3_REGION,
  });

  const input = {
    DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
    InvalidationBatch: {
      Paths: {
        Quantity: 2,
        Items: ["/api/v2/public/app/*", "/api/v2/public/apps*"],
      },
      CallerReference: Date.now().toString(),
    },
  };

  const command = new CreateInvalidationCommand(input);
  await client.send(command);

  return NextResponse.json({ success: true });
};
