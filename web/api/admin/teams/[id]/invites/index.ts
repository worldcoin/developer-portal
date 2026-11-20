import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { sendEmail } from "@/api/helpers/send-email";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { Role_Enum } from "@/graphql/graphql";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { DEFAULT_APP_URL } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { urls } from "@/lib/urls";
import dayjs from "dayjs";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getCreateTeamInviteSdk } from "./graphql/create-team-invite.generated";
import { getSdk as getTeamInviteContextSdk } from "./graphql/get-team-invite-context.generated";
import { getSdk as getRefreshTeamInvitesSdk } from "./graphql/refresh-team-invites.generated";

const TEAM_ID_REGEX = /^team_[a-zA-Z0-9]+$/;
const isTeamId = (id: string) => id.length <= 50 && TEAM_ID_REGEX.test(id);

const INVITE_TTL_DAYS = 7;

// Shown to the invitee as the inviter. Admin invites come from the portal
// operators, so the internal dashboard user's identity is never exposed.
const ADMIN_INVITER_NAME = "World Developer Portal support";

// OWNER is deliberately not invitable; the database enforces the same rule.
const ADMIN_INVITABLE_ROLES = [Role_Enum.Member, Role_Enum.Admin] as const;

const schema = yup
  .object({
    email: yup
      .string()
      .trim()
      .lowercase()
      .max(254, "Email is too long")
      .email("Invalid email address")
      .required("Email is required"),
    role: yup
      .mixed<(typeof ADMIN_INVITABLE_ROLES)[number]>()
      .oneOf([...ADMIN_INVITABLE_ROLES], "Role must be ADMIN or MEMBER")
      .required("Role is required"),
  })
  .noUnknown();

const sanitizeTemplateValue = (value: string) => {
  const DOMPurify = createDOMPurify(new JSDOM("").window);
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

/**
 * Invites a person into a customer team with the ADMIN or MEMBER role, on
 * behalf of an authenticated internal dashboard user. An existing invite for
 * the same email and team is refreshed (new expiry and role) and resent rather
 * than duplicated. Like the sandbox request actions, this is available to
 * every authenticated dashboard user.
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> },
) {
  const admin = await authenticateAdminRequest(req.headers);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: teamId } = await props.params;
  if (!isTeamId(teamId)) {
    return NextResponse.json({ error: "Invalid team id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    schema,
    value: body,
  });
  if (!isValid) {
    return handleError(req);
  }
  const { email, role } = parsedParams;

  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const emailFrom = process.env.SENDGRID_EMAIL_FROM;
  const templateId = process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID;
  if (!sendgridApiKey || !emailFrom || !templateId) {
    logger.error("Admin team invite email is not configured", {
      hasApiKey: Boolean(sendgridApiKey),
      hasFrom: Boolean(emailFrom),
      hasTemplateId: Boolean(templateId),
    });
    return NextResponse.json(
      { error: "Team invite email is not configured" },
      { status: 503 },
    );
  }

  const logContext = { teamId, role, adminSubject: admin.subject };

  let client;
  let context;
  try {
    client = await getInternalDashboardGraphqlClientForUser(admin);
    context = await getTeamInviteContextSdk(client).GetTeamInviteContext({
      team_id: teamId,
      email,
    });
  } catch (error) {
    logger.error("Admin team invite failed: could not load team", {
      ...logContext,
      stage: "load_context",
      error,
    });
    return NextResponse.json({ error: "Unable to load team" }, { status: 503 });
  }

  if (!context.team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  if (context.team.deleted_at) {
    return NextResponse.json(
      { error: "Cannot invite members to a deleted team" },
      { status: 409 },
    );
  }

  if (context.membership.length > 0) {
    return NextResponse.json(
      { error: "This person is already a member of the team" },
      { status: 409 },
    );
  }

  const refreshed = context.invite.length > 0;
  let inviteId: string | undefined;

  try {
    if (refreshed) {
      const result = await getRefreshTeamInvitesSdk(client).RefreshTeamInvites({
        ids: context.invite.map((invite) => invite.id),
        expires_at: dayjs().add(INVITE_TTL_DAYS, "days").toISOString(),
        role,
      });
      inviteId = result.update_invite?.returning[0]?.id;
    } else {
      const result = await getCreateTeamInviteSdk(client).CreateTeamInvite({
        object: { email, team_id: teamId, role },
      });
      inviteId = result.insert_invite_one?.id;
    }

    if (!inviteId) {
      throw new Error("Invite mutation returned no invite");
    }
  } catch (error) {
    logger.error("Admin team invite failed: could not save invite", {
      ...logContext,
      stage: refreshed ? "refresh_invite" : "create_invite",
      error,
    });
    return NextResponse.json(
      { error: "Unable to save invite" },
      { status: 503 },
    );
  }

  // The invite id is the join credential, so it is only ever placed in the
  // email link: never logged and never returned to the dashboard.
  const inviteLink = new URL(
    urls.join({ invite_id: inviteId }),
    process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
  );

  try {
    await sendEmail({
      apiKey: sendgridApiKey,
      from: emailFrom,
      to: email,
      templateId,
      templateData: {
        inviter: ADMIN_INVITER_NAME,
        team: sanitizeTemplateValue(context.team.name || "their team"),
        inviteLink: inviteLink.toString(),
      },
    });
  } catch (error) {
    logger.error("Admin team invite failed: could not send email", {
      ...logContext,
      stage: "send_email",
      refreshed,
      error,
    });
    // The invite is saved; resubmitting refreshes it and resends the email.
    return NextResponse.json(
      {
        error:
          "Invite saved but the email could not be sent. Submit again to resend it.",
      },
      { status: 503 },
    );
  }

  // Audit trail for a privileged cross-tenant write. Admin invites are rare,
  // manual actions, so this does not add meaningful log volume.
  logger.info("Admin team invite sent", { ...logContext, refreshed });

  return NextResponse.json({ success: true, email, role, refreshed });
}
