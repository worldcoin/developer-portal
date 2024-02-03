import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "@/backend/errors";
import { protectInternalEndpoint } from "@/backend/utils";
import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk as getCreateInvitesSdk } from "@/api/_invite-team-members/graphql/createInvite.generated";
import { getSdk as getFetchUserSdk } from "@/api/_invite-team-members/graphql/fetchUser.generated";
import { sendEmail } from "@/lib/send-email";
import { logger } from "src/lib/logger";
import {
  GetMembershipsQuery,
  getSdk as getMembershipsSdk,
} from "./graphql/getMemberships.generated";

import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

export const handleInvite = async (
  req: NextApiRequest,
  res: NextApiResponse
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

    const emails = req.body.input.emails as string[];
    let memberships: GetMembershipsQuery | null = null;
    const client = await getAPIServiceGraphqlClient();

    try {
      memberships = await getMembershipsSdk(client).GetMemberships({
        team_id: teamId,
      });
    } catch (error) {
      return errorHasuraQuery({
        res,
        req,
        detail: "Cannot fetch memberships.",
        code: "cannot_fetch_memberships",
      });
    }

    if (!memberships) {
      return errorHasuraQuery({
        res,
        req,
        detail: "Cannot fetch memberships.",
        code: "cannot_fetch_memberships",
      });
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

    if (!emails) {
      return errorHasuraQuery({
        res,
        req,
        detail: "emails must be set.",
        code: "required",
      });
    }

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
        fetchUserRes.user[0].name || fetchUserRes.user[0].email || "Someone"
      );

      const team = DOMPurify.sanitize(
        fetchUserRes.user[0].team.name ?? "their team"
      );

      const to = DOMPurify.sanitize(invite.email);

      promises.push(
        sendEmail({
          apiKey: process.env.SENDGRID_API_KEY!,
          from: process.env.SENDGRID_EMAIL_FROM!,
          to,
          templateId: process.env.SENDGRID_TEAM_INVITE_TEMPLATE_ID!,
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
