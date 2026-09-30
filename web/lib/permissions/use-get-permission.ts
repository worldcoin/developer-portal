"use client";

import { useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Auth0SessionUser } from "@/lib/types";
import {
  getPermission,
  type PermissionResult,
} from "@/lib/permissions/get-permission";
import { type Permission } from "@/lib/permissions/policy";

export type { PermissionResult } from "@/lib/permissions/get-permission";

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
