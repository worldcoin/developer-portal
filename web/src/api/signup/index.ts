import { errorNotAllowed, errorResponse } from "src/backend/errors";
import { NextApiRequest, NextApiResponse } from "next";
import { getAPIServiceGraphqlClient } from "src/backend/graphql";
import * as yup from "yup";
import { validateRequestSchema } from "src/backend/utils";
import { getSdk as getSignupSdk } from "./graphql/signup.generated";
import { getSdk as getInviteByIdSdk } from "@/api/signup/graphql/getInviteById.generated";
import { getSdk as createUserAndDeleteInviteSdk } from "@/api/signup/graphql/createUserAndDeleteInvite.generated";
import requestIp from "request-ip";
import { parse } from "next-useragent";

import {
  Session,
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

import { Auth0User } from "src/lib/types";
import { isEmailUser } from "src/lib/utils";
import { urls } from "src/lib/urls";
import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { logger } from "@/lib/logger";

export type SignupResponse = { returnTo: string };

const schema = yup.object({
  team_name: yup.string().strict().required(),
  invite_id: yup.string().strict(),
});

export type SignupBody = yup.InferType<typeof schema>;

type User = {
  id?: string;
  ironclad_id?: string;
  world_id_nullifier?: string | null;
  team_id?: string;
};

export const handleSignup = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse<SignupResponse>) => {
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

    const { team_name, invite_id } = parsedParams;

    let nullifier_hash: string | undefined = undefined;

    if (!isEmailUser(auth0User)) {
      const nullifier = auth0User.sub.split("|")[2];
      nullifier_hash = nullifier;
    }

    const ironcladActivityApi = new IroncladActivityApi();
    const ironCladUserId = crypto.randomUUID();

    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_APP_URL}/signup`);
      const { os } = parse(req.headers["user-agent"] ?? "");
      await ironcladActivityApi.sendAcceptance(ironCladUserId, {
        addr: requestIp.getClientIp(req) ?? undefined,
        pau: `${url.origin}/signup`,
        pad: url.host,
        pap: url.pathname,
        hn: url.hostname,
        bl: req.headers["accept-language"],
        os,
      });
    } catch (error) {
      logger.error("Failed to send acceptance", { error });

      return errorResponse(
        res,
        500,
        "Failed to send acceptance",
        undefined,
        null,
        req
      );
    }

    const client = await getAPIServiceGraphqlClient();
    let user: User | null | undefined = null;

    if (invite_id) {
      const { invite } = await getInviteByIdSdk(client).GetInviteById({
        id: invite_id,
      });

      if (!invite || new Date(invite.expires_at) <= new Date()) {
        return errorResponse(res, 400, "invalid_invite", undefined, null, req);
      }

      const { user: createdUser } = await createUserAndDeleteInviteSdk(
        client
      ).CreateUserAndDeleteInvite({
        team_id: invite.team.id,
        ironclad_id: ironCladUserId,
        nullifier: nullifier_hash ?? "",
        invite_id: invite.id,
        auth0Id: auth0User.sub,
      });

      user = {
        id: createdUser?.id,
        ironclad_id: createdUser?.ironclad_id,
        world_id_nullifier: createdUser?.world_id_nullifier,
        team_id: createdUser?.team_id,
      };
    } else {
      const signupData = await getSignupSdk(client).Signup({
        team_name,

        data: {
          name: auth0User.name,
          auth0Id: auth0User.sub,
          ironclad_id: ironCladUserId,
          ...(nullifier_hash ? { world_id_nullifier: nullifier_hash } : {}),

          ...(auth0User.email_verified && auth0User.email
            ? { email: auth0User.email }
            : {}),
        },
      });

      user = {
        id: signupData.insert_team_one?.users[0].id,
        ironclad_id: signupData.insert_team_one?.users[0].ironclad_id,
        world_id_nullifier:
          signupData.insert_team_one?.users[0].world_id_nullifier,
        team_id: signupData.insert_team_one?.id,
      };
    }

    if (!user) {
      return errorResponse(res, 500, "Failed to signup", undefined, null, req);
    }

    await updateSession(req, res, {
      ...session,
      user: {
        ...session.user,
        hasura: {
          ...user,
        },
      },
    });

    res.status(200).json({
      returnTo: urls.app(),
    });
  }
);
