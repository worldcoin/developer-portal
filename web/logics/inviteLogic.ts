import { isSSR } from "common/helpers/is-ssr";
import { restAPIRequest } from "frontend-api";
import { actions, afterMount, kea, listeners, path, reducers } from "kea";
import Router from "next/router";
import type { inviteLogicType } from "./inviteLogicType";

type InviteType = {
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
  }),
  reducers({
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
        setInvite: () => false,
        setExpired: () => false,
      },
    ],
    expired: [
      false,
      {
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

      const response = await restAPIRequest<{
        status?: string;
        invite?: InviteType;
      }>("/invite", {
        method: "POST",
        json: { jwt },
      });

      if (response.status === "expired") {
        actions.setExpired(true);
      }

      if (response.invite) {
        actions.setInvite(response.invite);
      }
    },
  })),
  afterMount(({ actions }) => {
    actions.loadInvite();
  }),
]);
