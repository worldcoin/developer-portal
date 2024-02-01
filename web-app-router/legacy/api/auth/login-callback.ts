import {
  getSession,
  updateSession,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";

import { NextApiRequest, NextApiResponse } from "next";

import {
  FetchNullifierUserQuery,
  getSdk as FetchUserByNullifierSdk,
} from "./graphql/fetch-nullifier-user.generated";

import {
  FetchEmailUserQuery,
  getSdk as FetchUserByAuth0IdSdk,
} from "./graphql/fetch-email-user.generated";

import {
  getSdk as FetchInviteSdk,
  InviteQuery,
} from "./graphql/fetch-invite.generated";

import {
  getSdk as InsertMembershipSdk,
  InsertMembershipMutation,
} from "./graphql/insert-membership.generated";

import {
  getSdk as DeleteInviteSdk,
  DeleteInviteMutation,
} from "./graphql/delete-invite.generated";

import { getAPIServiceGraphqlClient } from "@/legacy/backend/graphql";
import { urls } from "@/legacy/lib/urls";
import { Auth0User, LoginErrorCode } from "@/lib/types";
import { getSdk as updateUserSdk } from "./graphql/update-user.generated";
import { isEmailUser } from "@/legacy/lib/utils";
import { logger } from "@/lib/logger";
import { Role_Enum } from "@/graphql/graphql";

export const auth0Login = withApiAuthRequired(
  async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession(req, res);

    if (!session) {
      logger.warn("No session found in auth0Login callback.");

      return res.redirect(
        307,
        urls.logout({ login_error: LoginErrorCode.Generic }),
      );
    }

    const client = await getAPIServiceGraphqlClient();
    const auth0User = session.user as Auth0User;

    let user:
      | FetchEmailUserQuery["userByAuth0Id"][number]
      | FetchEmailUserQuery["userByEmail"][number]
      | FetchNullifierUserQuery["user"][number]
      | null
      | undefined = null;

    // ANCHOR: User is authenticated through Sign in with World ID
    if (!isEmailUser(auth0User)) {
      const nullifier = auth0User.sub.split("|")[2];

      try {
        const userData = await FetchUserByNullifierSdk(
          client,
        ).FetchNullifierUser({
          world_id_nullifier: nullifier,
          auth0Id: auth0User.sub,
        });

        if (!userData) {
          throw new Error(
            "Error while fetching user for FetchUserByNullifierSdk.",
          );
        }

        if (userData.user.length === 1) {
          user = userData.user[0];
        } else if (userData.user.length > 1) {
          // NOTE: Edge case may occur if there's a migration error from legacy users, this will require manual handling.
          throw new Error(
            `Auth migration error, more than one user found for nullifier_hash: ${nullifier} & auth0Id: ${auth0User.sub}`,
          );
        }
      } catch (error) {
        logger.error(`Error while fetching user for FetchUserByNullifierSdk.`, {
          error,
        });

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }
    }

    // ANCHOR: User is authenticated through email OTP
    else if (isEmailUser(auth0User)) {
      // NOTE: All users from Auth0 should have verified emails as we only use email OTP for authentication, but this is a sanity check
      if (!auth0User.email_verified) {
        logger.error(
          `Received Auth0 authentication request from an unverified email: ${auth0User.sub}`,
        );

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.EmailNotVerified }),
        );
      }

      try {
        const userData = await FetchUserByAuth0IdSdk(client).FetchEmailUser({
          auth0Id: auth0User.sub,
          email: auth0User.email,
        });

        if (userData.userByAuth0Id.length > 0) {
          user = userData.userByAuth0Id[0];
        }

        if (
          userData.userByAuth0Id.length === 0 &&
          userData.userByEmail.length > 0
        ) {
          user = userData.userByEmail[0];
        }
      } catch (error) {
        logger.error("Error while fetching user for FetchUserByAuth0IdSdk.", {
          error,
        });

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }
    }

    const invite_id = req.query.invite_id as string;

    if (!user) {
      return res.redirect(
        307,
        invite_id ? urls.signup({ invite_id }) : urls.signup(),
      );
    }
    let invite: InviteQuery["invite"][number] | null = null;

    if (invite_id) {
      try {
        const fetchInviteResult = await FetchInviteSdk(client).Invite({
          id: invite_id,
        });

        if (!fetchInviteResult) {
          throw new Error(`Error while fetching invite: ${invite_id}`);
        }

        if (fetchInviteResult.invite.length > 0) {
          invite = fetchInviteResult.invite[0];
        }
      } catch (error) {
        logger.error("Error while fetching invite for FetchInviteSdk.", {
          error,
        });

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }

      if (
        !invite ||
        !invite.team_id ||
        new Date(invite.expires_at) <= new Date()
      ) {
        logger.error("Invite not found or team_id is missing.");

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }

      if (invite.email !== auth0User.email) {
        logger.error("Invite email does not match logged in email");
        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }

      let membership: InsertMembershipMutation["insert_membership_one"] | null =
        null;

      try {
        const insertMembershipResult = await InsertMembershipSdk(
          client,
        ).InsertMembership({
          team_id: invite.team_id,
          user_id: user.id,
          role: Role_Enum.Member,
        });

        membership = insertMembershipResult.insert_membership_one;
      } catch (error) {
        logger.error(
          "Error while inserting membership for InsertMembershipSdk.",
          {
            error,
          },
        );

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }

      if (!membership) {
        logger.error("Membership not found after inserting.");

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }

      try {
        const deleteInviteResult = await DeleteInviteSdk(client).DeleteInvite({
          invite_id,
        });

        if (!deleteInviteResult.delete_invite_by_pk) {
          logger.error(
            `Error while deleting invite: ${invite_id}, invite not found.`,
          );
        }
      } catch (error) {
        logger.error("Error while deleting invite for DeleteInviteSdk.", {
          error,
        });
      }
    }

    // ANCHOR: Sync relevant attributes from Auth0 (also sets the user's Auth0Id if not set before)
    const shouldUpdateUserName =
      auth0User.name && user?.name !== auth0User.name;

    const shouldUpdateUserEmail =
      auth0User.email && user?.email !== auth0User.email;

    const shouldUpdateAuth0UserId = user?.auth0Id !== auth0User.sub;

    const shouldUpdateUserData =
      shouldUpdateUserName || shouldUpdateUserEmail || shouldUpdateAuth0UserId;

    if (user && shouldUpdateUserData) {
      try {
        const userData = await updateUserSdk(client).UpdateUser({
          id: user.id,
          _set: {
            ...(shouldUpdateAuth0UserId ? { auth0Id: auth0User.sub } : {}),
            ...(shouldUpdateUserName ? { name: auth0User.name } : {}),
            ...(shouldUpdateUserEmail ? { email: auth0User.email } : {}),
          },
        });

        if (!userData) {
          throw new Error(`Error while updating user: ${user.id}`);
        }

        user = userData?.update_user_by_pk;
      } catch (error) {
        logger.error("Error while updating user for UpdateUserSdk.", {
          error,
        });

        return res.redirect(
          307,
          urls.logout({ login_error: LoginErrorCode.Generic }),
        );
      }
    }

    // NOTE: User's internal ID & team_id are used to query Hasura in subsequent requests
    await updateSession(req, res, {
      ...session,
      user: {
        ...session.user,
        hasura: {
          ...user,
        },
      },
    });

    // NOTE: We redirecting user here because user can have one team only for now
    return res.redirect(
      307,
      urls.app({
        team_id: invite ? invite.team_id : user?.memberships[0].team.id ?? "",
      }),
    );
  },
);
