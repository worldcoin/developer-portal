import { NextResponse } from "next/server";

export const GET = () => {
  return NextResponse.json(
    {
      error:
        "This endpoint is no longer supported, please use the /api/v2/public/apps endpoint instead.",
    },
    { status: 410 },
  );
};
