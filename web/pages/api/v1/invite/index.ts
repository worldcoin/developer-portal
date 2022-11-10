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

  const payload = decodeJwt(req.body.jwt);

  const client = await getAPIServiceClient();

  const inviteResponse = await client.query<InviteRequestResult>({
    query: InviteQuery,
    variables: {
      id: payload.id,
    },
  });

  if (dayjs(dayjs()).isAfter(inviteResponse.data.invite_by_pk.expires_at)) {
    return res.status(200).json({ status: "expired" });
  }

  if (inviteResponse.data.invite_by_pk.id) {
    return res.status(200).json({ invite: inviteResponse.data.invite_by_pk });
  }

  errorResponse(res, 500, "unexpected");
}
