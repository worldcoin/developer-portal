"use server";

import { getAPIServiceGraphqlClient } from "@/api/helpers/graphql";
import { getSession } from "@auth0/nextjs-auth0";
import { entityIdSchema } from "../schema";
import { getSdk as getAppInsertPermissionsSdk } from "./graphql/server/get-app-insert-permissions.generated";
import { getSdk as getAppMetadataPermissionsSdk } from "./graphql/server/get-app-metadata-update-permissions.generated";
import { getSdk as getAppUpdatePermissionsSdk } from "./graphql/server/get-app-update-permissions.generated";
import { getSdk as getLocalisationsDeletePermissionsSdk } from "./graphql/server/get-localisations-delete-permissions.generated";
import { getSdk as getLocalisationsInsertPermissionsSdk } from "./graphql/server/get-localisations-insert-permissions.generated";
import { getSdk as getLocalisationsUpdatePermissionsSdk } from "./graphql/server/get-localisations-update-permissions.generated";
import { getSdk as getTeamUpdatePermissionsSdk } from "./graphql/server/get-team-update-permissions.generated";
const getIsIdValid = async (id: string) => {
  try {
    await entityIdSchema.validate(id);
    return true;
  } catch {
    return false;
  }
};

export const getIsUserAllowedToInsertApp = async (teamId: string) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getAppInsertPermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToInsertApp({ userId, teamId });

  if (response.team.find((team) => team.id === teamId)?.memberships.length) {
    return true;
  }
  return false;
};

export const getIsUserAllowedToUpdateApp = async (appId: string) => {
  if (!getIsIdValid(appId)) {
    return false;
  }

  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getAppUpdatePermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToModifyApp({ appId, userId });

  if (response.app_by_pk?.team.memberships.length) {
    return true;
  }
  return false;
};

export const getIsUserAllowedToUpdateAppMetadata = async (
  appMetadataId: string,
) => {
  if (!getIsIdValid(appMetadataId)) {
    return false;
  }

  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getAppMetadataPermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToModifyAppMetadata({ appMetadataId, userId });

  if (
    response.app_metadata.length &&
    response.app_metadata[0].app.team.memberships.length
  ) {
    return true;
  }
  return false;
};

export const getIsUserAllowedToInsertLocalisation = async (appId: string) => {
  if (!getIsIdValid(appId)) {
    return false;
  }

  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getLocalisationsInsertPermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToInsertLocalisations({ appId, userId });

  if (response.app_metadata.length) {
    return true;
  }
  return false;
};

export const getIsUserAllowedToUpdateLocalisation = async (
  localisationId: string,
) => {
  if (!getIsIdValid(localisationId)) {
    return false;
  }
  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getLocalisationsUpdatePermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToModifyLocalisations({ localisationId, userId });

  if (response.app_metadata.length) {
    return true;
  }
  return false;
};

export const getIsUserAllowedToDeleteLocalisation = async (
  appMetadataId: string,
  locale: string,
) => {
  if (!getIsIdValid(appMetadataId)) {
    return false;
  }

  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getLocalisationsDeletePermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToDeleteLocalisations({
    appMetadataId,
    locale,
    userId,
  });

  if (response.app_metadata.length) {
    return true;
  }
  return false;
};

export const getIsUserAllowedToUpdateTeam = async (teamId: string) => {
  if (!getIsIdValid(teamId)) {
    return false;
  }

  const session = await getSession();
  if (!session) {
    return false;
  }

  const userId = session.user.hasura.id;
  const response = await getTeamUpdatePermissionsSdk(
    await getAPIServiceGraphqlClient(),
  ).GetIsUserPermittedToModifyTeam({ teamId, userId });

  if (response.team.length === 1 && response.team[0].id === teamId) {
    return true;
  }
  return false;
};
