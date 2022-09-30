import { kea, path, selectors } from "kea";
import { forms } from "kea-forms";
import { EnvironmentType } from "types";
import { ENVIRONMENTS } from "utils";

import type { debuggerLogicType } from "./debuggerLogicType";

interface DebuggerFormInterface {
  action_id: string;
  signal: string;
  advanced_use_raw_action_id: boolean;
  advanced_use_raw_signal: boolean;
  environment: "staging" | "production";
}

export const debuggerLogic = kea<debuggerLogicType>([
  path(["logics", "debuggerLogic"]),
  forms(({ actions, values }) => ({
    debuggerForm: {
      defaults: {
        action_id: "",
        signal: "",
        advanced_use_raw_action_id: false,
        advanced_use_raw_signal: false,
        environment: "production",
      } as DebuggerFormInterface,
      errors: ({ action_id, signal }) => ({
        action_id: !action_id
          ? "Please enter a name for your action"
          : undefined,
        signal: !signal
          ? "Please select an engine before continuing"
          : undefined,
      }),
      submit: async (payload, breakpoint) => {
        breakpoint();

        console.log(payload);
        return payload;
      },
    },
  })),
  selectors(() => ({
    environments: [
      (s) => [s.debuggerForm],
      (debuggerForm): EnvironmentType[] => {
        const environment = ENVIRONMENTS.find(
          ({ value }) => value === debuggerForm.environment
        );

        if (environment) {
          return [
            environment,
            ...ENVIRONMENTS.filter(
              ({ value }) => value !== debuggerForm.environment
            ),
          ];
        }
        return ENVIRONMENTS;
      },
    ],
  })),
]);
