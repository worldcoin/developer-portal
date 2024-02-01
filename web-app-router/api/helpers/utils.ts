import "server-only";

/**
 * Contains shared utilities that are reused for the Next.js API (backend)
 */
import crypto from "crypto";

const GENERAL_SECRET_KEY = process.env.GENERAL_SECRET_KEY;

if (!GENERAL_SECRET_KEY) {
  throw new Error(
    "Improperly configured. `GENERAL_SECRET_KEY` env var must be set!"
  );
}

export const verifyHashedSecret = (
  identifier: string,
  secret: string,
  hashed_secret: string
) => {
  const hmac = crypto.createHmac("sha256", GENERAL_SECRET_KEY);
  hmac.update(`${identifier}.${secret}`);
  const generated_secret = hmac.digest("hex");

  return generated_secret === hashed_secret;
};
