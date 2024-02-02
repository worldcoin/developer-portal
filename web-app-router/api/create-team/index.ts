import {
  Session,
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";
import { NextRequest, NextResponse } from "next/server";
import { urls } from "@/lib/urls";
import { logger } from "@/lib/logger";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import * as yup from "yup";
import { Auth0User } from "@/lib/types";
import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { parse } from "next-useragent";
import { headers as nextHeaders } from "next/headers";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { errorResponse } from "@/api/helpers/errors";

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

import { getSdk as getInviteByIdSdk } from "./graphql/getInviteById.generated";
import { getSdk as createUserAndDeleteInviteSdk } from "./graphql/createUserAndDeleteInvite.generated";
import { Role_Enum } from "@/graphql/graphql";
import { isEmailUser } from "../helpers/is-email-user";

const schema = yup.object({
  team_name: yup.string().strict().required(),
  invite_id: yup.string().strict().nullable(),
});

export type CreateTeamBody = yup.InferType<typeof schema>;

type ErrorResponseParams = Parameters<typeof errorResponse>[0];

export type CreateTeamResponse =
  | {
      returnTo: string;
      code?: never;
      detail?: never;
      attribute?: never;
    }
  | {
      returnTo?: never;
      code: ErrorResponseParams["code"];
      detail: ErrorResponseParams["detail"];
      attribute: ErrorResponseParams["attribute"];
    };

export const POST = withApiAuthRequired(async (req: NextRequest) => {
  const session = await getSession();
  const auth0User = session?.user as Auth0User;
  let body = await req.json();

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    value: body,
    schema,
  });

  if (!isValid || !parsedParams) {
    return handleError(req);
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
    const headersList = nextHeaders();
    let headers: Record<string, string> = {};

    headersList.forEach((v, k) => {
      headers[k] = v;
    });

    const { os } = parse(headersList.get("user-agent") ?? "");

    await ironcladActivityApi.sendAcceptance(ironCladUserId, {
      addr:
        headersList.get("x-forwarded-for") ??
        headersList.get("x-real-ip") ??
        "",
      pau: `${url.origin}/signup`,
      pad: url.host,
      pap: url.pathname,
      hn: url.hostname,
      bl: headersList.get("accept-language") ?? "",
      os,
    });
  } catch (error) {
    logger.error("Failed to send acceptance", { error });

    return errorResponse({
      statusCode: 500,
      code: "Failed to send acceptance",
      detail: undefined,
      attribute: null,
      req,
    });
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
      return errorResponse({
        statusCode: 400,
        code: "invalid_invite",
        req,
      });
    }

    const { user: createdUser } = await createUserAndDeleteInviteSdk(
      client
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
      client
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
        "Failed to insert membership while creating account from invite"
      );

      return errorResponse({
        statusCode: 500,
        code: "Failed to signup",
        req,
      });
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
      logger.error("Error while inserting team on signup:", { error });

      return errorResponse({
        statusCode: 500,
        code: "Failed to signup",
        req,
      });
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
      logger.error("Error while inserting user on signup:", { error });

      return errorResponse({
        statusCode: 500,
        code: "Failed to signup",
        req,
      });
    }

    insertMembershipResult = await getInsertMembershipSdk(
      client
    ).InsertMembership({
      team_id: insertTeamResult.insert_team_one.id,
      user_id: insertUserResult.insert_user_one.id,
      role: Role_Enum.Owner,
    });

    if (
      !insertMembershipResult.insert_membership_one?.team_id ||
      !insertMembershipResult.insert_membership_one.user
    ) {
      return errorResponse({
        statusCode: 500,
        code: "Failed to signup",
        req,
      });
    }

    user = insertMembershipResult.insert_membership_one.user;
  }

  if (!user) {
    return errorResponse({
      statusCode: 500,
      code: "Failed to signup",
      req,
    });
  }

  // FIXME: Update url
  const res = NextResponse.json({
    returnTo: "/teams",
  });

  await updateSession(req, res, {
    ...session,
    user: {
      ...session?.user,
      hasura: {
        ...user,
      },
    },
  });

  return res;
});
