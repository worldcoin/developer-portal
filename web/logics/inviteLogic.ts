import { isSSR } from "common/helpers/is-ssr";
import { restAPIRequest } from "frontend-api";
import { actions, afterMount, kea, listeners, path, reducers } from "kea";
import Router from "next/router";
import type { inviteLogicType } from "./inviteLogicType";

export type InviteType = {
  id: string;
  email: string | null;
  expires_at: Date;
  team: {
    id: string;
    name: string;
  };
};

export const inviteLogic = kea<inviteLogicType>([
  path(["logics", "inviteLogic"]),
  actions({
    loadInvite: true,
    setInvite: (invite) => ({ invite }),
    setExpired: (expired) => ({ expired }),
    setError: (error) => ({ error }),
  }),
  reducers({
    error: [
      null as null | string,
      {
        loadInvite: () => null,
        setError: (_, { error }) => error,
      },
    ],
    invite: [
      null as null | InviteType,
      {
        setInvite: (_, { invite }) => invite,
      },
    ],
    loading: [
      true,
      {
        loadInvite: () => true,
        setError: () => false,
        setInvite: () => false,
        setExpired: () => false,
      },
    ],
    expired: [
      false,
      {
        loadInvite: () => false,
        setExpired: (_, { expired }) => expired,
      },
    ],
  }),
  listeners(({ actions }) => ({
    loadInvite: async () => {
      if (isSSR()) {
        return actions.setInvite(null);
      }

      const jwt = Router.query["jwt"] as string;

      if (!jwt) {
        return actions.setInvite(null);
      }

      try {
        const response = await restAPIRequest<{
          code?: string;
          detail?: string;
          status?: string;
          invite?: InviteType;
        }>("/invite", {
          method: "POST",
          json: { jwt },
        });

        return actions.setInvite(response.invite);
      } catch (err) {
        if (typeof err === "object") {
          const errorRes = err as Record<string, string>;
          if (errorRes.code === "invalid_jwt") {
            return actions.setError(errorRes.detail);
          }

          if (errorRes.code === "expired") {
            return actions.setExpired(true);
          }
        }

        actions.setError("Unexpected error");
      }
    },
  })),
  afterMount(({ actions }) => {
    actions.loadInvite();
  }),
]);
