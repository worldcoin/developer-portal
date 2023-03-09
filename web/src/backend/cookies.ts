import {
  setCookie as nextSetCookie,
  getCookie,
  getCookies,
} from "cookies-next";
import { GetServerSideProps, NextApiRequest, NextApiResponse } from "next";
import { verifyUserJWT } from "./jwts";

export const setCookie = (
  name: string,
  value: Record<string, unknown>,
  req: NextApiRequest,
  res: NextApiResponse,
  expires_at?: number
) => {
  nextSetCookie(name, JSON.stringify(value), {
    sameSite: true,
    secure: process.env.NODE_ENV === "production", // this is already ignored for `localhost` (according to spec)
    httpOnly: true,
    res,
    req,
    maxAge: expires_at ? (expires_at * 1000 - Date.now()) / 1000 : undefined,
  });
};

export const isAuthCookieValid = async (
  ctx?: Parameters<GetServerSideProps>[0]
) => {
  let auth;

  if (!ctx) {
    auth = getCookie("auth") as string | undefined;
  }

  if (ctx) {
    auth = getCookies(ctx).auth;
  }

  if (!auth) {
    return false;
  }

  let token: string | undefined;

  try {
    token = JSON.parse(auth).token;
  } catch {}

  if (!token || !(await verifyUserJWT(token))) {
    return false;
  }

  return true;
};

export const getTokenFromCookie = (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const authCookie = getCookie("auth", { req, res })?.toString();
  return authCookie ? JSON.parse(authCookie).token : undefined;
};
