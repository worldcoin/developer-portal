"use server";

import { generateUserJWT } from "@/api/helpers/jwts";
import { getSession } from "@auth0/nextjs-auth0";
import dayjs from "dayjs";
import { GraphQLClient } from "graphql-request";
import { getSdk } from "./graphql/register-rp.generated";

/**
 * Saves signer key configuration for a World ID 4.0 app.
 *
 * This calls the register_rp Hasura action which:
 * 1. Creates a KMS manager key (for World to manage the RP)
 * 2. Builds and signs a UserOperation for on-chain RP registration
 * 3. Submits the operation to the temporal bundler
 * 4. Returns the registration status and operation hash
 *
 * Note: Currently only supports managed mode. Self-managed mode is coming soon.
 */

export type SaveSignerKeyInput = {
  appId: string;
  signerAddress: string;
  setupType: "generated" | "existing";
  mode: "managed" | "self-managed";
};

export type SaveSignerKeyResult = {
  success: boolean;
  error?: string;
  rpId?: string;
  managerAddress?: string;
  operationHash?: string;
};

export async function saveSignerKey(
  input: SaveSignerKeyInput,
): Promise<SaveSignerKeyResult> {
  const { appId, signerAddress, mode } = input;

  // Currently only managed mode is supported
  if (mode !== "managed") {
    return {
      success: false,
      error: "Self-managed mode is not yet supported",
    };
  }

  try {
    const session = await getSession();

    if (!session?.user?.hasura?.id) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const { token } = await generateUserJWT(
      session.user.hasura.id,
      dayjs().add(1, "minute").unix(),
    );

    const client = new GraphQLClient(process.env.NEXT_PUBLIC_GRAPHQL_API_URL!, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const sdk = getSdk(client);

    const result = await sdk.RegisterRp({
      app_id: appId,
      signer_address: signerAddress,
    });

    if (!result.register_rp) {
      return {
        success: false,
        error: "Failed to register Relying Party",
      };
    }

    return {
      success: true,
      rpId: result.register_rp.rp_id,
      managerAddress: result.register_rp.manager_address,
      operationHash: result.register_rp.operation_hash,
    };
  } catch (error) {
    console.error("[saveSignerKey] Error registering RP:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
