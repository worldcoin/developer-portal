import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { isEmailUser } from "@/api/helpers/is-email-user";
import { isPasswordUser } from "@/api/helpers/is-password-user";
import { getAppUrlFromRequest } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { Role_Enum } from "@/graphql/graphql";
import { auth0, toSessionRequest } from "@/lib/auth0";
import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { logger } from "@/lib/logger";
import { teamNameSchema } from "@/lib/schema";
import type { Auth0SessionUser, Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import { captureEvent } from "@/services/posthogClient";
import crypto from "crypto";
import type { GraphQLClient } from "graphql-request";
import { parse } from "next-useragent";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getDefaultTeamName } from "./default-team-name";
import { getSdk as getGetUserByAuth0IdSdk } from "./graphql/get-user-by-auth0id.generated";
import {
  type InsertMembershipMutation,
  getSdk as getInsertMembershipSdk,
} from "./graphql/insert-membership.generated";
import { getSdk as getInsertTeamSdk } from "./graphql/insert-team.generated";
import { getSdk as getInsertUserSdk } from "./graphql/insert-user.generated";

const schema = yup
  .object({
    team_name: teamNameSchema,
  })
  .noUnknown();

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

type Membership = NonNullable<
  InsertMembershipMutation["insert_membership_one"]
>;

const insertTeam = async (client: GraphQLClient, teamName: string) => {
  const { insert_team_one: team } = await getInsertTeamSdk(client).InsertTeam({
    team_name: teamName,
  });

  if (!team?.id) {
    throw new Error("Team id is null");
  }

  return team.id;
};

const insertOwnerMembership = async (
  client: GraphQLClient,
  teamId: string,
  userId: string,
): Promise<Membership> => {
  const { insert_membership_one: membership } = await getInsertMembershipSdk(
    client,
  ).InsertMembership({
    team_id: teamId,
    user_id: userId,
    role: Role_Enum.Owner,
  });

  if (!membership) {
    throw new Error("Membership is null");
  }

  return membership;
};

export const createFirstTeamForExistingUser = async ({
  auth0User,
  client,
  userId,
}: {
  auth0User: Auth0User;
  client: GraphQLClient;
  userId: string;
}): Promise<Membership> => {
  const teamId = await insertTeam(client, getDefaultTeamName(auth0User));
  return insertOwnerMembership(client, teamId, userId);
};

export const createFirstTeamForUser = async ({
  auth0User,
  client,
  req,
}: {
  auth0User: Auth0User;
  client: GraphQLClient;
  req: NextRequest;
}): Promise<Membership> => {
  const ironcladId = crypto.randomUUID();
  const appUrl = await getAppUrlFromRequest(req);
  const signupUrl = new URL(urls.signUp(), appUrl);
  const requestHeaders = req.headers ?? new Headers();
  const { os } = parse(requestHeaders.get("user-agent") ?? "");

  await new IroncladActivityApi().sendAcceptance(ironcladId, {
    addr:
      requestHeaders.get("x-forwarded-for") ??
      requestHeaders.get("x-real-ip") ??
      "",
    pau: signupUrl.toString(),
    pad: signupUrl.host,
    pap: signupUrl.pathname,
    hn: signupUrl.hostname,
    bl: requestHeaders.get("accept-language") ?? "",
    os,
  });

  const teamId = await insertTeam(client, getDefaultTeamName(auth0User));
  const isWorldIdUser = !isEmailUser(auth0User) && !isPasswordUser(auth0User);
  const nullifier = isWorldIdUser ? auth0User.sub.split("|")[2] : undefined;
  const { insert_user_one: user } = await getInsertUserSdk(client).InsertUser({
    user_data: {
      ironclad_id: ironcladId,
      auth0Id: auth0User.sub,
      name: auth0User.name || auth0User.nickname || auth0User.email || "",
      ...(nullifier ? { world_id_nullifier: nullifier } : {}),
      ...(auth0User.email_verified && auth0User.email
        ? { email: auth0User.email }
        : {}),
      team_id: teamId,
    },
  });

  if (!user?.id) {
    throw new Error("User id is null");
  }

  await captureEvent({
    event: "signup_success",
    distinctId: user.posthog_id ?? "",
    properties: { team_id: teamId },
  });

  return insertOwnerMembership(client, teamId, user.id);
};

export const POST = async (req: NextRequest) => {
  const session = await auth0.getSession();

  if (!session) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      req,
    });
  }

  const auth0User = session.user as
    | Auth0User
    | NonNullable<Auth0SessionUser["user"]>;
  const sessionUserId = (auth0User as Auth0SessionUser["user"])?.hasura?.id;
  const body = await req.json();
  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    value: body,
    schema,
  });

  if (!isValid || !parsedParams) {
    return handleError(req);
  }

  const client = await getAPIServiceGraphqlClient();
  let userId = sessionUserId;

  if (!userId) {
    try {
      const { user } = await getGetUserByAuth0IdSdk(client).GetUserByAuth0Id({
        auth0Id: auth0User.sub,
      });
      userId = user[0]?.id;
    } catch (error) {
      logger.error("Error while looking up user on create team:", {
        error,
        graphqlResponse: (error as { response?: unknown })?.response,
      });
    }
  }

  if (!userId) {
    return errorResponse({
      statusCode: 403,
      code: "permission_denied",
      detail: "Failed to create team",
      req,
    });
  }

  let membership: Membership;

  try {
    const teamId = await insertTeam(client, parsedParams.team_name);
    membership = await insertOwnerMembership(client, teamId, userId);
  } catch (error) {
    logger.error("Error while creating team:", {
      error,
      graphqlResponse: (error as { response?: unknown })?.response,
    });

    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to create team",
      req,
    });
  }

  const res = NextResponse.json({
    returnTo: urls.teams({ team_id: membership.team_id }),
  });

  await auth0.updateSession(toSessionRequest(req), res, {
    ...session,
    user: {
      ...session.user,
      hasura: {
        ...membership.user,
      },
    },
  });

  return res;
};
