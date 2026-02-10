"use server";

import {
  generateRpId,
  generateRpIdString,
  getRpRegistryConfig,
  getStagingRpRegistryConfig,
  WORLD_CHAIN_ID,
} from "@/api/helpers/rp-utils";
import { getIsUserAllowedToUpdateApp } from "@/lib/permissions";

export type SelfManagedRegistrationInfoResult =
  | {
      success: true;
      rpId: string;
      rpIdNumeric: string;
      chainId: number;
      productionContractAddress: string;
      stagingContractAddress: string | null;
      functionSignature: string;
    }
  | {
      success: false;
      message: string;
    };

const REGISTER_FUNCTION_SIGNATURE =
  "register(uint64 rpId, address manager, address signer, string domain)";

/**
 * Returns the information a developer needs to register their RP on-chain
 * in self-managed mode: rpId, contract addresses, chain ID, and function
 * signature.
 */
export async function getSelfManagedRegistrationInfo(
  appId: string,
): Promise<SelfManagedRegistrationInfoResult> {
  try {
    const isAllowed = await getIsUserAllowedToUpdateApp(appId);

    if (!isAllowed) {
      return {
        success: false,
        message: "You do not have permission to manage this app",
      };
    }

    const productionConfig = getRpRegistryConfig();

    if (!productionConfig) {
      return {
        success: false,
        message:
          "RP Registry is not configured. Please contact support.",
      };
    }

    const stagingConfig = getStagingRpRegistryConfig();

    const rpIdString = generateRpIdString(appId);
    const rpIdNumeric = generateRpId(appId).toString();

    return {
      success: true,
      rpId: rpIdString,
      rpIdNumeric,
      chainId: WORLD_CHAIN_ID,
      productionContractAddress: productionConfig.contractAddress,
      stagingContractAddress: stagingConfig?.contractAddress ?? null,
      functionSignature: REGISTER_FUNCTION_SIGNATURE,
    };
  } catch (error) {
    console.error(
      "[getSelfManagedRegistrationInfo] Error:",
      error,
    );

    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
