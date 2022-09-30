import {
  actions,
  afterMount,
  connect,
  kea,
  listeners,
  path,
  props,
  propsChanged,
  reducers,
} from "kea";
import { publicLogic } from "logics/publicLogic";
import type { kioskLogicType } from "./kioskLogicType";

export interface KioskLogicProps {
  action_id?: string;
}

export const kioskLogic = kea<kioskLogicType>([
  props({} as KioskLogicProps),
  path(["scenes", "kiosk", "kioskLogic"]),
  connect({
    values: [publicLogic, ["action", "actionLoading", "verifiedProof"]],
    actions: [
      publicLogic,
      ["loadAction", "verifyProof", "verifyProofSuccess", "verifyProofFailure"],
    ],
  }),
  actions({
    setSignal: (signal?: string) => ({ signal }),
    // FIXME: `screen` should be properly typed (e.g. enum)
    setScreen: (screen: string) => ({ screen }),
  }),
  reducers({
    signal: [
      undefined as string | undefined,
      {
        setSignal: (_, { signal }) => signal,
      },
    ],
    screen: [
      "intro",
      {
        setScreen: (_, { screen }) => screen,
      },
    ],
  }),
  listeners(({ actions }) => ({
    verifyProofSuccess: async ({ verifiedProof }) => {
      if (verifiedProof.success) {
        actions.setScreen("success");
      } else {
        // FIXME: Properly type error codes
        if (verifiedProof.error_code === "already_verified") {
          actions.setScreen("alreadyVerified");
        } else if (verifiedProof.error_code === "invalid_merkle_root") {
          actions.setScreen("invalidIdentity");
        } else {
          actions.setScreen("verificationError");
        }
      }
    },
  })),
  propsChanged(({ actions, values, props }) => {
    if (props.action_id && !values.action && !values.actionLoading) {
      actions.loadAction({ action_id: props.action_id });
    }
  }),
  afterMount(({ actions, props }) => {
    if (props.action_id) {
      actions.loadAction({ action_id: props.action_id });
    }
  }),
]);
