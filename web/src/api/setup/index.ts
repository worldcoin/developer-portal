import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "src/backend/cookies";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import { generateUserJWT, verifySignUpJWT } from "src/backend/jwts";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { getSdk } from "./graphql/signup.generated";
import {
  Session,
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";
import { Auth0User } from "src/lib/types";
import { isEmailUser } from "src/lib/utils";
import { urls } from "src/lib/urls";

export type SetupResponse = { returnTo: string };

const schema = yup.object({
  team_name: yup.string().strict().required(),
  ironclad_id: yup.string().strict().required(),
});

export type SetupBody = yup.InferType<typeof schema>;

export const handleSetup = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse<SetupResponse>) => {
    if (!req.method || !["POST", "OPTIONS"].includes(req.method)) {
      return errorNotAllowed(req.method, res, req);
    }

    const session = (await getSession(req, res)) as Session;
    const auth0User = session?.user as Auth0User;

    const { isValid, parsedParams, handleError } = await validateRequestSchema({
      value: req.body,
      schema,
    });

    if (!isValid || !parsedParams) {
      return handleError(req, res);
    }

    const { team_name, ironclad_id } = parsedParams;

    let nullifier_hash: string | undefined = undefined;

    if (!isEmailUser(auth0User)) {
      const nullifier = auth0User.sub.split("|")[2];
      nullifier_hash = nullifier;
    }

    const client = await getAPIServiceGraphqlClient();

    const data = await getSdk(client).Setup({
      name: auth0User.name,
      auth0Id: auth0User.sub,
      team_name,
      ironclad_id,
      nullifier_hash: nullifier_hash ?? "",
    });

    const team = data.insert_team_one;
    const user = team?.users[0];

    if (!team || !user) {
      return errorResponse(res, 500, "Failed to signup", undefined, null, req);
    }

    await updateSession(req, res, {
      ...session,
      user: {
        ...session.user,
        hasura: {
          ...user,
          team_id: team.id,
        },
      },
    });

    res.status(200).json({
      returnTo: urls.app(),
    });
  }
);
