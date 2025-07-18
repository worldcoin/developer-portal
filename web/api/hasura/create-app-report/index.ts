import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  IllegalContentSubCategoryEnum,
  PurposeEnum,
  ViolationEnum,
} from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { allowedCommonCharactersRegex } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getCreateAppSdk } from "./graphql/create-app-report.generated";

const purposeIterable = Object.values(PurposeEnum);
const violationIterable = Object.values(ViolationEnum);
const illegalContentSubCategoryIterable = Object.values(
  IllegalContentSubCategoryEnum,
);

export const schema = yup
  .object({
    app_id: yup.string().required("App ID is required"),
    user_pkid: yup.string().required("User PKID is required"),
    reporter_email: yup.string().required("Reporter email is required"),
    purpose: yup
      .string()
      .oneOf(purposeIterable)
      .required("Purpose is required"),
    violation: yup.string().oneOf(violationIterable).nullable(),
    details: yup
      .string()
      .nullable()
      .matches(allowedCommonCharactersRegex)
      .max(1500),
    illegal_content_sub_category: yup
      .string()
      .oneOf(illegalContentSubCategoryIterable)
      .nullable(),
    illegal_content_legal_reason: yup
      .string()
      .nullable()
      .matches(allowedCommonCharactersRegex)
      .max(1500),
    illegal_content_description: yup
      .string()
      .nullable()
      .matches(allowedCommonCharactersRegex)
      .max(1500),
    illegal_content_country_code: yup.string().nullable().max(2),
  })
  .noUnknown()
  .test("final-validation", "Invalid input", (values) => {
    if (
      (values.purpose === PurposeEnum.TosViolation ||
        values.purpose === PurposeEnum.Other) &&
      (!values.violation || !values.details)
    ) {
      throw new yup.ValidationError(
        "Violation and details are required when purpose is TOS_VIOLATION or OTHER",
        values,
        "purpose",
      );
    }
    if (
      values.purpose === PurposeEnum.IllegalContent &&
      (!values.illegal_content_sub_category ||
        !values.illegal_content_description ||
        !values.illegal_content_country_code)
    ) {
      throw new yup.ValidationError(
        "Illegal content category, description and location are required when purpose is ILLEGAL_CONTENT",
        values,
        "purpose",
      );
    }
    return true;
  });

type CreateAppReport = yup.InferType<typeof schema>;

const transformAppReport = (values: CreateAppReport): CreateAppReport => {
  if (
    (values.purpose === PurposeEnum.TosViolation ||
      values.purpose === PurposeEnum.Other) &&
    (values.illegal_content_sub_category ||
      values.illegal_content_description ||
      values.illegal_content_country_code)
  ) {
    return {
      ...values,
      illegal_content_sub_category: null,
      illegal_content_description: null,
      illegal_content_country_code: null,
    };
  }
  if (
    values.purpose === PurposeEnum.IllegalContent &&
    (values.violation || values.details)
  ) {
    return {
      ...values,
      violation: null,
      details: null,
    };
  }
  return values;
};

export const POST = async (req: NextRequest) => {
  let app_id: string | undefined;

  try {
    const { isAuthenticated, errorResponse } = protectInternalEndpoint(req);
    if (!isAuthenticated) {
      return errorResponse;
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
    const transformed = transformAppReport(parsedParams);

    app_id = transformed.app_id;

    const client = await getAPIServiceGraphqlClient();

    const { insert_app_report } = await getCreateAppSdk(client).CreateAppReport(
      {
        app_id,
        user_pkid: transformed.user_pkid,
        reporter_email: transformed.reporter_email,
        purpose: transformed.purpose,
        violation: transformed.violation,
        details: transformed.details,
        illegal_content_sub_category: transformed.illegal_content_sub_category,
        illegal_content_legal_reason: transformed.illegal_content_legal_reason,
        illegal_content_description: transformed.illegal_content_description,
        illegal_content_country_code: transformed.illegal_content_country_code,
      },
    );

    if (!insert_app_report) {
      return errorHasuraQuery({
        req,
        detail: "Failed to create app report",
        code: "create_app_report_failed",
        app_id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error creating app report", { error, app_id });

    return errorHasuraQuery({
      req,
      detail: "Unable to create app report",
      code: "internal_error",
      app_id,
    });
  }
};
