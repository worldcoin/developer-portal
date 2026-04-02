import { LegacyVerificationLevel } from "@/lib/idkit";
import { generateRpIdString } from "@/lib/rp";
import { KioskScreen } from "@/lib/types";
import {
  IDKitErrorCodes,
  deviceLegacy,
  documentLegacy,
  orbLegacy,
  secureDocumentLegacy,
  selfieCheckLegacy,
  useIDKitRequest,
  type IDKitResult,
  type Preset,
  type RpContext,
} from "@worldcoin/idkit";
import { hashSignal } from "@worldcoin/idkit/hashing";
import { useEffect, useMemo, useReducer } from "react";

const POLLING_INTERVAL_MS = 3000;
const POLLING_TIMEOUT_MS = 300000;
const RP_CONTEXT_TTL_SECONDS = 300;
const MOCK_RP_SIGNATURE = `0x${"00".repeat(64)}1b` as const;

type UseLegacyKioskRequestOptions = {
  appId: `app_${string}`;
  action: string;
  actionDescription: string;
  verificationLevel: LegacyVerificationLevel;
  enabled?: boolean;
};

export type KioskProofResponse = {
  success?: boolean;
  action_id?: string;
  nullifier_hash?: string;
  created_at?: string;
  code?: string;
  detail?: string;
  attribute?: string | null;
};

type LegacyVerifyPayload = {
  action: string;
  signal_hash: string;
  proof: string;
  nullifier_hash: string;
  merkle_root: string;
  verification_level: LegacyVerificationLevel;
};

function createNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  // hashSignal is hashToFieldElement under the hood, we can reuse it to hash the nonce
  return hashSignal(bytes);
}

function buildMockRpContext(appId: `app_${string}`): RpContext {
  const now = Math.floor(Date.now() / 1000);

  return {
    rp_id: generateRpIdString(appId),
    nonce: createNonce(),
    created_at: now,
    expires_at: now + RP_CONTEXT_TTL_SECONDS,
    signature: MOCK_RP_SIGNATURE,
  };
}

function getLegacyPreset(verificationLevel: LegacyVerificationLevel): Preset {
  switch (verificationLevel) {
    case LegacyVerificationLevel.Orb:
      return orbLegacy();
    case LegacyVerificationLevel.Document:
      return documentLegacy();
    case LegacyVerificationLevel.SecureDocument:
      return secureDocumentLegacy();
    case LegacyVerificationLevel.Face:
      return selfieCheckLegacy();
    case LegacyVerificationLevel.Device:
    default:
      return deviceLegacy();
  }
}

function getKioskEnvironment(appId: `app_${string}`): "production" | "staging" {
  return appId.startsWith("app_staging_") ? "staging" : "production";
}

function mapErrorCodeToKioskScreen(
  errorCode: IDKitErrorCodes | null,
): KioskScreen {
  switch (errorCode) {
    case IDKitErrorCodes.ConnectionFailed:
    case IDKitErrorCodes.Timeout:
      return KioskScreen.ConnectionError;
    case IDKitErrorCodes.Cancelled:
    case IDKitErrorCodes.UserRejected:
    case IDKitErrorCodes.VerificationRejected:
      return KioskScreen.VerificationRejected;
    default:
      return KioskScreen.VerificationError;
  }
}

function isLegacyVerificationLevel(
  value: string,
): value is LegacyVerificationLevel {
  return Object.values(LegacyVerificationLevel).includes(
    value as LegacyVerificationLevel,
  );
}

function toLegacyVerifyPayload(result: IDKitResult): LegacyVerifyPayload {
  if (result.protocol_version !== "3.0") {
    throw new Error("Kiosk only supports legacy uniqueness proofs.");
  }

  const response = result.responses[0];

  if (!response) {
    throw new Error("Missing proof response.");
  }

  if (!result.action) {
    throw new Error("Missing action in proof result.");
  }

  if (!isLegacyVerificationLevel(response.identifier)) {
    throw new Error("Unsupported verification level.");
  }

  return {
    action: result.action,
    signal_hash:
      response.signal_hash ??
      "0x00c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a4",
    proof: response.proof,
    nullifier_hash: response.nullifier,
    merkle_root: response.merkle_root,
    verification_level: response.identifier,
  };
}

export async function submitKioskProof(
  appId: `app_${string}`,
  result: IDKitResult,
  is_v4_action: boolean,
): Promise<KioskProofResponse> {
  if (is_v4_action) {
    const response = await fetch(`/api/v4/verify/${appId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(result),
    });

    const payload = (await response.json()) as KioskProofResponse;

    if (!response.ok) {
      throw payload;
    }

    return {
      success: true,
    };
  } else {
    const response = await fetch(`/api/v2/verify/${appId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toLegacyVerifyPayload(result)),
    });

    const payload = (await response.json()) as KioskProofResponse;

    if (!response.ok) {
      throw payload;
    }

    return payload;
  }
}

export function useLegacyKioskRequest({
  appId,
  action,
  actionDescription,
  verificationLevel,
  enabled = true,
}: UseLegacyKioskRequestOptions) {
  const [requestVersion, restartRequest] = useReducer(
    (current: number) => current + 1,
    0,
  );

  const rpContext = useMemo(
    () => buildMockRpContext(appId),
    [appId, requestVersion],
  );
  const preset = useMemo(
    () => getLegacyPreset(verificationLevel),
    [verificationLevel],
  );

  console.log("Initializing legacy kiosk request with options", {
    app_id: appId,
    action,
    action_description: actionDescription,
    rp_context: rpContext,
    allow_legacy_proofs: true,
    preset,
    environment: getKioskEnvironment(appId),
    polling: {
      interval: POLLING_INTERVAL_MS,
      timeout: POLLING_TIMEOUT_MS,
    },
  });

  const flow = useIDKitRequest({
    app_id: appId,
    action,
    action_description: actionDescription,
    rp_context: rpContext,
    allow_legacy_proofs: true,
    preset,
    environment: getKioskEnvironment(appId),
    polling: {
      interval: POLLING_INTERVAL_MS,
      timeout: POLLING_TIMEOUT_MS,
    },
  });

  useEffect(() => {
    if (!flow.isError) {
      return;
    }

    console.warn("Legacy kiosk request failed", {
      appId,
      action,
      errorCode: flow.errorCode,
    });
  }, [action, appId, flow.errorCode, flow.isError]);

  useEffect(() => {
    if (!enabled) {
      console.log("request disabled, resetting flow");
      flow.reset();
      return;
    }

    console.log("request enabled, starting flow");
    flow.reset();
    flow.open();
  }, [enabled, flow.open, flow.reset, requestVersion]);

  const requestScreen = flow.isError
    ? mapErrorCodeToKioskScreen(flow.errorCode)
    : flow.isAwaitingUserConfirmation || flow.isSuccess
      ? KioskScreen.Connected
      : KioskScreen.Waiting;

  return {
    connectorURI: flow.connectorURI,
    proofResult: flow.result,
    requestScreen,
    restartRequest,
  };
}
