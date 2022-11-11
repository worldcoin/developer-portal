import { runCors } from "../../../../cors";
import { NextApiRequest, NextApiResponse } from "next";
import { errorNotAllowed, errorRequiredAttribute, errorResponse } from "errors";
import { decodeJwt } from "jose";
import { getAPIServiceClient } from "api-graphql";
import { gql } from "@apollo/client";
import dayjs from "dayjs";

const InviteQuery = gql`
  query Invite($id: String!) {
    invite_by_pk(id: $id) {
      id
      email
      expires_at
      team {
        id
        name
      }
    }
  }
`;

type InviteRequestResult = {
  invite_by_pk: {
    id: string;
    email: string | null;
    expires_at: string;
    team: {
      id: string;
      name: string;
    };
  };
};

export default async function invite(
  req: NextApiRequest,
  res: NextApiResponse
) {
  await runCors(req, res);

  if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method, res);
  }

  if (!req.body.jwt) {
    return errorRequiredAttribute("jwt", res);
  }

  let payload;

  try {
    payload = decodeJwt(req.body.jwt);
  } catch (err) {
    return errorResponse(res, 500, "invalid", "Your invite invalid");
  }

  const client = await getAPIServiceClient();

  const inviteResponse = await client.query<InviteRequestResult>({
    query: InviteQuery,
    variables: {
      id: payload.id,
    },
  });

  if (!inviteResponse.data.invite_by_pk) {
    return errorResponse(res, 500, "not_found", "Your invite not found");
  }

  if (dayjs(dayjs()).isAfter(inviteResponse.data.invite_by_pk.expires_at)) {
    return errorResponse(res, 500, "expired", "Your invite has expired");
  }

  return res.status(200).json({ invite: inviteResponse.data.invite_by_pk });
}
