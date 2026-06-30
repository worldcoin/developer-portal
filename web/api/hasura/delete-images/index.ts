import { errorHasuraQuery } from "@/api/helpers/errors";
import { NextRequest } from "next/server";

export const POST = async (req: NextRequest) => {
  // This Hasura action handler has not been implemented yet. Returning a
  // handled error response (logged at "warn") instead of throwing avoids
  // surfacing an uncaught 500 and error-level noise in Error Tracking for an
  // endpoint that is an intentional, not-yet-built stub.
  return errorHasuraQuery({
    req,
    detail: "This endpoint is not implemented yet.",
    code: "not_implemented",
    logLevel: "warn",
  });
};
