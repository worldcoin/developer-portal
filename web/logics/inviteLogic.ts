import { actions, connect, kea, path } from "kea";
import { forms } from "kea-forms";
import type { inviteLogicType } from "./inviteLogicType";
import { teamLogic } from "./teamLogic";
import { authLogic } from "./authLogic";
import { graphQLRequest, restAPIRequest } from "frontend-api";
import { gql } from "@apollo/client";
import { toast } from "react-toastify";
import { Invite } from "email/Invite";

type InviteFormValues = {
  emails: Array<string>;
};

const InsertInviteQuery = gql`
  mutation InsertInvite($objects: [invite_insert_input!]!) {
    insert_invite(objects: $objects) {
      returning {
        id
        email
      }
    }
  }
`;

type InsertInviteQueryResponse = {
  insert_invite: {
    returning: Array<{
      id: string;
      email: string;
    }>;
  };
};

export const inviteLogic = kea<inviteLogicType>([
  path(["logics", "inviteLogic"]),
  connect({
    values: [authLogic, ["token"]],
  }),
  forms(({ values }) => ({
    invite: {
      defaults: { emails: [] } as InviteFormValues,
      errors: (values: { emails: Array<string> }) => ({
        emails:
          values.emails.length <= 0 ||
          values.emails.filter(
            (email: string) => !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)
          ).length
            ? "You must enter at least one email"
            : null,
      }),
      submit: async (payload, breakpoint) => {
        if (!values.token || !payload.emails.length) {
          return null;
        }

        breakpoint();

        try {
          const result = await restAPIRequest<{ status: string }>("/invite", {
            method: "POST",
            json: payload,
            customErrorHandling: true,
            headers: {
              authorization: `Bearer ${values.token}`,
            },
          });

          if (result.status === "ok") {
            toast.success(`Successfully sending invites`);
          }
        } catch (err) {
          console.log("test", err);
        }
      },
    },
  })),
]);
