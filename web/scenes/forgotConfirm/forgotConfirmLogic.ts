import { restAPIRequest } from "frontend-api";
import { kea, path, props, key } from "kea";
import { forms } from "kea-forms";

import type { forgotConfirmLogicType } from "./forgotConfirmLogicType";

export interface ForgotConfirmPropsInterface {
  token: string;
}

export interface ForgotConfirmInterface {
  password: string;
}

export const forgotConfirmLogic = kea<forgotConfirmLogicType>([
  path(["scenes", "forgotConfirm", "forgotConfirmLogic"]),
  props({} as ForgotConfirmPropsInterface),
  forms(({ actions, values }) => ({
    forgotConfirm: {
      defaults: {
        password: "",
      } as ForgotConfirmInterface,
      errors: ({ password }) => ({
        password: !password
          ? "Please enter your password"
          : password.length < 8
          ? "Password must be at least 8 characters"
          : undefined,
      }),
      submit: async (payload) => {
        const res = await restAPIRequest<{}>("/forgot-confirm", {
          method: "POST",
          json: payload,
        });
      },
    },
  })),
]);
