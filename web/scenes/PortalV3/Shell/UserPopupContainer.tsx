"use client";

import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { UserPopup } from "./UserPopup";

/**
 * Data wrapper for UserPopup — pulls the logged-in user from the Auth0 client
 * session. Kept thin and out of unit tests (UserPopup is tested with props).
 */
export const UserPopupContainer = () => {
  const { user } = useUser() as Auth0SessionUser;

  if (!user) return null;

  return (
    <UserPopup
      user={{ name: user.name ?? user.email ?? "Account", email: user.email }}
    />
  );
};
