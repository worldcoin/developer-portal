import { authenticateAdminRequest } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Returns the authenticated admin user for the internal dashboard, or 401
 * when the request did not pass the configured admin auth provider.
 */
export async function GET(req: NextRequest) {
  const user = await authenticateAdminRequest(req.headers);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { email: user.email, role: user.role },
    { status: 200 },
  );
}
