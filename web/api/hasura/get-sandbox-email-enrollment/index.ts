import { getSdk as getSandboxEmailEnrollmentSdk } from "@/api/hasura/get-sandbox-email-enrollment/graphql/get-sandbox-email-enrollment.generated";
import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

/**
 * Hasura action handler: returns whether the caller is enrolled in sandbox for
 * a team. Presence of a sandbox_email_enrollment row is the boolean.
 */
export const POST = async (req: NextRequest) => {
  let team_id: string | undefined;

  try {
    const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
    if (!isAuthenticated) {
      return errorResponse;
    }

    const body = await req.json();

    if (body?.action.name !== "get_sandbox_email_enrollment") {
      return errorHasuraQuery({
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    const userId = body.session_variables["x-hasura-user-id"];
    if (!userId) {
      return errorHasuraQuery({
        req,
        detail: "userId must be set.",
        code: "required",
      });
    }

    team_id = body.input.team_id;
    if (!team_id) {
      return errorHasuraQuery({
        req,
        detail: "team_id must be set.",
        code: "required",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const { sandbox_email_enrollment, team } =
      await getSandboxEmailEnrollmentSdk(client).GetSandboxEmailEnrollment({
        team_id,
        user_id: userId,
      });

    if (team.length === 0) {
      return errorHasuraQuery({
        req,
        detail: "Team not found or user is not a member.",
        code: "not_found",
        team_id,
      });
    }

    const enrollment = sandbox_email_enrollment[0] ?? null;

    return NextResponse.json({
      enrolled: Boolean(enrollment),
      enrollment,
    });
  } catch (error) {
    logger.error("Error fetching sandbox email enrollment", {
      error,
      team_id,
    });

    return errorHasuraQuery({
      req,
      detail: "Failed to fetch sandbox email enrollment.",
      code: "internal_error",
      team_id,
    });
  }
};
