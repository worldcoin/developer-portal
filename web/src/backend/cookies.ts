import {
  setCookie as nextSetCookie,
  getCookie,
  getCookies,
} from "cookies-next";
import { GetServerSideProps, NextApiRequest, NextApiResponse } from "next";
import { verifyUserJWT } from "./jwts";
import { OptionsType } from "cookies-next/lib/types";

type GSSRRequest = Parameters<GetServerSideProps>[0]["req"];
type GSSRResponse = Parameters<GetServerSideProps>[0]["res"];

export const setCookie = (
  name: string,
  value: Record<string, unknown> | boolean,
  req: NextApiRequest | GSSRRequest,
  res: NextApiResponse | GSSRResponse,
  expires_at?: number,
  sameSite?: OptionsType["sameSite"],
  path?: string
) => {
  nextSetCookie(name, JSON.stringify(value), {
    sameSite: sameSite ?? true,
    secure: process.env.NODE_ENV === "production", // this is already ignored for `localhost` (according to spec)
    httpOnly: true, // NOTE: Auth cookie is only used in SSR for security reasons
    res,
    req,
    maxAge: expires_at ? (expires_at * 1000 - Date.now()) / 1000 : undefined,
    path: path ?? "/",
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
  req: NextApiRequest | GSSRRequest,
  res: NextApiResponse | GSSRResponse
) => {
  const authCookie = getCookie("auth", { req, res })?.toString();
  return authCookie ? (JSON.parse(authCookie).token as string) : undefined;
};

export const getReturnToFromCookie = (
  req: NextApiRequest,
  res: NextApiResponse
) => {
  const authCookie = getCookie("auth", { req, res })?.toString();
  return authCookie ? (JSON.parse(authCookie).returnTo as string) : undefined;
};
