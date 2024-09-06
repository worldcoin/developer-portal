import { errorNotAllowed, errorResponse } from "@/legacy/backend/errors";
import { fetchOIDCApp } from "@/legacy/backend/oidc";
import { validateRequestSchema } from "@/legacy/backend/utils";
import { validateUrl } from "@/lib/utils";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";

const schema = yup.object({
  app_id: yup.string().strict().required("This attribute is required."),
  redirect_uri: yup.string().strict().required("This attribute is required."),
});

/**
 * Prevalidates app_id & redirect_uri is valid for Sign in with World ID for early user feedback
 * @param req
 * @param res
 */
export default async function handleOIDCValidate(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: req.body,
  });

  if (!isValid) {
    return handleError(req, res);
  }

  const { app_id, redirect_uri } = parsedParams;

  const { app, error: fetchAppError } = await fetchOIDCApp(
    app_id,
    redirect_uri,
  );
  if (!app || fetchAppError) {
    return errorResponse(
      res,
      fetchAppError?.statusCode ?? 400,
      fetchAppError?.code ?? "error",
      fetchAppError?.message ?? "Error fetching app.",
      fetchAppError?.attribute ?? "app_id",
      req,
    );
  }

  if (!validateUrl(redirect_uri, app.is_staging)) {
    return errorResponse(
      res,
      400,
      "invalid_redirect_uri",
      "Invalid redirect_uri provided.",
      "redirect_uri",
      req,
    );
  }

  if (app.registered_redirect_uri !== redirect_uri) {
    return errorResponse(
      res,
      400,
      "invalid_redirect_uri",
      "Invalid redirect_uri provided.",
      "redirect_uri",
      req,
    );
  }

  res.status(200).json({ app_id, redirect_uri });
}
