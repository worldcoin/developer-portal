import { errorResponse } from "@/api/helpers/errors";
import { isValidRpId } from "@/api/helpers/rp-utils";
import { handleVerifyRequest } from "@/api/helpers/world-id-verification";
import { NextRequest } from "next/server";

/** POST /api/v5/verify/:environment/:rp_id */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ environment: string; rp_id: string }> },
) {
  const { environment, rp_id: rpId } = await props.params;

  if (!isValidRpId(rpId)) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_rp_id",
      detail:
        "Invalid rp_id format. Expected rp_ followed by 16 hex characters.",
      attribute: "rp_id",
      req,
    });
  }

  if (
    environment !== "production" &&
    environment !== "staging" &&
    environment !== "sandbox"
  ) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_environment",
      detail: "Invalid environment. Expected production, staging, or sandbox.",
      attribute: "environment",
      req,
    });
  }

  return handleVerifyRequest(req, rpId, environment);
}
