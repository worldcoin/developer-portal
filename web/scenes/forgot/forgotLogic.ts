import { restAPIRequest } from "frontend-api";
import { kea, path } from "kea";
import { forms } from "kea-forms";
import { validateEmail } from "utils";

import type { forgotLogicType } from "./forgotLogicType";

export interface ForgotInterface {
  email: string;
}

export const forgotLogic = kea<forgotLogicType>([
  path(["scenes", "forgot", "forgotLogic"]),
  forms(({ actions, values }) => ({
    forgot: {
      defaults: {
        email: "",
      } as ForgotInterface,
      errors: ({ email }) => ({
        email: !email
          ? "Please enter your email"
          : !validateEmail(email)
          ? "Please enter a valid email"
          : undefined,
      }),
      submit: async (payload) => {
        const res = await restAPIRequest<{}>("/forgot", {
          method: "POST",
          json: payload,
        });
      },
    },
  })),
]);
