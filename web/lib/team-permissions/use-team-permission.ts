"use client";

import { useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import {
  getTeamPermission,
  type PermissionAction,
  type TeamPermission,
} from "@/lib/team-permissions";

export type { TeamPermission } from "@/lib/team-permissions";

export const useTeamPermission = (
  teamId: string,
  action: PermissionAction,
): TeamPermission => {
  const { user } = useUser() as Auth0SessionUser;

  return useMemo(
    () => getTeamPermission(user, teamId, action),
    [action, teamId, user],
  );
};
