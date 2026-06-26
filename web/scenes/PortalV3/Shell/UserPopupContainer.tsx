"use client";

import { Theme } from "@/lib/portal-v3/theme";
import { Auth0SessionUser } from "@/lib/types";
import { useUser } from "@auth0/nextjs-auth0/client";
import { UserPopup } from "./UserPopup";

/**
 * Data wrapper for UserPopup — pulls the logged-in user from the Auth0 client
 * session. Kept thin and out of unit tests (UserPopup is tested with props).
 */
export const UserPopupContainer = (props: { theme: Theme }) => {
  const { user } = useUser() as Auth0SessionUser;

  if (!user) return null;

  return (
    <UserPopup
      user={{ name: user.name ?? user.email ?? "Account", email: user.email }}
      theme={props.theme}
    />
  );
};
