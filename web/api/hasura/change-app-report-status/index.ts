import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { ReviewStatusEnum } from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { allowedCommonCharactersRegex } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getChangeAppReportStatusSdk } from "./graphql/change-app-report-status.generated";

const reviewStatusIterable = Object.values(ReviewStatusEnum);

export const schema = yup.object({
  app_report_id: yup.string().required(),
  reviewed_by: yup.string().nullable(),
  review_status: yup.mixed().oneOf(reviewStatusIterable).required(),
  review_conclusion_reason: yup
    .string()
    .matches(allowedCommonCharactersRegex)
    .nullable()
    .max(3000),
});

export const POST = async (req: NextRequest) => {
  try {
    const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
    if (!isAuthenticated) {
      return errorResponse;
    }

    const body = await req.json();

    if (body?.action.name !== "change_app_report_status") {
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
    // reviewed_by can only be null if the status is appealed
    if (
      !parsedParams.reviewed_by &&
      (parsedParams.review_status as ReviewStatusEnum) !==
        ReviewStatusEnum.Appealed
    ) {
      return errorHasuraQuery({
        req,
        detail: "Reviewed by is required if status is not appealed",
        code: "invalid_request",
      });
    }

    const client = await getAPIServiceGraphqlClient();
    const reviewed_at =
      parsedParams.review_status === ReviewStatusEnum.Appealed
        ? undefined
        : new Date().toISOString();

    const { update_app_report_by_pk } = await getChangeAppReportStatusSdk(
      client,
    ).ChangeAppReportStatus({
      app_report_id: parsedParams.app_report_id,
      review_conclusion_reason: parsedParams.review_conclusion_reason,
      review_status: parsedParams.review_status,
      reviewed_by: parsedParams.reviewed_by,
      reviewed_at,
    });

    if (!update_app_report_by_pk) {
      return errorHasuraQuery({
        req,
        detail: "Failed to update app report",
        code: "conclude_app_report_investigation_failed",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error concluding app report", { error });

    return errorHasuraQuery({
      req,
      detail: "Unable to update app report",
      code: "internal_error",
    });
  }
};
