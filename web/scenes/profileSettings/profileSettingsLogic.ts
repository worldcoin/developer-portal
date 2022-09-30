import { actions, kea, path, reducers } from "kea";
import { forms } from "kea-forms";
import type { profileSettingsLogicType } from "./profileSettingsLogicType";

export interface ProfileSettingsInterface {
  name: string;
  team_name: string;
}

export const profileSettingsLogic = kea<profileSettingsLogicType>([
  path(["scenes", "profileSettings", "profileSettingsLogic"]),
  forms(({ actions, values }) => ({
    profileSettings: {
      defaults: {
        name: "No name",
        team_name: "the Team",
      } as ProfileSettingsInterface,
      errors: ({ name, team_name }) => ({
        name: !name ? "Please enter a valid name" : undefined,
        team_name: !team_name ? "Please enter a vailid team name" : undefined,
      }),
      submit: async (payload) => {
        if (values.profileSettingsHasErrors) {
          actions.setProfileSettingsValue("showProfileSettingsErrors", true);
        } else {
          actions.resetProfileSettings(payload);
        }
      },
    },
  })),
]);
