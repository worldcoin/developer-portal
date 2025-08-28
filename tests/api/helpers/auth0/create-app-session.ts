import { JWTPayload } from "jose";
import { createCookie } from "./create-cookie";
import { encrypt } from "./encrypt";

export const createAppSession = async (payload: JWTPayload) => {
  const AUTH0_SECRET = process.env.AUTH0_SECRET;
  const tomorrow = Date.now() + 15 * 60 * 1000;

  if (!AUTH0_SECRET) {
    throw new Error("AUTH0_SECRET environment variable is not set!");
  }

  const sessionToken = await encrypt(payload, AUTH0_SECRET, tomorrow, {
    iat: tomorrow,
    uat: tomorrow,
    exp: tomorrow,
  });

  return createCookie(sessionToken, tomorrow);
};
