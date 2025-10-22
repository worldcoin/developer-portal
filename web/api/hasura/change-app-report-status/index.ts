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

const updateSchema = yup
  .object({
    app_report_id: yup.string().required(),
    reviewed_by: yup.string().nullable(),
    review_status: yup.mixed().oneOf(reviewStatusIterable).required(),
    review_conclusion_reason: yup
      .string()
      .matches(allowedCommonCharactersRegex)
      .nullable()
      .max(3000),
  })
  .noUnknown();

export const schema = yup.array().of(updateSchema).min(1).required();

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
      value: body.input.input.updates,
      schema,
    });

    if (!isValid || !parsedParams) {
      return errorHasuraQuery({
        req,
        detail: "Invalid request body.",
        code: "invalid_request",
      });
    }

    // Validate each update in the array
    for (const update of parsedParams) {
      // reviewed_by can only be null if the status is appealed
      if (
        !update.reviewed_by &&
        (update.review_status as ReviewStatusEnum) !== ReviewStatusEnum.Appealed
      ) {
        return errorHasuraQuery({
          req,
          detail: "Reviewed by is required if status is not appealed",
          code: "invalid_request",
        });
      }
    }

    const client = await getAPIServiceGraphqlClient();
    const reviewed_at = new Date().toISOString();

    // Prepare updates array for GraphQL mutation
    const updates = parsedParams.map((update) => ({
      where: { id: { _eq: update.app_report_id } },
      _set: {
        reviewed_at:
          update.review_status === ReviewStatusEnum.Appealed
            ? null
            : reviewed_at,
        reviewed_by: update.reviewed_by,
        review_status: update.review_status,
        review_conclusion_reason: update.review_conclusion_reason,
      },
    }));

    const { update_app_report_many } = await getChangeAppReportStatusSdk(
      client,
    ).ChangeAppReportStatus({
      updates,
    });

    if (!update_app_report_many || update_app_report_many.length === 0) {
      return errorHasuraQuery({
        req,
        detail: "Failed to update app reports",
        code: "conclude_app_report_investigation_failed",
      });
    }

    // Check if all updates were successful
    const totalAffectedRows = update_app_report_many.reduce(
      (sum, result) => sum + (result?.affected_rows || 0),
      0,
    );

    if (totalAffectedRows !== parsedParams.length) {
      return errorHasuraQuery({
        req,
        detail: "Some app reports failed to update",
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
