import { errorHasuraQuery } from "@/api/helpers/errors";
import { protectInternalEndpoint } from "@/api/helpers/utils";
import { logger } from "@/lib/logger";
import dayjs from "dayjs";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import {
  CreateInvitesMutation,
  getSdk as getCreateInvitesSdk,
} from "./graphql/createInvite.generated";

import { NextRequest, NextResponse } from "next/server";
import { getSdk as getFetchInvitesSdk } from "./graphql/fetchInvites.generated";
import {
  GetUserAndTeamMembershipsQuery,
  getSdk as getUserAndTeamMembershipsSdk,
} from "./graphql/getUserAndTeamMemberships.generated";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { sendEmail } from "@/api/helpers/send-email";
import {
  UpdateInvitesExpirationMutation,
  getSdk,
} from "./graphql/updateInvitesExpiration.generated";

export const POST = async (req: NextRequest) => {
  if (!protectInternalEndpoint(req)) {
    return;
  }

  if (!process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID) {
    return errorHasuraQuery({
      req,
      detail: "SENDGRID_TEAM_INVITE_TEMPLATE_ID must be set.",
      code: "invalid_config",
    });
  }

  const body = await req.json();

  if (body?.action.name !== "invite_team_members") {
    return errorHasuraQuery({
      req,
      detail: "Invalid action.",
      code: "invalid_action",
    });
  }

  if (body.session_variables["x-hasura-role"] === "admin") {
    logger.error("Admin not allowed to run _reset-client-client-secret"),
      { role: body.session_variables["x-hasura-role"] };
    return errorHasuraQuery({ req });
  }

  const userId = body.session_variables["x-hasura-user-id"];
  if (!userId) {
    return errorHasuraQuery({
      req,
      detail: "userId must be set.",
      code: "required",
    });
  }

  const teamId = body.input.team_id;
  if (!teamId) {
    return errorHasuraQuery({
      req,
      detail: "teamId must be set.",
      code: "required",
    });
  }

  const emails = body.input.emails as string[];
  let query: GetUserAndTeamMembershipsQuery | null = null;
  const client = await getAPIServiceGraphqlClient();

  if (!emails) {
    return errorHasuraQuery({
      req,
      detail: "emails must be set.",
      code: "required",
    });
  }

  try {
    query = await getUserAndTeamMembershipsSdk(
      client,
    ).GetUserAndTeamMemberships({
      team_id: teamId,
      user_id: userId,
    });
  } catch (error) {
    logger.error("Cannot fetch memberships.", { error });
    return errorHasuraQuery({
      req,
      detail: "Cannot fetch memberships.",
      code: "required",
    });
  }

  const invitingUser = query.user[0];

  const invitingUsersMembership = query.membership.find(
    (membership) => membership.team.id === teamId,
  );

  if (!invitingUser?.id) {
    logger.warn(
      "User or team not found. User may not have permissions for this team.",
      { userId, teamId },
    );
    return errorHasuraQuery({
      req,
      detail: "Insufficient Permissions",
      code: "insufficient_permissions",
    });
  }

  const alreadyExistingEmails = emails.filter((email: string) => {
    return query?.membership?.some(
      (membership) => membership.user.email === email,
    );
  });

  if (alreadyExistingEmails.length > 0) {
    return errorHasuraQuery({
      req,
      detail: "Some emails are already in the team.",
      code: "already_in_team",
    });
  }

  const fetchInvitesResult = await getFetchInvitesSdk(client).FetchInvites({
    emails,
  });

  const existingInvites = fetchInvitesResult.invite.filter((invite) => {
    return emails.includes(invite.email) && invite.team_id === teamId;
  });

  const emailsToCreate = emails.filter((email: string) => {
    return !existingInvites.some((invite) => invite.email === email);
  });

  let updatedInvites: NonNullable<
    UpdateInvitesExpirationMutation["invites"]
  >["returning"] = [];

  if (existingInvites.length > 0) {
    const updateExpirationResult = await getSdk(client).UpdateInvitesExpiration(
      {
        ids: existingInvites.map((invite) => invite.id),
        expires_at: dayjs().add(7, "days").toISOString(),
      },
    );

    if (!updateExpirationResult.invites?.returning) {
      return errorHasuraQuery({
        req,
        detail: "Some invites could not be updated.",
        code: "invalid_emails",
      });
    }

    updatedInvites = updateExpirationResult.invites.returning;
  }

  let createdInvites: NonNullable<
    CreateInvitesMutation["invites"]
  >["returning"] = [];

  if (emailsToCreate.length > 0) {
    const createInvitesRes = await getCreateInvitesSdk(client).CreateInvites({
      objects: emailsToCreate.map((email: string) => ({
        email,
        team_id: teamId,
      })),
    });

    if (
      !createInvitesRes.invites?.returning ||
      createInvitesRes.invites?.returning?.length !== emailsToCreate.length
    ) {
      return errorHasuraQuery({
        req,
        detail: "Some emails could not be invited.",
        code: "invalid_emails",
      });
    }

    createdInvites = createInvitesRes.invites.returning;
  }

  const invites = [...updatedInvites, ...createdInvites];

  if (!invites || invites.length === 0) {
    return errorHasuraQuery({
      req,
      detail: "No invites to send.",
      code: "invalid_emails",
    });
  }

  const window = new JSDOM("").window; // NOTE: this is a workaround for DOMPurify on the server
  const DOMPurify = createDOMPurify(window);

  DOMPurify.setConfig({
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  const promises = [];

  for (const invite of invites) {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/join?invite_id=${invite.id}`;

    const inviter = DOMPurify.sanitize(
      invitingUser.name || invitingUser.email || "Someone",
    );

    const team = DOMPurify.sanitize(
      invitingUsersMembership?.team.name || "their team",
    );
    const to = DOMPurify.sanitize(invite.email);

    promises.push(
      sendEmail({
        apiKey: process.env.SENDGRID_API_KEY!,
        from: process.env.SENDGRID_EMAIL_FROM!,
        to,
        templateId: process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID,
        templateData: {
          inviter,
          team,
          inviteLink: link,
        },
      }),
    );
  }

  (await Promise.allSettled(promises)).map((item) => {
    if (item.status === "rejected") {
      logger.error("Cannot send invite(s)", {
        req,
        error: item.reason,
      });
    }
  });

  return NextResponse.json({ emails });
};
