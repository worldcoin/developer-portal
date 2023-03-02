import { restAPIRequest } from "src/lib/frontend-api";
import { kea, path } from "kea";
import { loaders } from "kea-loaders";
import { ModelPublicAction } from "src/lib/types";
import type { publicLogicType } from "./publicLogicType";
import { VerificationResponse } from "@worldcoin/id";

// Proof may be valid or invalid
export interface VerifiedProofInterface {
  nullifier_hash?: string;
  success: boolean;
  error_code?: string;
  return_url?: string;
  created_at?: string;
}

// Only for valid expected responses
export interface ValidProofResponse {
  success: true;
  nullifier_hash: string;
  return_url: string;
  created_at: string;
}

export interface MaybeValidProofResponse {
  success: boolean;
  code?: string;
  detail?: string;
}

/**
 * This logic is reused by the hosted page & kiosk
 */
export const publicLogic = kea<publicLogicType>([
  path(["logics", "publicLogic"]),
  loaders({
    action: [
      null as ModelPublicAction | null,
      {
        loadAction: async ({ action_id }: { action_id: string }) => {
          return (await restAPIRequest(
            `/precheck/${action_id}`
          )) as ModelPublicAction;
        },
      },
    ],
    verifiedProof: [
      null as VerifiedProofInterface | null,
      {
        verifyProof: async ({
          verificationResponse,
          ...restOfPayload
        }: {
          verificationResponse: VerificationResponse;
          action_id: string;
          signal: string;
        }): Promise<VerifiedProofInterface> => {
          try {
            const response = await restAPIRequest<ValidProofResponse>(
              "/verify",
              {
                method: "POST",
                json: { ...verificationResponse, ...restOfPayload },
              }
            );
            return response;
          } catch (e) {
            console.warn("Error verifying proof. Please check network logs.");
            try {
              if ((e as Record<string, any>).code) {
                return {
                  success: false,
                  error_code: (e as Record<string, any>).code,
                };
              }
            } catch {}
            return { success: false, error_code: "unknown" };
          }
        },
      },
    ],
  }),
]);
