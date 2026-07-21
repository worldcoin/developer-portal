import { sendEmail } from "@/api/helpers/send-email";
import { auth0 } from "@/lib/auth0";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";

// TODO: replace with the real owner alias for the Play internal-tester list.
const OPS_EMAIL = "sandbox-access@toolsforhumanity.com";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Relays an Android sandbox tester request to the ops alias that manages the
 * Google Play internal-tester allowlist. No storage — the ops inbox is the
 * queue for now.
 */
export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user) {
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

  const sent = await sendEmail({
    apiKey: process.env.SENDGRID_API_KEY!,
    from: process.env.SENDGRID_EMAIL_FROM!,
    to: OPS_EMAIL,
    subject: "WID Sandbox: Android tester access request",
    text:
      `Google account email to allowlist: ${email}\n` +
      `Requested by portal user: ${session.user.email ?? "unknown"}`,
  });

  if (!sent) {
    logger.error("Failed to relay sandbox access request", {
      requestedBy: session.user.email,
    });
    return NextResponse.json({ success: false }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
