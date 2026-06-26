"use client";

import { useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import {
  getTeamPermission,
  type Permission,
  type TeamPermission,
} from "@/lib/team-permissions";

export type { TeamPermission } from "@/lib/team-permissions";

export const useTeamPermission = (
  teamId: string,
  permission: Permission,
  message?: string,
): TeamPermission => {
  const { user } = useUser() as Auth0SessionUser;

  return useMemo(
    () => getTeamPermission(user, teamId, permission, message),
    [message, permission, teamId, user],
  );
};
