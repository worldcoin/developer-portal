import hkdf from "@panva/hkdf";
import { JWTDecryptOptions, jwtDecrypt } from "jose";
import { BYTE_LENGTH, DIGEST, ENCRYPTION_INFO } from "./constants";

export async function decrypt(
  cookieValue: string,
  secret: string,
  options?: JWTDecryptOptions,
) {
  try {
    const encryptionSecret = await hkdf(
      DIGEST,
      secret,
      "",
      ENCRYPTION_INFO,
      BYTE_LENGTH,
    );
    const cookie = await jwtDecrypt(cookieValue, encryptionSecret, {
      ...options,
      ...{ clockTolerance: 15 },
    });
    return cookie;
  } catch (e: any) {
    if (e.code === "ERR_JWT_EXPIRED") {
      return null;
    }
    throw e;
  }
}
