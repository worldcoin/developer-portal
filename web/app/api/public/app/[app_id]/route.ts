import { NextResponse } from "next/server";

export const GET = () => {
  return NextResponse.json(
    {
      error:
        "This endpoint is no longer supported, please use the /api/v2/public/app/[app_id] endpoint instead.",
    },
    { status: 410 },
  );
};
