import { handleVerifyRequest } from "@/api/helpers/world-id-verification";
import { NextRequest } from "next/server";

/**
 * POST /api/v4/verify/:id
 *
 * Supports both app_id and rp_id for migrated apps. The request body selects
 * the verification environment, defaulting to production when omitted.
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ app_id: string }> },
) {
  const { app_id: routeId } = await props.params;
  return handleVerifyRequest(req, routeId);
}
