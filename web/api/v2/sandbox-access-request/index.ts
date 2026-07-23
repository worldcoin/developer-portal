import { sendEmail } from "@/api/helpers/send-email";
import { auth0 } from "@/lib/auth0";
import { featureFlags } from "@/lib/feature-flags";
import { logger } from "@/lib/logger";
import { Auth0SessionUser } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// replace with the real owner alias for the Play internal-tester list. at some point
const OPS_EMAIL = "kartike.chawla@toolsforhumanity.com";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEAM_ID_REGEX = /^team_[a-f0-9]{32}$/;

/**
 * Relays an Android sandbox tester request to the ops alias that manages the
 * Google Play internal-tester allowlist. No storage — the ops inbox is the
 * queue for now.
 *
 * Authorization mirrors the UI tile: `teamId` must be the caller's current
 * team, they must be a member of it, and that team must be on the
 * worldIdSandbox allowlist. The sidebar only hides the entry point; this
 * check closes the direct-POST bypass.
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

  const sent = await sendEmail({
    apiKey: process.env.SENDGRID_API_KEY!,
    from: process.env.SENDGRID_EMAIL_FROM!,
    to: OPS_EMAIL,
    subject: "WID Sandbox: Android tester access request",
    text:
      `Google account email to allowlist: ${email}\n` +
      `Requested by portal user: ${user.email ?? "unknown"}\n` +
      `Team: ${teamId}`,
  });

  if (!sent) {
    logger.error("Failed to relay sandbox access request", {
      requestedBy: user.email,
      teamId,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
