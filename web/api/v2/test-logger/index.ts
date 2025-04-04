import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

function corsHandler(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  return response;
}

export const GET = async (req: NextRequest) => {
  logger.error("test", {
    error: new Error("test"),
  });
  throw new Error("test");
  const response = NextResponse.json({ status: 200 });
  return corsHandler(response);
};

export async function OPTIONS(request: NextRequest) {
  return corsHandler(new NextResponse(null, { status: 204 }));
}
