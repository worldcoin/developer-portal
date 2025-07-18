import { errorResponse } from "@/api/helpers/errors";
import { fetchOIDCApp } from "@/api/helpers/oidc";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { validateUrl } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

const schema = yup
  .object({
    app_id: yup.string().strict().required("This attribute is required."),
    redirect_uri: yup.string().strict().required("This attribute is required."),
  })
  .noUnknown();

/**
 * Prevalidates app_id & redirect_uri is valid for Sign in with World ID for early user feedback
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });

  if (!isValid) {
    return handleError(req);
  }

  const { app_id, redirect_uri } = parsedParams;

  const { app, error: fetchAppError } = await fetchOIDCApp(
    app_id,
    redirect_uri,
  );
  if (!app || fetchAppError) {
    return errorResponse({
      statusCode: fetchAppError?.statusCode ?? 400,
      code: fetchAppError?.code ?? "error",
      detail: fetchAppError?.message ?? "Error fetching app.",
      attribute: fetchAppError?.attribute ?? "app_id",
      req,
      app_id,
    });
  }

  if (!validateUrl(redirect_uri, app.is_staging)) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_redirect_uri",
      detail: "Invalid redirect_uri provided.",
      attribute: "redirect_uri",
      req,
      app_id,
    });
  }

  if (app.registered_redirect_uri !== redirect_uri) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_redirect_uri",
      detail: "Invalid redirect_uri provided.",
      attribute: "redirect_uri",
      req,
      app_id,
    });
  }

  return NextResponse.json({ app_id, redirect_uri });
}
