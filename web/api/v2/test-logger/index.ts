import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

function corsHandler(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

import * as yup from "yup";

const schema = yup.object({
  test_param: yup.string(),
});

export const GET = async (req: NextRequest) => {
  const params = schema.validateSync(req.nextUrl.searchParams);
  const test_param = params.test_param;

  if (test_param === "error") {
    logger.error("test", {
      error: new Error("test"),
    });
    throw new Error("test");
  }
  const response = NextResponse.json({ status: 200 });
  return corsHandler(response);
};

export async function OPTIONS(request: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }));
}
