import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { logger } from "@/lib/logger";
import { Auth0SessionUser, Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import crypto from "crypto";
import { parse } from "next-useragent";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";
import { isSameOriginRequest } from "../helpers/csrf";
import { errorResponse } from "../helpers/errors";
import { findHasuraUser } from "../helpers/find-hasura-user";
import { getAPIServiceGraphqlClient } from "../helpers/graphql";
import { isEmailUser } from "../helpers/is-email-user";
import { getAppUrlFromRequest } from "../helpers/utils";
import { validateRequestSchema } from "../helpers/validate-request-schema";

import { auth0, toSessionRequest } from "@/lib/auth0";

import {
  GetInviteByIdQuery,
  getSdk as getInviteByIdSdk,
} from "./graphql/get-invite-by-id.generated";

import {
  AcceptTeamInviteMutation,
  getSdk as getAcceptTeamInviteSdk,
} from "./graphql/accept-team-invite.generated";

import { captureEvent } from "@/services/posthogClient";
import {
  InsertUserMutation,
  getSdk as getInsertUserSdk,
} from "./graphql/insert-user.generated";

const schema = yup
  .object({
    invite_id: yup.string().strict().required(),
  })
  .noUnknown();

export type JoinBody = yup.InferType<typeof schema>;

const normalizeEmail = (email: string) => email.toLowerCase().trim();

/**
 * Consume a team invite for the currently authenticated user, onboarding them
 * first if this is their initial sign-up.
 *
 * This is the *only* path that consumes an invite. It deliberately requires a
 * same-origin POST: the session cookie is `SameSite=Lax`, so a bare GET (or a
 * cross-site form post) is something an attacker can drive with one top-level
 * navigation, and joining a team hands the team's owner read access to the
 * member's `user` row. The caller is `/join-callback`, which only fires this off
 * an explicit click (HackerOne #3943242).
 */
export const POST = async (req: NextRequest) => {
  if (!(await isSameOriginRequest(req))) {
    return errorResponse({
      statusCode: 403,
      code: "cross_origin_request",
      detail: "This endpoint only accepts same-origin requests.",
      req,
    });
  }

  const session = await auth0.getSession();
  const appUrl = await getAppUrlFromRequest(req);

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

  let body = await req.json();

  const { isValid, parsedParams, handleError } = await validateRequestSchema({
    value: body,
    schema,
  });

  if (!isValid || !parsedParams) {
    return handleError(req);
  }

  const { invite_id } = parsedParams;

  const client = await getAPIServiceGraphqlClient();

  // ANCHOR: Handle invites
  let inviteData: GetInviteByIdQuery["invite"] | null = null;

  try {
    const { invite } = await getInviteByIdSdk(client).GetInviteById({
      id: invite_id,
    });

    inviteData = invite;
  } catch (error) {
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
    });
  }

  if (!inviteData || new Date(inviteData.expires_at) <= new Date()) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_invite",
      detail: "This invite is no longer valid. Ask for a new one.",
      req,
    });
  }

  // Sign-in-with-World-ID sessions carry no email, so there is nothing to match
  // against; the explicit click on the consent screen is what authorises the join.
  if (
    auth0User.email_verified &&
    auth0User.email &&
    normalizeEmail(inviteData.email) !== normalizeEmail(auth0User.email)
  ) {
    logger.warn("Invite email does not match logged in email", {
      team_id: inviteData.team.id,
    });

    return errorResponse({
      statusCode: 403,
      code: "invite_email_mismatch",
      detail:
        "Invite email does not match logged in email. Please log out and try again.",
      req,
      team_id: inviteData.team.id,
    });
  }

  // ANCHOR: Resolve or onboard the user
  let existingUserId: string | null = null;

  try {
    const existingUser = await findHasuraUser(client, auth0User);
    existingUserId = existingUser?.id ?? null;
  } catch (error) {
    logger.error("Error while fetching the Hasura user in join-callback.", {
      error,
      auth0Sub: auth0User.sub,
      team_id: inviteData.team.id,
    });

    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
      team_id: inviteData.team.id,
    });
  }

  let userId = existingUserId;

  // Only a first-time sign-up records a terms acceptance and creates a row — a
  // member who already has an account is just gaining one more membership.
  if (!userId) {
    const ironCladUserId = crypto.randomUUID();
    const ironcladActivityApi = new IroncladActivityApi();

    try {
      const url = new URL(urls.signUp(), appUrl);
      const headersList = await nextHeaders();

      const { os } = parse(headersList.get("user-agent") ?? "");

      await ironcladActivityApi.sendAcceptance(ironCladUserId, {
        addr:
          headersList.get("x-forwarded-for") ??
          headersList.get("x-real-ip") ??
          "",
        pau: `${url.origin}/join-callback`,
        pad: url.host,
        pap: url.pathname,
        hn: url.hostname,
        bl: headersList.get("accept-language") ?? "",
        os,
      });
    } catch (error) {
      return errorResponse({
        statusCode: 500,
        code: "Failed to send acceptance",
        detail: undefined,
        attribute: null,
        req,
      });
    }

    // ANCHOR: Insert user
    let nullifier_hash: string | undefined = undefined;

    if (!isEmailUser(auth0User)) {
      nullifier_hash = auth0User.sub.split("|")[2];
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

      await captureEvent({
        event: "signup_success",
        distinctId: insert_user_one?.posthog_id ?? "",
        properties: {
          team_id: inviteData.team.id,
          invited: true,
        },
      });
    } catch (error) {
      return errorResponse({
        statusCode: 500,
        code: "server_error",
        detail: "Failed to join team",
        req,
        team_id: inviteData.team.id,
      });
    }

    if (!insertedUser?.id) {
      return errorResponse({
        statusCode: 500,
        code: "server_error",
        detail: "Failed to join team",
        req,
        team_id: inviteData.team.id,
      });
    }

    userId = insertedUser.id;
  }

  let acceptedMembership:
    | AcceptTeamInviteMutation["accept_team_invite"][number]
    | null = null;

  try {
    const acceptInviteResult = await getAcceptTeamInviteSdk(
      client,
    ).AcceptTeamInvite({
      team_id: inviteData.team.id,
      user_id: userId,
      invite_id,
    });

    acceptedMembership = acceptInviteResult.accept_team_invite[0] ?? null;
  } catch (error) {
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
      team_id: inviteData.team.id,
    });
  }

  if (!acceptedMembership) {
    // The single-use invite was consumed by somebody else between the lookup
    // above and this call. No membership was created.
    return errorResponse({
      statusCode: 400,
      code: "invalid_invite",
      detail: "This invite has already been used. Ask for a new one.",
      req,
      team_id: inviteData.team.id,
    });
  }

  // Hasura resolves a function's nested relationships from a snapshot taken
  // before the function's INSERT. Add the newly-created membership to the
  // session result when it is missing from user.memberships.
  const priorMemberships = acceptedMembership.user.memberships;
  const joinedTeamPresent = priorMemberships.some(
    (membership) => membership.team.id === acceptedMembership.team.id,
  );
  const user = {
    ...acceptedMembership.user,
    memberships: joinedTeamPresent
      ? priorMemberships
      : [
          ...priorMemberships,
          {
            team: acceptedMembership.team,
            role: acceptedMembership.role,
          },
        ],
  };

  const res = NextResponse.json({
    returnTo: urls.teams({ team_id: acceptedMembership.team_id }),
  });

  // Body-free request for the SDK (see toSessionRequest): the body was read above,
  // and on Next 16 the SDK re-wraps + copies the request body, which would throw.
  await auth0.updateSession(toSessionRequest(req), res, {
    ...session,
    user: {
      ...session.user,
      hasura: {
        ...user,
      },
    },
  });

  return res;
};
