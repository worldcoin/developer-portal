import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getUpdateAffiliateStatusSdk } from "./graphql/update-affiliate-status.generated";

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

const schema = yup
  .object({
    team_id: yup.string().strict().required(),
    status: yup
      .string()
      .strict()
      .oneOf([...VALID_STATUSES])
      .required(),
  })
  .noUnknown();

export const POST = async (req: NextRequest) => {
  let team_id: string | undefined;

  try {
    const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
    if (!isAuthenticated) {
      return errorResponse;
    }

    const body = await req.json();

    if (body?.action.name !== "update_team_affiliate_status") {
      return errorHasuraQuery({
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    if (
      !["reviewer", "admin"].includes(body.session_variables["x-hasura-role"])
    ) {
      logger.error("Unauthorized access.", {
        role: body.session_variables["x-hasura-role"],
      });
      return errorHasuraQuery({ req });
    }

    const { isValid, parsedParams } = await validateRequestSchema({
      value: body.input,
      schema,
    });

    if (!isValid || !parsedParams) {
      return errorHasuraQuery({
        req,
        detail: "Invalid request body.",
        code: "invalid_request",
      });
    }

    team_id = parsedParams.team_id;
    const status = parsedParams.status;

    if (!team_id) {
      return errorHasuraQuery({
        req,
        detail: "team_id must be set.",
        code: "required",
      });
    }

    const client = await getAPIServiceGraphqlClient();

    const { update_team_by_pk } = await getUpdateAffiliateStatusSdk(
      client,
    ).UpdateAffiliateStatus({
      team_id,
      status,
    });

    if (!update_team_by_pk) {
      return errorHasuraQuery({
        req,
        detail: "Failed to update affiliate status",
        code: "update_affiliate_status_failed",
        team_id,
      });
    }

    logger.info("Affiliate status updated", {
      team_id,
      status,
      updated_by: body.session_variables["x-hasura-role"],
    });

    return NextResponse.json({
      success: true,
      team_id: update_team_by_pk.id,
    });
  } catch (error) {
    logger.error("Error updating affiliate status.", { error, team_id });

    return errorHasuraQuery({
      req,
      detail: "Unable to update affiliate status",
      code: "internal_error",
      team_id,
    });
  }
};
