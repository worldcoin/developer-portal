import { restAPIRequest } from "frontend-api";
import { actions, kea, path, reducers, selectors } from "kea";
import { forms } from "kea-forms";
import { EnvironmentType } from "types";
import { ENVIRONMENTS } from "utils";

import type { debuggerLogicType } from "./debuggerLogicType";
import { MaybeValidProofResponse, ValidProofResponse } from "./publicLogic";

interface DebuggerFormInterface {
  action_id: string;
  signal: string;
  advanced_use_raw_action_id: boolean;
  advanced_use_raw_signal: boolean;
  environment: "staging" | "production";
  verificationResponse: string; // entire object is stringified so the user can just paste the entire response
}

const validateVerificationResponse = (value: string | null) => {
  if (!value) {
    return "Please paste the verification response from the JS widget.";
  }
  try {
    const jsonObj = JSON.parse(value);
    if (!jsonObj || typeof jsonObj !== "object" || !jsonObj["proof"]) {
      return "Please paste a valid verification response as received from the JS widget.";
    }
    return undefined;
  } catch (e) {
    return "Please paste a valid JSON.";
  }
};

export const debuggerLogic = kea<debuggerLogicType>([
  path(["logics", "debuggerLogic"]),
  actions({
    setVerificationResult: (result: MaybeValidProofResponse) => ({ result }),
  }),
  reducers({
    verificationResult: [
      null as MaybeValidProofResponse | null,
      {
        setVerificationResult: (_, { result }) => result,
      },
    ],
  }),
  forms(({ actions }) => ({
    debuggerForm: {
      defaults: {
        action_id: "",
        signal: "",
        advanced_use_raw_action_id: false,
        advanced_use_raw_signal: false,
        environment: "production",
      } as DebuggerFormInterface,
      errors: ({ action_id, signal, verificationResponse }) => ({
        action_id: !action_id
          ? "Please enter a name for your action"
          : undefined,
        signal: !signal
          ? "Please select an engine before continuing"
          : undefined,
        verificationResponse:
          validateVerificationResponse(verificationResponse),
      }),
      submit: async ({ verificationResponse, ...payload }, breakpoint) => {
        breakpoint();

        const parsedResponse = JSON.parse(verificationResponse);

        try {
          await restAPIRequest<MaybeValidProofResponse>("/debugger", {
            method: "POST",
            customErrorHandling: true,
            json: {
              ...payload,
              proof: parsedResponse.proof,
              merkle_root: parsedResponse.merkle_root,
              nullifier_hash: parsedResponse.nullifier_hash,
            },
          });
          actions.setVerificationResult({ success: true });
        } catch (e) {
          if (typeof e === "object") {
            const errorRes = e as Record<string, string>;
            actions.setVerificationResult({
              success: false,
              code: errorRes.code,
              detail: errorRes.detail,
            });
          } else {
            actions.setVerificationResult({
              success: false,
              code: "invalid",
              detail: "Something went wrong. Check the console.",
            });
          }
        }

        return { ...payload, verificationResponse };
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
