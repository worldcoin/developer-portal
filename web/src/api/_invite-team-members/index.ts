import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "@/backend/errors";
import { protectInternalEndpoint } from "@/backend/utils";
import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk as getCreateInvitesSdk } from "@/api/_invite-team-members/graphql/createInvite.generated";
import { sendEmail } from "@/lib/send-email";
import { logger } from "src/lib/logger";
import {
  GetMembershipsQuery,
  getSdk as getMembershipsSdk,
} from "./graphql/getMemberships.generated";

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
  let memberships: GetMembershipsQuery | null = null;
  const client = await getAPIServiceGraphqlClient();

  if (!emails) {
    return errorHasuraQuery({
      res,
      req,
      detail: "`emails` must be provided.",
      code: "required",
    });
  }

  try {
    memberships = await getMembershipsSdk(client).GetMemberships({
      team_id: teamId,
      user_id: userId,
    });
  } catch (error) {
    return errorHasuraQuery({
      res,
      req,
      detail: "Cannot fetch memberships.",
      code: "cannot_fetch_memberships",
    });
  }

  if (!memberships?.team[0]?.id) {
    logger.warn("User does not have permission to invite to this team.");
    return errorHasuraQuery({ res, req });
  }

  const alreadyExistingEmails = emails.filter((email: string) => {
    return memberships?.membership?.some(
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

  if (!process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID) {
    throw new Error("SENDGRID_TEAM_INVITE_TEMPLATE_ID must be set.");
  }

  const promises = [];
  for (const invite of createInvitesRes.invites?.returning) {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login?invite_id=${invite.id}`;

    promises.push(
      sendEmail({
        apiKey: process.env.SENDGRID_API_KEY!,
        from: process.env.SENDGRID_EMAIL_FROM!,
        to: invite.email,
        templateId: process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID!,
        templateData: {
          inviter: fetchUserRes.user[0].name ?? fetchUserRes.user[0].email,
          team: fetchUserRes.user[0].team.name ?? "their team",
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
