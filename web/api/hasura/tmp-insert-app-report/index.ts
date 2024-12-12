import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { PurposeEnum, ViolationEnum } from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getCreateAppSdk } from "./graphql/create-app-report.generated";

export const schema = yup.object({
  app_id: yup.string().required("App ID is required"),
  user_id: yup.string().required("User ID is required"),
  reporter_email: yup.string().required("Reporter email is required"),
  details: yup.string().nullable(),
});

export const POST = async (req: NextRequest) => {
  try {
    if (!protectInternalEndpoint(req)) {
      return errorHasuraQuery({
        req,
        detail: "Internal endpoint",
        code: "internal_endpoint",
      });
    }

    const body = await req.json();

    if (body?.action.name !== "create_app_report") {
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
    console.log(body);
    const { isValid, parsedParams } = await validateRequestSchema({
      value: body.input.input,
      schema,
    });

    if (!isValid || !parsedParams) {
      return errorHasuraQuery({
        req,
        detail: "Invalid request body.",
        code: "invalid_request",
      });
    }

    const client = await getAPIServiceGraphqlClient();

    const { insert_app_report } = await getCreateAppSdk(client).CreateAppReport(
      {
        app_id: parsedParams.app_id,
        user_id: parsedParams.user_id,
        reporter_email: parsedParams.reporter_email,
        purpose: PurposeEnum.Other,
        violation: ViolationEnum.CoreFunctionality,
        details: parsedParams.details,
        illegal_content_category: null,
        illegal_content_laws_broken: null,
        illegal_content_description: null,
        illegal_content_location: null,
      },
    );

    if (!insert_app_report) {
      return errorHasuraQuery({
        req,
        detail: "Failed to create app report",
        code: "create_app_report_failed",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error creating app report", { error });

    return errorHasuraQuery({
      req,
      detail: "Unable to create app report",
      code: "internal_error",
    });
  }
};
