import { errorNotAllowed, errorResponse } from "@/legacy/backend/errors";
import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import { validateRequestSchema } from "@/legacy/backend/utils";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";

import {
  InsertTeamMutation,
  getSdk as getInsertTeamSdk,
} from "./graphql/insertTeam.generated";

import {
  InsertUserMutation,
  getSdk as getInsertUserSdk,
} from "./graphql/insertUser.generated";

import {
  InsertMembershipMutation,
  getSdk as getInsertMembershipSdk,
} from "./graphql/insertMembership.generated";

import { getSdk as createUserAndDeleteInviteSdk } from "@/legacy/api/signup/graphql/createUserAndDeleteInvite.generated";
import { getSdk as getInviteByIdSdk } from "@/legacy/api/signup/graphql/getInviteById.generated";
import { parse } from "next-useragent";
import requestIp from "request-ip";

import {
  Session,
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

import { isEmailUser } from "@/api/helpers/is-email-user";
import { Role_Enum } from "@/graphql/graphql";
import { IroncladActivityApi } from "@/legacy/lib/ironclad-activity-api";
import { urls } from "@/legacy/lib/urls";
import { logger } from "@/lib/logger";
import { Auth0User } from "@/lib/types";
import { captureEvent } from "@/services/posthogClient";

export type SignupResponse = { returnTo: string };

const schema = yup.object({
  team_name: yup.string().strict().required(),
  invite_id: yup.string().strict(),
});

export type SignupBody = yup.InferType<typeof schema>;

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
        req,
      );
    }

    const client = await getAPIServiceGraphqlClient();
    let user:
      | NonNullable<InsertMembershipMutation["insert_membership_one"]>["user"]
      | null = null;

    let insertMembershipResult: InsertMembershipMutation | null = null;

    if (invite_id) {
      const { invite } = await getInviteByIdSdk(client).GetInviteById({
        id: invite_id,
      });

      if (!invite || new Date(invite.expires_at) <= new Date()) {
        return errorResponse(res, 400, "invalid_invite", undefined, null, req);
      }

      const { user: createdUser } = await createUserAndDeleteInviteSdk(
        client,
      ).CreateUserAndDeleteInvite({
        team_id: invite.team.id,
        ironclad_id: ironCladUserId,
        nullifier: nullifier_hash ?? "",
        invite_id: invite.id,
        auth0Id: auth0User.sub,
        name: auth0User.name ?? "",
        email: auth0User.email,
      });

      insertMembershipResult = await getInsertMembershipSdk(
        client,
      ).InsertMembership({
        team_id: invite.team.id,
        user_id: createdUser?.id ?? "",
        role: Role_Enum.Member,
      });

      if (
        !insertMembershipResult.insert_membership_one?.team_id ||
        !insertMembershipResult.insert_membership_one?.user
      ) {
        logger.error(
          "Failed to insert membership while creating account from invite",
        );

        return errorResponse(
          res,
          500,
          "Failed to signup",
          undefined,
          null,
          req,
        );
      }

      user = insertMembershipResult.insert_membership_one.user;
    } else {
      let insertTeamResult: InsertTeamMutation | null = null;

      try {
        insertTeamResult = await getInsertTeamSdk(client).InsertTeam({
          team_name,
        });

        if (!insertTeamResult?.insert_team_one?.id) {
          throw new Error("Failed to insert team");
        }
      } catch (error) {
        console.log("Error while inserting team on signup:", { error });

        return errorResponse(
          res,
          500,
          "Failed to signup",
          undefined,
          null,
          req,
        );
      }

      let insertUserResult: InsertUserMutation | null = null;

      try {
        insertUserResult = await getInsertUserSdk(client).InsertUser({
          user_data: {
            name: auth0User.name,
            auth0Id: auth0User.sub,
            team_id: insertTeamResult.insert_team_one.id,
            ironclad_id: ironCladUserId,
            ...(nullifier_hash ? { world_id_nullifier: nullifier_hash } : {}),

            ...(auth0User.email_verified && auth0User.email
              ? { email: auth0User.email }
              : {}),
          },
        });

        if (!insertUserResult?.insert_user_one?.id) {
          throw new Error("Failed to insert user");
        }
      } catch (error) {
        console.log("Error while inserting user on signup:", { error });

        return errorResponse(
          res,
          500,
          "Failed to signup",
          undefined,
          null,
          req,
        );
      }

      insertMembershipResult = await getInsertMembershipSdk(
        client,
      ).InsertMembership({
        team_id: insertTeamResult.insert_team_one.id,
        user_id: insertUserResult.insert_user_one.id,
        role: Role_Enum.Owner,
      });

      if (
        !insertMembershipResult.insert_membership_one?.team_id ||
        !insertMembershipResult.insert_membership_one.user
      ) {
        return errorResponse(
          res,
          500,
          "Failed to signup",
          undefined,
          null,
          req,
        );
      }

      user = insertMembershipResult.insert_membership_one.user;
    }

    if (!user) {
      return errorResponse(res, 500, "Failed to signup", undefined, null, req);
    }

    await captureEvent({
      event: "signup_success",
      distinctId:
        insertMembershipResult.insert_membership_one.user.posthog_id ?? "",
      properties: {
        team_id: insertMembershipResult.insert_membership_one.team_id,
        invited: !!invite_id,
      },
    });

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
      returnTo: urls.app({
        team_id: insertMembershipResult.insert_membership_one.team_id,
      }),
    });
  },
);
