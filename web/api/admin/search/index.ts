import { authenticateAdminRequest } from "@/lib/admin-auth";
import { fetchAdminGlobalSearch } from "@/scenes/Admin/search/server/fetch-global-search";
import { NextRequest, NextResponse } from "next/server";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 128;

export async function GET(req: NextRequest) {
  const user = await authenticateAdminRequest(req.headers);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      {
        error: `Query must contain between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters`,
      },
      { status: 400 },
    );
  }

  try {
    const result = await fetchAdminGlobalSearch(query, user);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Search is temporarily unavailable" },
      { status: 503 },
    );
  }
}
