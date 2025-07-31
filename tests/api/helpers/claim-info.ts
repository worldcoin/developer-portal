import { createHash } from 'crypto';
import { CompactEncrypt, JWK, SignJWT, importJWK } from 'jose';

/**
 * Encrypt a message using RSA-OAEP and A256GCM
 *
 * @param publicKey The RSA-OAEP public key
 * @param payload The message to encrypt
 * @returns The encrypted message in JWE compact serialization format
 */
async function encryptMessage(publicKey: any, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const encodedPayload = encoder.encode(payload);

  const jwe = await new CompactEncrypt(encodedPayload)
    .setProtectedHeader({ alg: 'RSA-OAEP', enc: 'A256GCM' })
    .encrypt(publicKey);

  return jwe;
}

/**
 * Sign a JWT
 *
 * @param payload The payload to sign
 * @param privateKey The RS256 private key
 * @returns The signed JWT
 */
async function signJWT(payload: any, privateKey: any): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('30m')
    .sign(privateKey);
}

/**
 * Generate a claim info JWT token for testing
 *
 * @param userId User ID to generate the claim info for
 * @param orbNullifierHash nullifier hash from Orb verification
 * @param documentNullifierHash nullifier hash from document verification
 * @param claimingCooldownActive flag indicating if claim cooldown is active
 * @param availableReservations array of available reservation IDs
 * @returns A JWT token containing encrypted claim info
 */
export async function generateClaimInfo(
  userId: string,
  orbNullifierHash: string,
  documentNullifierHash: string,
  claimingCooldownActive: boolean = false,
  availableReservations: string[] = [],
): Promise<string> {
  const hashedUserId = createHash('sha256')
    .update(userId + process.env.SALT!)
    .digest('base64');

  const claimInfo = {
    // By default the risk result is OK
    riskVerdict: 'OK',
    hashedUserId,
    orbNullifierHash,
    // User is verified by default
    isMissingNullifierHash: !orbNullifierHash,
    documentNullifierHash,
    claimingCooldownActive,
    availableReservations,
    // Default user internal TFH
    isTFHInternal: true,
  };

  const encryptionPublicKeyJWK: JWK = JSON.parse(process.env.WF_GRANTS_ENCRYPTION_PUBLIC_KEY!);
  const signingPrivateKeyJWK: JWK = JSON.parse(process.env.WF_GRANTS_SIGNING_PRIVATE_KEY!);

  const encryptionPublicKey = await importJWK(encryptionPublicKeyJWK, 'RSA-OAEP');

  const signingPrivateKey = await importJWK(signingPrivateKeyJWK, 'RS256');

  const jwe = await encryptMessage(encryptionPublicKey, JSON.stringify(claimInfo));

  return signJWT({ jwe }, signingPrivateKey);
}
