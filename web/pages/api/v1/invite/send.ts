import { gql } from "@apollo/client";
import { runCors } from "../../../../cors";
import {
  errorNotAllowed,
  errorRequiredAttribute,
  errorResponse,
  errorUnauthenticated,
} from "errors";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPISSRClient } from "ssr-graphql";
import { sendEmail } from "email/common/helpers/send-email";
import { Invite } from "email/Invite";
import { generateInviteJWT } from "api-utils";
import { urls } from "urls";

const userWithTeamQuery = gql`
  query User {
    user {
      id
      name
      email
      team {
        id
        name
      }
    }
  }
`;

type userWithTeamRequestResult = {
  user: Array<{
    id: string;
    name: string;
    email: string;
    team: {
      id: string;
      name: string;
    };
  }>;
};

const insertInviteQuery = gql`
  mutation InsertInvite($objects: [invite_insert_input!]!) {
    insert_invite(objects: $objects) {
      returning {
        id
        team_id
        email
      }
    }
  }
`;

type insertInviteRequestResult = {
  insert_invite: {
    returning: Array<{
      id: string;
      email: string;
      team_id: string;
    }>;
  };
};

export default async function inviteSend(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (!req.body.emails || req.body.emails.length <= 0) {
    return errorRequiredAttribute("emails", res);
  }

  if (!req.headers.authorization) {
    return errorUnauthenticated(undefined, res);
  }

  const client = await getAPISSRClient(req);

  // ANCHOR: Fetch me and team
  const userResult = await client.query<userWithTeamRequestResult>({
    query: userWithTeamQuery,
  });

  if (userResult.data.user.length <= 0) {
    errorResponse(res, 400, "unexpected");
  }

  const emails = req.body.emails as Array<string>;
  const userWithTeam = userResult.data.user[0];

  // ANCHOR: Insert invites
  const invitesResult = await client.query<insertInviteRequestResult>({
    query: insertInviteQuery,
    variables: {
      objects: emails.map((email) => ({
        team_id: userWithTeam.team.id,
        email,
      })),
    },
  });

  if (invitesResult.data.insert_invite.returning?.length <= 0) {
    errorResponse(res, 400, "unexpected");
  }

  const invites = invitesResult.data.insert_invite.returning;

  // ANCHOR: Send emails
  await Promise.all(
    invites.map(
      async (invite) =>
        await sendEmail({
          to: invite.email,
          body: Invite({
            email: invite.email,
            invitedBy: userWithTeam,
            teamName: userWithTeam.team.name,
            link: urls.invite(await generateInviteJWT(invite), true),
          }),
          subject: "Teamate invited you",
        })
    )
  );

  res.status(200).json({ status: "ok" });
}
