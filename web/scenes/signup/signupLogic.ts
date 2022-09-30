import randomUUID from "crypto-randomuuid";
import { restAPIRequest } from "frontend-api";
import { kea, path, reducers } from "kea";
import { forms } from "kea-forms";
import { authLogic } from "logics/authLogic";
import type { signupLogicType } from "./signupLogicType";
import { ironCladActivityApi } from "common/helpers/ironclad-activity-api";
import { validateEmail } from "utils";

export interface SignupInterface {
  name: string;
  team_name: string;
  email: string;
  password: string;
  is_subscribed?: boolean;
  termsAccepted: boolean;
}

interface SignupResponse {
  token: string;
}

const sendTOSAcceptance = async (ironclad_id: string) => {
  const { isLatestSigned, sendAcceptance } = await ironCladActivityApi({
    signerId: ironclad_id,
  });

  if (isLatestSigned === false && sendAcceptance) {
    await sendAcceptance();
  }
  return true;
};

export const signupLogic = kea<signupLogicType>([
  path(["scenes", "signup", "signupLogic"]),
  reducers({
    signupError: [
      null as null | string,
      {
        submitLoginFailure: (_, { errors }) =>
          errors?.signupRequestError ||
          "Something went wrong. Please try again.",
        submitSignup: () => null,
      },
    ],
  }),
  forms(({ actions }) => ({
    signup: {
      defaults: {
        email: "",
        password: "",
        team_name: "",
        name: "",
        termsAccepted: false,
      } as SignupInterface,
      errors: ({ email, password, team_name, name, termsAccepted }) => ({
        email: !email
          ? "Please enter your email"
          : !validateEmail(email)
          ? "Please enter a valid email"
          : undefined,
        password: !password
          ? "Please enter your password"
          : password.length < 8
          ? "Password must be at least 8 characters"
          : undefined,
        team_name: !team_name ? "Please enter your team name" : undefined,
        name: !name ? "Please enter your name" : undefined,
        termsAccepted: !termsAccepted
          ? "Please accept all terms before continuing"
          : undefined,
      }),
      submit: async ({ termsAccepted, ...restOfPayload }, breakpoint) => {
        try {
          const ironclad_id = randomUUID();
          const payload = { ...restOfPayload, ironclad_id };

          const { token } = await restAPIRequest<SignupResponse>("/signup", {
            method: "POST",
            json: payload,
          });
          await sendTOSAcceptance(ironclad_id);
          actions.resetSignup();
          authLogic.actions.setToken(token);
        } catch (e) {
          const response = await (e as Response).json();
          actions.submitSignupFailure(Error("Request failed."), {
            signupRequestError:
              response.detail || "Something went wrong. Please try again.",
          });
        }

        breakpoint();
      },
    },
  })),
]);
