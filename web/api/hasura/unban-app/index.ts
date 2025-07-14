import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getUnbanAppSdk } from "./graphql/unban-app.generated";

const schema = yup
  .object({
    app_id: yup.string().strict().required(),
  })
  .noUnknown();

export const POST = async (req: NextRequest) => {
  let app_id: string | undefined;
  try {
    const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
    if (!isAuthenticated) {
      return errorResponse;
    }

    const body = await req.json();

    if (body?.action.name !== "unban_app") {
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

    app_id = parsedParams.app_id;

    if (!app_id) {
      return errorHasuraQuery({
        req,
        detail: "app_id must be set.",
        code: "required",
      });
    }

    const client = await getAPIServiceGraphqlClient();

    const { update_app_by_pk } = await getUnbanAppSdk(client).UnbanApp({
      app_id,
    });

    if (!update_app_by_pk) {
      return errorHasuraQuery({
        req,
        detail: "Failed to unban app",
        code: "unban_app_failed",
        app_id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error unbanning app.", { error, app_id });

    return errorHasuraQuery({
      req,
      detail: "Unable to unban app",
      code: "internal_error",
      app_id,
    });
  }
};
