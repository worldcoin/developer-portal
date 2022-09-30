import {
  actions,
  afterMount,
  connect,
  kea,
  listeners,
  path,
  props,
  reducers,
  selectors,
} from "kea";
import { loaders } from "kea-loaders";
import { publicLogic } from "logics/publicLogic";
import {
  ErrorCodes,
  VerificationErrorResponse,
  VerificationResponse,
} from "@worldcoin/id";

import type { hostedPageLogicType } from "./hostedPageLogicType";

const TERMINAL_ERRORS = [
  ErrorCodes.AlreadySigned,
  ErrorCodes.InvalidActionID,
  ErrorCodes.InvalidSignal,
];

export interface HostedPageLogicProps {
  signal?: string;
  action_id?: string;
}

export const hostedPageLogic = kea<hostedPageLogicType>([
  props({} as HostedPageLogicProps),
  path(["scenes", "hosted", "hostedPageLogic"]),
  actions({
    setSignal: (signal?: string) => ({ signal }),
    setTerminalError: (error: string) => ({ error }),
  }),
  reducers({
    signal: [
      undefined as string | undefined,
      {
        setSignal: (_, { signal }) => signal,
      },
    ],
    terminalError: [
      null as string | null,
      {
        setTerminalError: (_, { error }) => error,
      },
    ],
  }),
  connect({
    values: [publicLogic, ["action", "actionLoading", "verifiedProof"]],
    actions: [publicLogic, ["loadAction", "verifyProof"]],
  }),
  loaders(({ actions, props }) => ({
    success: [
      null,
      {
        handleSuccess: async (
          verificationResponse: VerificationResponse,
          breakpoint
        ) => {
          if (!props.action_id || !props.signal) {
            throw "`handleSuccess` improperly called as `signal` and/or `action_id` are not set.";
          }
          breakpoint();

          try {
            actions.verifyProof({
              verificationResponse,
              action_id: props.action_id,
              signal: props.signal,
            });
          } catch (error) {
            const errorResponse = error as VerificationErrorResponse;
            if (
              errorResponse?.code &&
              TERMINAL_ERRORS.includes(errorResponse.code)
            ) {
              actions.setTerminalError(errorResponse.code);
              console.info(
                "Verification failed in a terminal (unrecoverable) error.",
                error
              );
            } else {
              console.warn("Verification failed. Trying again.", error);
            }
          }

          return null;
        },
      },
    ],
    error: [
      null,
      {
        handleError: async (
          verificationError: VerificationErrorResponse,
          breakpoint
        ) => {
          breakpoint();
          actions.setTerminalError(verificationError.code);

          console.error(
            "Verification failed in a terminal (unrecoverable) error.",
            verificationError
          );

          return null;
        },
      },
    ],
  })),
  selectors(({ props }) => ({
    returnUrlDomain: [
      (s) => [s.action],
      (action): string | null =>
        action && action.return_url
          ? new URL(action.return_url).hostname
          : null,
    ],
    pageError: [
      (s) => [s.action, s.actionLoading, s.terminalError, s.verifiedProof],
      (action, actionLoading, terminalError, verifiedProof): string | null => {
        if (terminalError) {
          return "This verification request will not be able to be completed.";
        }

        // Proof verification errors
        if (verifiedProof && !verifiedProof.success) {
          if (verifiedProof.error_code === "invalid_merkle_root") {
            return "Your identity appears to be unverified. Have you gone to an orb?";
          } else if (verifiedProof.error_code === "invalid_proof") {
            return "The verification received from the Worldcoin app seems invalid. Please refresh this page to try again.";
          } else if (verifiedProof.error_code === "already_verified") {
            return "Looks like you have already verified for this action. You can only verify once per action.";
          }
          return "We couldn't verify the proof received from the Worldcoin app. Please refresh this page to try again.";
        }

        // Parameter errors
        if (!props.action_id) {
          return "This link looks invalid. Please check it and try again (Action ID is missing).";
        }
        if (!props.signal) {
          return "This link looks invalid. Please check it and try again (signal parameter is missing).";
        }

        // Invalid action errors
        if (action) {
          if (!action.return_url) {
            // FIXME add a direct link to Deployment section
            return "This action is not configured for this hosted page. If you're the owner head over to the Deployment section of this action.";
          }
          // Action not found
        } else {
          if (!actionLoading) {
            return "This action does not exist or is inactive. Please check your link and try again.";
          }
        }
        return null;
      },
    ],
  })),
  afterMount(({ actions, props }) => {
    if (props.action_id) {
      actions.loadAction({ action_id: props.action_id });
    }
  }),
]);
