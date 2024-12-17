import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { ReviewStatusEnum } from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { allowedCommonCharactersRegex } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getConcludeAppReportInvestigationSdk } from "./graphql/conclude-app-report-investigation.generated";

const reviewStatusIterable = Object.values(ReviewStatusEnum);

export const schema = yup.object({
  app_report_id: yup.string().required(),
  reviewed_at: yup.date().required(),
  reviewed_by: yup.string().required(),
  review_status: yup.mixed().oneOf(reviewStatusIterable).required(),
  review_conclusion_reason: yup
    .string()
    .required()
    .matches(allowedCommonCharactersRegex)
    .max(3000),
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

    if (body?.action.name !== "conclude_app_report_investigation") {
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

    const client = await getAPIServiceGraphqlClient();

    const { update_app_report_by_pk } =
      await getConcludeAppReportInvestigationSdk(
        client,
      ).ConcludeAppReportInvestigation({
        app_report_id: parsedParams.app_report_id,
        review_conclusion_reason: parsedParams.review_conclusion_reason,
        review_status: parsedParams.review_status,
        reviewed_by: parsedParams.reviewed_by,
      });

    if (!update_app_report_by_pk) {
      return errorHasuraQuery({
        req,
        detail: "Failed to conclude app report",
        code: "conclude_app_report_investigation_failed",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error concluding app report", { error });

    return errorHasuraQuery({
      req,
      detail: "Unable to conclude app report investigation",
      code: "internal_error",
    });
  }
};
