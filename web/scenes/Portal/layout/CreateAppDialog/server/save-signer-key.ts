"use server";

/**
 * Saves signer key configuration for a World ID 4.0 app.
 *
 * TODO: Backend team - This requires:
 * 1. Database migration to add columns to `app` table:
 *    - signer_address (TEXT)
 *    - signer_key_setup_type (TEXT: 'generated' | 'existing')
 *    - world_id_v4_mode (TEXT: 'managed' | 'self-managed')
 * 2. GraphQL mutation to update these fields
 * 3. Update Hasura permissions for the mutation
 *
 * See BACKEND_INTEGRATION_NOTES.md for full requirements.
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
};

export async function saveSignerKey(
  input: SaveSignerKeyInput,
): Promise<SaveSignerKeyResult> {
  const { appId, signerAddress, setupType, mode } = input;

  // TODO: Backend team - Validate Ethereum address server-side
  // TODO: Backend team - Add GraphQL mutation call here:
  //
  // const client = await getAPIServiceGraphqlClient();
  // const sdk = getSdk(client);
  // await sdk.SaveSignerKey({
  //   app_id: appId,
  //   signer_address: signerAddress,
  //   signer_key_setup_type: setupType,
  //   world_id_v4_mode: mode,
  // });

  console.log("[saveSignerKey] TODO: Backend integration needed", {
    appId,
    signerAddress,
    setupType,
    mode,
  });

  // Temporary: Return success for frontend testing
  return { success: true };
}
