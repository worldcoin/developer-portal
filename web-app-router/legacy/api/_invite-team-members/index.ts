import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "@/legacy/backend/errors";
import { protectInternalEndpoint } from "@/legacy/backend/utils";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import { getSdk as getCreateInvitesSdk } from "@/legacy/api/_invite-team-members/graphql/createInvite.generated";
import { getSdk as getFetchUserSdk } from "@/legacy/api/_invite-team-members/graphql/fetchUser.generated";
import { sendEmail } from "@/legacy/lib/send-email";
import { logger } from "@/legacy/lib/logger";

export const handleInvite = async (
  req: NextApiRequest,
  res: NextApiResponse,
) => {
  try {
    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    if (req.method !== "POST") {
      return errorNotAllowed(req.method!, res, req);
    }

    if (req.body.action?.name !== "invite_team_members") {
      return errorHasuraQuery({
        res,
        req,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    if (req.body.session_variables["x-hasura-role"] === "admin") {
      return errorHasuraQuery({
        res,
        req,
        detail: "Admin is not allowed to run this query.",
        code: "admin_not_allowed",
      });
    }

    const userId = req.body.session_variables["x-hasura-user-id"];
    if (!userId) {
      return errorHasuraQuery({
        res,
        req,
        detail: "userId must be set.",
        code: "required",
      });
    }

    const teamId = req.body.session_variables["x-hasura-team-id"];
    if (!teamId) {
      return errorHasuraQuery({
        res,
        req,
        detail: "teamId must be set.",
        code: "required",
      });
    }

    const emails = req.body.input.emails;
    if (!emails) {
      return errorHasuraQuery({
        res,
        req,
        detail: "emails must be set.",
        code: "required",
      });
    }
    const client = await getAPIServiceGraphqlClient();

    const fetchUserRes = await getFetchUserSdk(client).FetchUser({
      id: userId,
    });

    if (!fetchUserRes.user[0]) {
      return errorHasuraQuery({
        res,
        req,
        detail: "User not found",
        code: "user_not_found",
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

    res.status(200).json({ emails });
  } catch (error) {
    logger.error("Cannot send invite(s)", { error, req });

    return errorHasuraQuery({
      res,
      req,
      detail: "Unhandled api error",
      code: "unhandled_error",
    });
  }
};
