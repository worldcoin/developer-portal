import { getInternalDashboardGraphqlClientForUser } from "@/api/helpers/graphql";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { Role_Enum } from "@/graphql/graphql";
import { authenticateAdminRequest } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getSdk as getAddTeamMemberSdk } from "./graphql/add-team-member.generated";
import { getSdk as getAddTeamMemberContextSdk } from "./graphql/get-add-team-member-context.generated";

const TEAM_ID_REGEX = /^team_[a-zA-Z0-9]+$/;
const isTeamId = (id: string) => id.length <= 50 && TEAM_ID_REGEX.test(id);

// OWNER is deliberately not addable; the Hasura insert check enforces the same.
const ADDABLE_ROLES = [Role_Enum.Member, Role_Enum.Admin] as const;

const schema = yup
  .object({
    email: yup
      .string()
      .trim()
      .max(254, "Email is too long")
      .email("Invalid email address")
      .required("Email is required"),
    role: yup
      .mixed<(typeof ADDABLE_ROLES)[number]>()
      .oneOf([...ADDABLE_ROLES], "Role must be ADMIN or MEMBER")
      .required("Role is required"),
  })
  .noUnknown();

// ILIKE treats `%` and `_` as wildcards. Escape them so the email matches
// literally and only letter case is ignored.
const toEmailPattern = (email: string) => email.replace(/[\\%_]/g, "\\$&");

/**
 * Adds an existing Developer Portal account to a customer team as ADMIN or
 * MEMBER, on behalf of an authenticated internal dashboard user. There is no
 * invite or email: the account must already exist, and it joins immediately.
 * Like the sandbox request actions, this is available to every authenticated
 * dashboard user.
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
  const logContext = { teamId, role, adminSubject: admin.subject };

  let client;
  let context;
  try {
    client = await getInternalDashboardGraphqlClientForUser(admin);
    context = await getAddTeamMemberContextSdk(client).GetAddTeamMemberContext({
      team_id: teamId,
      email_pattern: toEmailPattern(email),
    });
  } catch (error) {
    logger.error("Admin add team member failed: lookup error", {
      ...logContext,
      stage: "lookup",
      error,
    });
    return NextResponse.json(
      { error: "Unable to look up the team or account" },
      { status: 503 },
    );
  }

  if (!context.team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  if (context.team.deleted_at) {
    return NextResponse.json(
      { error: "Cannot add members to a deleted team" },
      { status: 409 },
    );
  }

  if (context.user.length === 0) {
    return NextResponse.json(
      { error: "No Developer Portal account uses this email" },
      { status: 404 },
    );
  }

  // Emails are unique but case-sensitive, so case variants could match more
  // than one account. Refuse rather than guess who gets access.
  if (context.user.length > 1) {
    return NextResponse.json(
      { error: "More than one account matches this email" },
      { status: 409 },
    );
  }

  const [user] = context.user;
  if (user.memberships.length > 0) {
    return NextResponse.json(
      { error: "This account is already a member of the team" },
      { status: 409 },
    );
  }

  try {
    const result = await getAddTeamMemberSdk(client).AddTeamMember({
      object: { team_id: teamId, user_id: user.id, role },
    });

    if (!result.insert_membership_one) {
      throw new Error("Membership insert returned no row");
    }
  } catch (error) {
    logger.error("Admin add team member failed: insert error", {
      ...logContext,
      userId: user.id,
      stage: "insert",
      error,
    });
    return NextResponse.json(
      { error: "Unable to add the account to the team" },
      { status: 503 },
    );
  }

  // Audit trail for a privileged cross-tenant write. Admin additions are rare,
  // manual actions, so this does not add meaningful log volume.
  logger.info("Admin added team member", { ...logContext, userId: user.id });

  return NextResponse.json({ success: true, role });
}
