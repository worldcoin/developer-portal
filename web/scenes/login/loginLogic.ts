import { restAPIRequest } from "frontend-api";
import { actions, kea, path, reducers } from "kea";
import { forms } from "kea-forms";
import type { loginLogicType } from "./loginLogicType";
import Router from "next/router";
import { authLogic } from "logics/authLogic";
import { validateEmail } from "utils";

export interface LoginInterface {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
}

export const loginLogic = kea<loginLogicType>([
  path(["scenes", "login", "loginLogic"]),
  reducers({
    loginError: [
      null as null | string,
      {
        submitLoginFailure: (_, { errors }) =>
          errors?.loginRequestError ||
          "Something went wrong. Please try again.",
        submitLogin: () => null,
      },
    ],
  }),
  forms(({ actions }) => ({
    login: {
      defaults: { email: "", password: "" } as LoginInterface,
      errors: ({ email, password }: LoginInterface) => ({
        email: !email
          ? "Please enter your email"
          : !validateEmail(email)
          ? "Please enter a valid email"
          : undefined,
        password: !password ? "Please enter your password" : undefined,
      }),
      submit: async (payload, breakpoint) => {
        try {
          const { token } = await restAPIRequest<LoginResponse>("/login", {
            method: "POST",
            json: payload,
          });
          actions.resetLogin();
          authLogic.actions.setToken(token);
        } catch (e) {
          const response = await (e as Response).json();
          actions.submitLoginFailure(Error("Request failed."), {
            loginRequestError:
              response.detail || "Something went wrong. Please try again.",
          });
        }

        breakpoint();
      },
    },
  })),
]);
