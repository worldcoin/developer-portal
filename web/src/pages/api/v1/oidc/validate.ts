import { NextApiRequest, NextApiResponse } from "next";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
} from "src/backend/errors";
import { fetchOIDCApp } from "src/backend/oidc";
import { uriHasJS } from "src/lib/utils";

/**
 * Prevalidates app_id & redirect_uri is valid for Sign in with World ID for early user feedback
 * @param req
 * @param res
 */
export default async function handleOIDCValidate(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!req.method || !["POST"].includes(req.method)) {
    return errorNotAllowed(req.method, res, req);
  }

  for (const attr of ["app_id"]) {
    if (!req.body[attr]) {
      return errorRequiredAttribute(attr, res, req);
    }
  }

  const { app_id, redirect_uri } = req.body;

  if (uriHasJS(redirect_uri)) {
    return errorResponse(
      res,
      400,
      "invalid_redirect_uri",
      "Invalid redirect_uri provided.",
      "redirect_uri"
    );
  }

  const { app, error: fetchAppError } = await fetchOIDCApp(
    app_id,
    redirect_uri ?? ""
  );
  if (!app || fetchAppError) {
    return errorResponse(
      res,
      fetchAppError?.statusCode ?? 400,
      fetchAppError?.code ?? "error",
      fetchAppError?.message ?? "Error fetching app.",
      fetchAppError?.attribute ?? "app_id"
    );
  }

  if (redirect_uri && app.registered_redirect_uri !== redirect_uri) {
    return errorResponse(
      res,
      400,
      "invalid_redirect_uri",
      "Invalid redirect_uri provided.",
      "redirect_uri"
    );
  }

  res.status(200).json({ app_id, redirect_uri });
}
