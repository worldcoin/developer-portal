import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { isValidRpId } from "@/api/helpers/rp-utils";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getRpUsageSdk } from "./graphql/get-rp-usage.generated";

const MAX_RANGE_SECONDS = 31 * 24 * 60 * 60;

const schema = yup
  .object({
    rp_id: yup.string().strict().required(),
    from: yup.number().strict().integer().min(0).required(),
    to: yup.number().strict().integer().min(0).required(),
    // Not strict: strict mode skips the default.
    environment: yup
      .string()
      .oneOf(["production", "staging"])
      .default("production"),
  })
  .noUnknown();

/**
 * POST /api/_bot-fence/rp-usage
 *
 * Counts new nullifiers for Bot Fence actions (`wid/waf/<window>/<index>`) of one RP in
 * [from, to), as unix seconds. Returns a count only, never nullifier values.
 * Authenticated with BOT_FENCE_USAGE_TOKEN, not INTERNAL_ENDPOINTS_SECRET.
 */
export async function POST(req: NextRequest) {
  const { isAuthenticated, errorResponse: authError } = protectInternalEndpoint(
    req,
    process.env.BOT_FENCE_USAGE_TOKEN,
  );
  if (!isAuthenticated) {
    return authError;
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return errorResponse({
      statusCode: 400,
      code: "invalid_request",
      detail: "Invalid JSON in request body",
      attribute: null,
      req,
    });
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });
  if (!isValid) {
    return handleError(req);
  }

  const { rp_id, from, to, environment } = parsedParams;

  if (!isValidRpId(rp_id)) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_rp_id",
      detail: "Invalid rp_id format.",
      attribute: "rp_id",
      req,
    });
  }

  if (from >= to || to - from > MAX_RANGE_SECONDS) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_range",
      detail:
        "`from` must be before `to`, and the range must be at most 31 days.",
      attribute: "to",
      req,
    });
  }

  try {
    const client = await getAPIServiceGraphqlClient();
    const { nullifier_v4_aggregate } = await getRpUsageSdk(client).GetRpUsage({
      rp_id,
      environment,
      from: new Date(from * 1000).toISOString(),
      to: new Date(to * 1000).toISOString(),
    });

    const aggregate = nullifier_v4_aggregate.aggregate;
    const firstCreatedAt = aggregate?.min?.created_at;

    return NextResponse.json({
      rp_id,
      environment,
      from,
      to,
      count: aggregate?.count ?? 0,
      first_created_at: firstCreatedAt
        ? Math.floor(Date.parse(firstCreatedAt) / 1000)
        : null,
    });
  } catch (error) {
    logger.error("Error counting Bot Fence RP usage", {
      error: error instanceof Error ? error.message : String(error),
      rp_id,
    });

    return errorResponse({
      statusCode: 500,
      code: "internal_error",
      detail: "Internal server error.",
      attribute: null,
      req,
    });
  }
}
