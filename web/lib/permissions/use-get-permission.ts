"use client";

import { useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import {
  getPermission,
  type Permission,
  type PermissionResult,
} from "@/lib/permissions/policy";

export type { PermissionResult } from "@/lib/permissions/policy";

export const useGetPermission = (
  teamId: string,
  permission: Permission,
  message?: string,
): PermissionResult => {
  const { user } = useUser() as Auth0SessionUser;

  return useMemo(
    () => getPermission(user, teamId, permission, message),
    [message, permission, teamId, user],
  );
};
