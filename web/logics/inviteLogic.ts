import { isSSR } from "common/helpers/is-ssr";
import { restAPIRequest } from "frontend-api";
import {
  actions,
  afterMount,
  connect,
  kea,
  listeners,
  path,
  reducers,
} from "kea";
import { forms } from "kea-forms";
import Router from "next/router";
import { toast } from "react-toastify";
import { authLogic } from "./authLogic";
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

export type InviteFormValues = {
  emails: Array<string>;
};

export const inviteLogic = kea<inviteLogicType>([
  path(["logics", "inviteLogic"]),
  connect({
    values: [authLogic, ["token"]],
  }),
  actions({
    loadInvite: true,
    setInvite: (invite) => ({ invite }),
    setExpired: (expired) => ({ expired }),
    setError: (error) => ({ error }),
    setLink: (link) => ({ link }),
    copyLink: true,
    setIsLinkCopied: true,
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
    isLinkCopied: [
      false,
      {
        copyLink: () => true,
        setIsLinkCopied: () => false,
      },
    ],
  }),
  listeners(({ actions, values }) => ({
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
    copyLink: async () => {
      if (isSSR()) {
        return undefined;
      }

      try {
        const response = await restAPIRequest<{ link: string }>(
          "/invite/get-link",
          {
            method: "POST",
            customErrorHandling: true,
            headers: {
              authorization: `Bearer ${values.token}`,
            },
          }
        );
        await navigator.clipboard.writeText(response.link);
        toast.success("Success copy link");
      } catch (err) {
        toast.error("Error with copy link");
      }

      setTimeout(actions.setIsLinkCopied, 3500);
    },
  })),
  // @ts-ignore FIXME bug with kea-typegen
  forms(({ actions, values }) => ({
    newInvite: {
      defaults: { emails: [] } as InviteFormValues,
      errors: (
        values: InviteFormValues
      ): Record<string, string | undefined> => ({
        emails:
          values.emails.length <= 0 ||
          values.emails.filter(
            (email: string) => !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
          ).length
            ? "You must enter at least one email"
            : undefined,
      }),
      submit: async (payload, breakpoint) => {
        if (!values.token || !payload.emails.length) {
          return null;
        }

        breakpoint();

        try {
          const result = await restAPIRequest<{ status: string }>(
            "/invite/send",
            {
              method: "POST",
              json: payload,
              customErrorHandling: true,
              headers: {
                authorization: `Bearer ${values.token}`,
              },
            }
          );

          if (result.status === "ok") {
            toast.success(`Successfully sending invites`);
            actions.resetNewInvite();
          }
        } catch (err) {
          toast.error("Something went wrong");
          console.log(err);
        }
      },
    },
  })),
  afterMount(({ actions }) => {
    actions.loadInvite();
  }),
]);
