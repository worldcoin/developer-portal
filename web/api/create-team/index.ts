import { errorResponse } from "@/api/helpers/errors";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { Role_Enum } from "@/graphql/graphql";
import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { logger } from "@/lib/logger";
import { Auth0SessionUser, Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import crypto from "crypto";
import { parse } from "next-useragent";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import { isEmailUser } from "../helpers/is-email-user";

import {
  InsertTeamMutation,
  getSdk as getInsertTeamSdk,
} from "./graphql/insert-team.generated";

import {
  InsertMembershipMutation,
  getSdk as getInsertMembershipSdk,
} from "./graphql/insert-membership.generated";

import {
  InsertUserMutation,
  getSdk as getInsertUserSdk,
} from "./graphql/insert-user.generated";

import { teamNameSchema } from "@/lib/schema";
import { captureEvent } from "@/services/posthogClient";
import {
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

const schema = yup
  .object({
    team_name: teamNameSchema,
    hasUser: yup.boolean(),
  })
  .noUnknown()
  .strict();

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
  const auth0User = session?.user as Auth0User | Auth0SessionUser["user"];

  if (!auth0User) {
    return errorResponse({
      statusCode: 401,
      code: "unauthorized",
      req,
    });
  }

  const hasuraUserId = (auth0User as Auth0SessionUser["user"])?.hasura?.id;
  let body = await req.json();

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    value: body,
    schema,
  });

  if (!isValid || !parsedParams) {
    return handleError(req);
  }

  const { team_name, hasUser } = parsedParams;

  // ANCHOR: Sending acceptance
  let ironCladUserId: string | null = null;

  if (!hasUser) {
    const ironcladActivityApi = new IroncladActivityApi();
    ironCladUserId = crypto.randomUUID();

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
        pau: `${url.origin}/create-team`,
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
        code: "server_error",
        detail: "Failed to send acceptance",
        attribute: null,
        req,
      });
    }
  }

  const client = await getAPIServiceGraphqlClient();

  // ANCHOR: Insert team
  let insertedTeam: InsertTeamMutation["insert_team_one"] | null = null;

  try {
    const { insert_team_one } = await getInsertTeamSdk(client).InsertTeam({
      team_name,
    });

    insertedTeam = insert_team_one;
  } catch (error) {
    logger.error("Error while inserting team on create team:", { error });

    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to create team",
      req,
    });
  }

  // ANCHOR: Insert user
  let nullifier_hash: string | undefined = undefined;

  if (!isEmailUser(auth0User)) {
    const nullifier = auth0User.sub.split("|")[2];
    nullifier_hash = nullifier;
  }

  let insertedUser: InsertUserMutation["insert_user_one"] | null = null;

  if (!hasUser) {
    try {
      const { insert_user_one } = await getInsertUserSdk(client).InsertUser({
        user_data: {
          ironclad_id: ironCladUserId,
          auth0Id: auth0User.sub,
          name: auth0User.name ?? "",

          ...(nullifier_hash ? { world_id_nullifier: nullifier_hash } : {}),

          ...(auth0User.email_verified && auth0User.email
            ? { email: auth0User.email }
            : {}),

          team_id: insertedTeam?.id,
        },
      });

      insertedUser = insert_user_one;

      await captureEvent({
        event: "signup_success",
        distinctId: insert_user_one?.posthog_id ?? "",
        properties: {
          team_id: insertedTeam?.id,
        },
      });
    } catch (error) {
      logger.error("Error while inserting user on create team:", { error });

      return errorResponse({
        statusCode: 500,
        code: "server_error",
        detail: "Failed to create team",
        req,
      });
    }
  }

  // ANCHOR: Insert membership
  let insertedMembership:
    | InsertMembershipMutation["insert_membership_one"]
    | null = null;

  try {
    const user_id = hasUser ? hasuraUserId : insertedUser?.id;

    if (!insertedTeam?.id) {
      throw new Error("Team id is null");
    }

    if (!user_id) {
      throw new Error("User id is null");
    }

    const { insert_membership_one } = await getInsertMembershipSdk(
      client,
    ).InsertMembership({
      team_id: insertedTeam?.id,
      user_id,
      role: Role_Enum.Owner,
    });

    insertedMembership = insert_membership_one;
  } catch (error) {
    logger.error("Error while inserting membership on create team:", { error });

    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to create team",
      req,
    });
  }

  // NOTE: we will insert membership in any case, if there is no membership, definitely there is some issue
  if (!insertedMembership) {
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to create team",
      req,
    });
  }

  const user = insertedMembership.user;

  const returnTo = urls[hasUser ? "teams" : "app"]({
    team_id: insertedMembership.team_id,
  });

  const res = NextResponse.json({ returnTo });

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
