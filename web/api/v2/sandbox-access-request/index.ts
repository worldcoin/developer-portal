import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { auth0 } from "@/lib/auth0";
import { featureFlags } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";
import { getSdk as getInsertSandboxAccessRequestSdk } from "./graphql/insert-sandbox-access-request.generated";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_ID_REGEX = /^team_[a-f0-9]{32}$/;

/**
 * Records an Android sandbox tester request in `sandbox_access_request`.
 * Whoever manages the Google Play internal-tester allowlist works the
 * `pending` rows and marks them processed.
 *
 * Authorization mirrors the UI tile: `teamId` must be the caller's current
 * team, they must be a member of it, and that team must be on the
 * worldIdSandbox allowlist. The sidebar only hides the entry point; this
 * check closes the direct-POST bypass.
 *
 * Upsert on (google_email, team_id): a repeat request resets status to
 * pending, clears processed_at, and refreshes requested_by — no delete.
 */
export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  const user = session?.user as Auth0SessionUser["user"] | undefined;
  if (!user) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  let email: unknown;
  let teamId: unknown;
  try {
    ({ email, teamId } = await req.json());
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (
    typeof email !== "string" ||
    email.length > 254 ||
    !EMAIL_REGEX.test(email) ||
    typeof teamId !== "string" ||
    !TEAM_ID_REGEX.test(teamId)
  ) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const memberTeamIds = (user.hasura?.memberships ?? [])
    .map((m) => m.team?.id)
    .filter((id): id is string => Boolean(id));

  if (!memberTeamIds.includes(teamId)) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const allowedTeamIds = await featureFlags.worldIdSandbox.getSandboxTeamIds(
    [teamId],
    user.email,
  );

  if (!allowedTeamIds.includes(teamId)) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  try {
    const client = await getAPIServiceGraphqlClient();
    await getInsertSandboxAccessRequestSdk(client).InsertSandboxAccessRequest({
      google_email: email,
      requested_by: user.email ?? "unknown",
      team_id: teamId,
    });
  } catch (error) {
    logger.error("Failed to record sandbox access request", {
      requestedBy: user.email,
      teamId,
      error,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
