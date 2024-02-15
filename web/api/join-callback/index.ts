import { Auth0SessionUser, Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import {
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";
import { parse } from "next-useragent";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { validateRequestSchema } from "../helpers/validate-request-schema";

import { logger } from "@/lib/logger";
import { errorResponse } from "../helpers/errors";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";

import {
  DeleteInviteMutation,
  getSdk as getDeleteInviteSdk,
} from "./graphql/delete-invite.generated";

import {
  GetInviteByIdQuery,
  getSdk as getInviteByIdSdk,
} from "./graphql/getInviteById.generated";

import {
  InsertMembershipMutation,
  getSdk as getInsertMembershipSdk,
} from "./graphql/insertMembership.generated";

import { Role_Enum } from "@/graphql/graphql";
import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { isEmailUser } from "../helpers/is-email-user";

import {
  InsertUserMutation,
  getSdk as getInsertUserSdk,
} from "./graphql/insertUser.generated";

const schema = yup.object({
  invite_id: yup.string().strict().required(),
});

export type JoinBody = yup.InferType<typeof schema>;

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

  let body = await req.json();

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    value: body,
    schema,
  });

  if (!isValid || !parsedParams) {
    return handleError(req);
  }

  const { invite_id } = parsedParams;

  // ANCHOR: Sending acceptance
  let ironCladUserId: string | null = null;

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

  // ANCHOR: Handle invites
  let inviteData: GetInviteByIdQuery["invite"] | null = null;

  try {
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

    inviteData = invite;
  } catch (error) {
    logger.error("Error while fetching invite on team create", { error });

    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
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

        team_id: inviteData.team.id,
      },
    });

    insertedUser = insert_user_one;
  } catch (error) {
    logger.error("Error while inserting user on create-team:", { error });

    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
    });
  }

  let insertedMembership:
    | InsertMembershipMutation["insert_membership_one"]
    | null = null;

  try {
    if (!inviteData.team.id) {
      throw new Error("Team id is null");
    }

    if (!insertedUser?.id) {
      throw new Error("User id is null");
    }

    const { insert_membership_one } = await getInsertMembershipSdk(
      client,
    ).InsertMembership({
      team_id: inviteData.team.id,
      user_id: insertedUser?.id,
      role: Role_Enum.Member,
    });

    insertedMembership = insert_membership_one;
  } catch (error) {
    logger.error("Error while inserting membership on create-team:", { error });

    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
    });
  }

  if (!insertedMembership) {
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
    });
  }

  // ANCHOR: Delete invite
  let deletedInviteData: DeleteInviteMutation["delete_invite_by_pk"] | null =
    null;

  if (inviteData && invite_id) {
    try {
      const { delete_invite_by_pk } = await getDeleteInviteSdk(
        client,
      ).DeleteInvite({
        invite_id,
      });

      deletedInviteData = delete_invite_by_pk;
    } catch (error) {
      logger.error("Error while deleting invite on create-team:", { error });

      return errorResponse({
        statusCode: 500,
        code: "server_error",
        detail: "Failed to join team",
        req,
      });
    }
  }

  const user = insertedMembership.user;

  const res = NextResponse.json({
    returnTo: urls.teams({ team_id: insertedMembership?.team_id }),
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
