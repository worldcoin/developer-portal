import { gql } from "@apollo/client";
import { runCors } from "../../../../cors";
import { errorNotAllowed, errorResponse, errorUnauthenticated } from "errors";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPISSRClient } from "ssr-graphql";
import { generateInviteJWT } from "api-utils";
import { urls } from "urls";

const teamQuery = gql`
  query Team {
    team {
      id
    }
  }
`;

type TeamRequestResult = {
  team: Array<{
    id: string;
  }>;
};

const insertInviteQuery = gql`
  mutation InsertInvite($object: invite_insert_input!) {
    insert_invite_one(object: $object) {
      id
      team_id
    }
  }
`;

type insertInviteRequestResult = {
  insert_invite_one: {
    id: string;
    team_id: string;
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

  if (!req.headers.authorization) {
    return errorUnauthenticated(undefined, res);
  }

  const client = await getAPISSRClient(req);

  // ANCHOR: Fetch team
  const teamResult = await client.query<TeamRequestResult>({
    query: teamQuery,
  });

  if (teamResult.data.team.length <= 0) {
    errorResponse(
      res,
      400,
      "team_not_found",
      "Your team not found, probably session has expired"
    );
  }

  const team = teamResult.data.team[0];

  // ANCHOR: Insert invites
  const invitesResult = await client.query<insertInviteRequestResult>({
    query: insertInviteQuery,
    variables: { object: { team_id: team.id } },
  });

  if (!invitesResult.data.insert_invite_one) {
    errorResponse(res, 400, "unexpected");
  }

  const invite = invitesResult.data.insert_invite_one;

  if (invite) {
    res
      .status(200)
      .json({ link: urls.invite(await generateInviteJWT(invite), true) });
  }

  return errorResponse(res, 500, "unexpected", "Unexpected error");
}
