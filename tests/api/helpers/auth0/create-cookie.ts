import { serialize } from "cookie";

export const createCookie = (sessionToken: string, expiration: number) =>
  serialize("appSession", sessionToken, {
    domain: "staging-developer.worldcoin.org",
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    expires: new Date(expiration),
  });
