import { kea, path } from "kea";
import { forms } from "kea-forms";

import type { passwordUpdateLogicType } from "./passwordUpdateLogicType";

export interface PasswordUpdateInterface {
  current_password: string;
  new_password: string;
  new_password_repeat: string;
}

export const passwordUpdateLogic = kea<passwordUpdateLogicType>([
  path(["scenes", "passwordUpdate", "passwordUpdateLogic"]),
  forms(({ actions, values }) => ({
    passwordUpdate: {
      defaults: {
        current_password: "",
        new_password: "",
        new_password_repeat: "",
      } as PasswordUpdateInterface,
      errors: ({
        current_password,
        new_password,
        new_password_repeat,
      }: PasswordUpdateInterface) => ({
        current_password: !current_password
          ? "Please enter your current password"
          : undefined,
        new_password: !new_password ? "Please enter new password" : undefined,
        new_password_repeat:
          new_password !== new_password_repeat
            ? "Passwords do not match"
            : undefined,
      }),
      submit: async (payload) => {
        if (values.passwordUpdateHasErrors) {
          actions.setPasswordUpdateValue("showPasswordUpdateErrors", true);
        } else {
          actions.resetPasswordUpdate(payload);
        }
      },
    },
  })),
]);
