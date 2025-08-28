import hkdf from "@panva/hkdf";
import { EncryptJWT, JWTPayload } from "jose";
import { ALG, BYTE_LENGTH, DIGEST, ENC, ENCRYPTION_INFO } from "./constants";

export async function encrypt(
  payload: JWTPayload,
  secret: string,
  expiration: number,
  additionalHeaders?: {
    iat: number;
    uat: number;
    exp: number;
  }
) {
  const encryptionSecret = await hkdf(
    DIGEST,
    secret,
    "",
    ENCRYPTION_INFO,
    BYTE_LENGTH
  );

  const encryptedCookie = await new EncryptJWT(payload)
    .setProtectedHeader({ enc: ENC, alg: ALG, ...additionalHeaders })
    .setExpirationTime(expiration)
    .encrypt(encryptionSecret);

  return encryptedCookie.toString();
}
