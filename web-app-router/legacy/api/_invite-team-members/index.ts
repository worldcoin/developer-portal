import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "@/legacy/backend/errors";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import { getSdk as getCreateInvitesSdk } from "@/legacy/api/_invite-team-members/graphql/createInvite.generated";
import { sendEmail } from "@/legacy/lib/send-email";
import { logger } from "@/legacy/lib/logger";
import {
  GetUserAndTeamMembershipsQuery,
  getSdk as getUserAndTeamMembershipsSdk,
} from "./graphql/getUserAndTeamMemberships.generated";

import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export const handleInvite = async (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  if (!protectInternalEndpoint(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return errorNotAllowed(req.method!, res, req);
  }

  if (!process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID) {
    throw new Error("SENDGRID_TEAM_INVITE_TEMPLATE_ID must be set.");
  }

  if (req.body.action?.name !== "invite_team_members") {
    logger.error("invalid action in _invite-team-members", { body: req.body });
    return errorHasuraQuery({ res, req });
  }

  if (req.body.session_variables["x-hasura-role"] === "admin") {
    logger.error("admin role cannot call _invite-team-members.");
    return errorHasuraQuery({ res, req });
  }

  const userId = req.body.session_variables["x-hasura-user-id"];
  if (!userId) {
    logger.error("userId must be set in _invite-team-members");
    return errorHasuraQuery({ res, req });
  }

  const teamId = req.body.session_variables["x-hasura-team-id"];
  if (!teamId) {
    logger.error("teamId must be set in _invite-team-members");
    return errorHasuraQuery({ res, req });
  }

  const emails = req.body.input.emails as string[];
  let query: GetUserAndTeamMembershipsQuery | null = null;
  const client = await getAPIServiceGraphqlClient();

  if (!emails) {
    return errorHasuraQuery({
      res,
      req,
      detail: "emails must be set.",
      code: "required",
    });
  }

  try {
    query = await getUserAndTeamMembershipsSdk(
      client
    ).GetUserAndTeamMemberships({
      team_id: teamId,
      user_id: userId,
    });
  } catch (error) {
    logger.error("Cannot fetch memberships.", { error });
    return errorHasuraQuery({ res, req });
  }

  const invitingUser = query.user[0];

  if (!invitingUser?.id) {
    logger.warn(
      "User or team not found. User may not have permissions for this team.",
      { userId, teamId }
    );
    return errorHasuraQuery({
      res,
      req,
      detail: "Insufficient Permissions",
      code: "insufficient_permissions",
    });
  }

  const alreadyExistingEmails = emails.filter((email: string) => {
    return query?.membership?.some(
      (membership) => membership.user.email === email
    );
  });

  if (alreadyExistingEmails.length > 0) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Some emails are already in the team.",
      code: "already_in_team",
    });
  }

  const createInvitesRes = await getCreateInvitesSdk(client).CreateInvites({
    objects: emails.map((email: string) => ({
      email,
      team_id: teamId,
    })),
  });

  if (
    !createInvitesRes.invites?.returning ||
    createInvitesRes.invites?.returning?.length !== emails.length
  ) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Some emails could not be invited.",
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
  for (const invite of createInvitesRes.invites?.returning) {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login?invite_id=${invite.id}`;

    const inviter = DOMPurify.sanitize(
      invitingUser.name || invitingUser.email || "Someone"
    );

    const team = DOMPurify.sanitize(invitingUser.team.name || "their team");

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
      })
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

  res.status(200).json({ emails });
};
