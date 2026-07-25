import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getInsertSandboxAccessRequestSdk } from "./graphql/insert-sandbox-access-request.generated";
import { fetchSandboxAccessRequest } from "./server/fetch-sandbox-access-request";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns the caller's access request (or `request: null`), so the dialog can
 * show a persistent confirmation instead of offering a resubmit. Requests are
 * unique per user, so the session's Hasura user id is the whole lookup key.
 */
export async function GET() {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  const userId = user?.hasura?.id;
  if (!user || !userId) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  try {
    const request = await fetchSandboxAccessRequest(userId);
    return NextResponse.json({
      success: true,
      request,
    });
  } catch (error) {
    logger.error("Failed to look up sandbox access request", {
      userId,
      error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

/**
 * Records an Android sandbox tester request in `sandbox_access_request`.
 * Dashboard operators work the pending rows and flip `accepted` only after
 * the invite has been sent.
 *
 * Authorization: the caller must have a Hasura user id.
 *
 * Requests are immutable from this endpoint after creation. A repeat POST is
 * treated as success and returns the stored row without changing the email or
 * backend-owned accepted/processed state.
 */
export async function POST(req: NextRequest) {
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
      user_id: userId,
    });

    const request = await fetchSandboxAccessRequest(userId, client);
    if (!request) {
      throw new Error("Sandbox access request was not persisted");
    }

    return NextResponse.json({ success: true, request });
  } catch (error) {
    logger.error("Failed to record sandbox access request", {
      userId,
      error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
