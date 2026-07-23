import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0 } from "@/lib/auth0";
import { WORLD_ID_SANDBOX_ENABLED } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getInsertSandboxAccessRequestSdk } from "./graphql/insert-sandbox-access-request.generated";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Records an Android sandbox tester request in `sandbox_access_request`.
 * Whoever manages the Google Play internal-tester allowlist works the
 * `pending` rows and marks them processed.
 *
 * Authorization: sandbox kill switch must be on and the caller must have a
 * Hasura user id. The sidebar only hides the entry point; this check closes
 * the direct-POST bypass.
 *
 * Upsert on user_id: a repeat request resets status to pending, clears
 * processed_at, and refreshes google_email / portal_email — no delete.
 */
export async function POST(req: NextRequest) {
  if (!WORLD_ID_SANDBOX_ENABLED) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const userId = user?.hasura?.id;
  if (!user || !userId) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !EMAIL_REGEX.test(email)
  ) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  try {
    const client = await getAPIServiceGraphqlClient();
    await getInsertSandboxAccessRequestSdk(client).InsertSandboxAccessRequest({
      google_email: email,
      portal_email: user.email ?? "unknown",
      user_id: userId,
    });
  } catch (error) {
    logger.error("Failed to record sandbox access request", {
      portalEmail: user.email,
      userId,
      error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
