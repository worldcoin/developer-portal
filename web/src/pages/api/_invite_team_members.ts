import { NextApiRequest, NextApiResponse } from "next";
import { errorHasuraQuery, errorNotAllowed } from "@/backend/errors";
import { protectInternalEndpoint } from "@/backend/utils";
import { getAPIServiceGraphqlClient } from "@/backend/graphql";
import { getSdk as getCreateInvitesSdk } from "@/api/invite-team-members/graphql/createInvite.generated";

export default async function handleInvite(
  req: NextApiRequest,
  res: NextApiResponse
) {
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

  for (const invite of createInvitesRes.invites?.returning) {
    const link = `${process.env.NEXT_PUBLIC_APP_URL}/login-with-invite?invite=${invite.id}`;
    console.log(invite.email, link);
    // FIXME: send link to email
  }

  res.status(200).json({ emails });
}
