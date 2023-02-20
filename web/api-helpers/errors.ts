import { NextApiResponse } from "next";

export function errorResponse(
  res: NextApiResponse,
  statusCode: number,
  code: string,
  detail: string = "Something went wrong",
  attribute: string | null = null
): void {
  res.status(statusCode).json({ code, detail, attribute });
}

export function errorNotAllowed(
  method: string = "",
  res: NextApiResponse
): void {
  return errorResponse(
    res,
    405,
    "method_not_allowed",
    `HTTP method '${method}' is not allowed for this endpoint.`
  );
}

export function errorUnauthenticated(
  detail: string = "Invalid credentials.",
  res: NextApiResponse
): void {
  return errorResponse(res, 401, "unauthenticated", detail, null);
}

export function errorRequiredAttribute(
  attribute: string = "",
  res: NextApiResponse
): void {
  return errorResponse(
    res,
    400,
    "required",
    "This attribute is required.",
    attribute
  );
}

export function errorValidation(
  code: string,
  detail: string = "This attribute is invalid.",
  attribute: string | null,
  res: NextApiResponse
): void {
  return errorResponse(res, 400, code, detail, attribute);
}
