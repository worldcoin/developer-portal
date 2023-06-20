import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "@/backend/errors";
import { protectInternalEndpoint } from "@/backend/utils";
import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk as getCreateInvitesSdk } from "@/api/invite-team-members/graphql/createInvite.generated";
import { getSdk as getFetchUserSdk } from "@/api/invite-team-members/graphql/fetchUser.generated";
import { sendEmail } from "@/lib/send-email";
import { Invite } from "@/components/EmailTemplates/Invite";
import { renderToString } from "react-dom/server";

export default async function handleInvite(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!protectInternalEndpoint(req, res)) {
      return;
    }

    if (req.method !== "POST") {
      return errorNotAllowed(req.method!, res);
    }

    if (req.body.action?.name !== "invite_team_members") {
      return errorHasuraQuery({
        res,
        detail: "Invalid action.",
        code: "invalid_action",
      });
    }

    if (req.body.session_variables["x-hasura-role"] === "admin") {
      return errorHasuraQuery({
        res,
        detail: "Admin is not allowed to run this query.",
        code: "admin_not_allowed",
      });
    }

    const userId = req.body.session_variables["x-hasura-user-id"];
    if (!userId) {
      return errorHasuraQuery({
        res,
        detail: "userId must be set.",
        code: "required",
      });
    }

    const teamId = req.body.session_variables["x-hasura-team-id"];
    if (!teamId) {
      return errorHasuraQuery({
        res,
        detail: "teamId must be set.",
        code: "required",
      });
    }

    const emails = req.body.input.emails;
    if (!emails) {
      return errorHasuraQuery({
        res,
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
        detail: "Some emails could not be invited.",
        code: "invalid_emails",
      });
    }

    const promises = [];
    for (const invite of createInvitesRes.invites?.returning) {
      const link = `${process.env.NEXT_PUBLIC_APP_URL}/login-with-invite?invite=${invite.id}`;

      promises.push(
        sendEmail({
          apiKey: process.env.SENDGRID_API_KEY!,
          from: process.env.SENDGRID_EMAIL_FROM!,
          to: invite.email,
          subject: "Teammate invited you",
          text: `Click this link to join: ${link}`,
          html: renderToString(
            <Invite
              email={invite.email}
              link={link}
              user={{
                id: "test",
                email: "test",
                name: "test",
                team: { name: "test", id: "test" },
              }}
            />
          ),
        })
      );
    }

    await Promise.all(promises);

    res.status(200).json({ emails });
  } catch (err) {
    console.error(err);

    return errorHasuraQuery({
      res,
      detail: "Unhandled api error",
      code: "unhandled_error",
    });
  }
}
