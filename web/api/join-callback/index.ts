import { isSameOriginRequest } from "@/api/helpers/csrf";
import { errorResponse } from "@/api/helpers/errors";
import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import {
  isEmailUser,
  emailForInsensitiveLookup,
} from "@/api/helpers/is-email-user";
import { isPasswordUser } from "@/api/helpers/is-password-user";
import { getAppUrlFromRequest } from "@/api/helpers/utils";
import { validateRequestSchema } from "@/api/helpers/validate-request-schema";
import { auth0, toSessionRequest } from "@/lib/auth0";
import { IroncladActivityApi } from "@/lib/ironclad-activity-api";
import { logger } from "@/lib/logger";
import { Auth0SessionUser, Auth0User } from "@/lib/types";
import { urls } from "@/lib/urls";
import { captureEvent } from "@/services/posthogClient";
import crypto from "crypto";
import { parse } from "next-useragent";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as yup from "yup";

import {
  FetchEmailUserQuery,
  getSdk as getFetchEmailUserSdk,
} from "../login-callback/graphql/fetch-email-user.generated";
import {
  FetchNullifierUserQuery,
  getSdk as getFetchNullifierUserSdk,
} from "../login-callback/graphql/fetch-nullifier-user.generated";

import {
  AcceptTeamInviteMutation,
  getSdk as getAcceptTeamInviteSdk,
} from "./graphql/accept-team-invite.generated";
import {
  GetInviteByIdQuery,
  getSdk as getInviteByIdSdk,
} from "./graphql/get-invite-by-id.generated";
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

const normalizeEmail = (email: string): string => email.toLowerCase().trim();

/**
 * The email address this session has *proven* it controls, or `null` when it has
 * proven none.
 *
 * Only email-OTP and username/password identities carry an address Auth0 has
 * verified. A Sign-in-with-World-ID (wallet) identity has no `email` claim at
 * all — `Auth0WorldUser` types it as `never` — so it can never satisfy an
 * invite's ownership requirement, and neither can an identity whose address
 * Auth0 has not marked verified.
 */
const verifiedEmailOf = (
  auth0User: Auth0User | NonNullable<Auth0SessionUser["user"]>,
): string | null => {
  if (!isEmailUser(auth0User) && !isPasswordUser(auth0User)) {
    return null;
  }

  if (!auth0User.email_verified || !auth0User.email) {
    return null;
  }

  return auth0User.email;
};

type PortalUser =
  | FetchEmailUserQuery["userByAuth0Id"][number]
  | FetchEmailUserQuery["userByEmail"][number]
  | FetchNullifierUserQuery["user"][number];

const findExistingPortalUser = async (
  client: Awaited<ReturnType<typeof getAPIServiceGraphqlClient>>,
  auth0User: Auth0User | NonNullable<Auth0SessionUser["user"]>,
): Promise<PortalUser | null> => {
  if (!isEmailUser(auth0User) && !isPasswordUser(auth0User)) {
    const nullifier = auth0User.sub.split("|")[2];
    const userData = await getFetchNullifierUserSdk(client).FetchNullifierUser({
      world_id_nullifier: nullifier,
      auth0Id: auth0User.sub,
    });

    if (userData.user.length === 1) {
      return userData.user[0];
    }

    if (userData.user.length > 1) {
      throw new Error(
        `Auth migration error, more than one user found for nullifier_hash: ${nullifier} & auth0Id: ${auth0User.sub}`,
      );
    }

    return null;
  }

  const userData = await getFetchEmailUserSdk(client).FetchEmailUser({
    auth0Id: auth0User.sub,
    email: auth0User.email
      ? emailForInsensitiveLookup(auth0User.email)
      : auth0User.email,
  });

  if (userData.userByAuth0Id.length > 0) {
    return userData.userByAuth0Id[0];
  }

  if (userData.userByEmail.length > 0) {
    return userData.userByEmail[0];
  }

  return null;
};

const membershipWithJoinedTeam = (
  acceptedMembership: AcceptTeamInviteMutation["accept_team_invite"][number],
) => {
  const priorMemberships = acceptedMembership.user.memberships;
  const joinedTeamPresent = priorMemberships.some(
    (membership) => membership.team.id === acceptedMembership.team.id,
  );

  return {
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
};

export const POST = async (req: NextRequest) => {
  if (!(await isSameOriginRequest(req))) {
    return errorResponse({
      statusCode: 403,
      code: "cross_origin_request",
      detail: "Team join must be initiated from the developer portal",
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

    // An invite names exactly one address, so the session consuming it has to
    // prove control of that address. State the requirement positively: the
    // earlier form ("refuse when a verified email mismatches") silently waved
    // through every session that had no verified email to compare against —
    // Sign-in-with-World-ID sessions carry no email at all, so any holder of an
    // invite_id could join an arbitrary team from an unrelated wallet account.
    const verifiedEmail = verifiedEmailOf(auth0User);

    if (!verifiedEmail) {
      return errorResponse({
        statusCode: 403,
        code: "invite_requires_verified_email",
        detail:
          "This invite can only be accepted by the email address it was sent to. Sign out, sign in with that email address, then open the invite link again.",
        req,
        team_id: invite.team.id,
      });
    }

    if (normalizeEmail(invite.email) !== normalizeEmail(verifiedEmail)) {
      return errorResponse({
        statusCode: 403,
        code: "invite_email_mismatch",
        detail: "Invite email does not match logged in email.",
        req,
        team_id: invite.team.id,
      });
    }

    inviteData = invite;
  } catch (error) {
    logger.error("Error while fetching invite for join-callback.", {
      error,
      graphqlResponse: (error as { response?: unknown })?.response,
    });
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
    });
  }

  if (!inviteData.team.id) {
    return errorResponse({
      statusCode: 400,
      code: "invalid_invite",
      req,
    });
  }

  let existingUser: PortalUser | null = null;

  try {
    existingUser = await findExistingPortalUser(client, auth0User);
  } catch (error) {
    logger.error("Error while looking up portal user for join-callback.", {
      error,
    });
    return errorResponse({
      statusCode: 500,
      code: "server_error",
      detail: "Failed to join team",
      req,
      team_id: inviteData.team.id,
    });
  }

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const ironcladActivityApi = new IroncladActivityApi();
    const ironCladUserId = crypto.randomUUID();

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

    let nullifier_hash: string | undefined = undefined;

    if (!isEmailUser(auth0User) && !isPasswordUser(auth0User)) {
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
    return errorResponse({
      statusCode: 400,
      code: "invalid_invite",
      req,
      team_id: inviteData.team.id,
    });
  }

  const user = membershipWithJoinedTeam(acceptedMembership);

  const res = NextResponse.json({
    returnTo: urls.teams({ team_id: acceptedMembership.team_id }),
  });

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
