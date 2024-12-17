import { errorHasuraQuery } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import {
  IllegalContentCategoryEnum,
  PurposeEnum,
  ViolationEnum,
} from "@/graphql/graphql";
import { logger } from "@/lib/logger";
import { allowedCommonCharactersRegex } from "@/lib/schema";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getCreateAppSdk } from "./graphql/create-app-report.generated";

// const reviewStatusIterable = Object.values(ReviewStatusEnum);
const purposeIterable = Object.values(PurposeEnum);
const violationIterable = Object.values(ViolationEnum);
const illegalContentCategoryIterable = Object.values(
  IllegalContentCategoryEnum,
);

export const schema = yup
  .object({
    app_id: yup.string().required("App ID is required"),
    user_id: yup.string().required("User ID is required"),
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
    illegal_content_category: yup
      .string()
      .oneOf(illegalContentCategoryIterable)
      .nullable(),
    illegal_content_laws_broken: yup
      .string()
      .nullable()
      .matches(allowedCommonCharactersRegex)
      .max(1500),
    illegal_content_description: yup
      .string()
      .nullable()
      .matches(allowedCommonCharactersRegex)
      .max(1500),
    illegal_content_location: yup
      .string()
      .nullable()
      .matches(allowedCommonCharactersRegex)
      .max(1500),
  })
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
      (!values.illegal_content_category ||
        !values.illegal_content_description ||
        !values.illegal_content_location)
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
    (values.illegal_content_category ||
      values.illegal_content_description ||
      values.illegal_content_location)
  ) {
    return {
      ...values,
      illegal_content_category: null,
      illegal_content_description: null,
      illegal_content_location: null,
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

    const client = await getAPIServiceGraphqlClient();

    const { insert_app_report } = await getCreateAppSdk(client).CreateAppReport(
      {
        app_id: transformed.app_id,
        user_id: transformed.user_id,
        reporter_email: transformed.reporter_email,
        purpose: transformed.purpose,
        violation: transformed.violation,
        details: transformed.details,
        illegal_content_category: transformed.illegal_content_category,
        illegal_content_laws_broken: transformed.illegal_content_laws_broken,
        illegal_content_description: transformed.illegal_content_description,
        illegal_content_location: transformed.illegal_content_location,
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
