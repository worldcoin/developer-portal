import { deleteCookie, getCookie, getCookies, setCookie } from "cookies-next";
import { GetServerSideProps } from "next";
import { NextRouter, Router } from "next/router";
import { urls } from "urls";
import { create } from "zustand";

export interface IAuthStore {
  logout: () => void;
  enterApp: (router: NextRouter) => void;
  isAuthCookiesValid: (ctx?: Parameters<GetServerSideProps>[0]) => boolean;
  getToken: () => string | null;
  setAuthCookies: (
    token: string | null,
    returnTo?: string,
    ctx?: Parameters<GetServerSideProps>[0]
  ) => void;
}

export const useAuthStore = create<IAuthStore>()((set, get) => ({
  logout: () => {
    deleteCookie("auth");
  },

  getToken: () => {
    const auth = getCookie("auth") as string | undefined;

    if (!auth || !JSON.parse(auth).token) {
      return null;
    }

    return JSON.parse(auth).token;
  },

  isAuthCookiesValid: (ctx?: Parameters<GetServerSideProps>[0]) => {
    let auth;

    if (!ctx) {
      auth = getCookie("auth") as string | undefined;
    }

    if (ctx) {
      auth = getCookies(ctx).auth;
    }

    if (!auth || !JSON.parse(auth).token) {
      return false;
    }

    //TODO: validate token

    return true;
  },

  setAuthCookies: (
    token: string | null,
    returnTo?: string,
    ctx?: Parameters<GetServerSideProps>[0]
  ) => {
    let auth;

    if (!ctx) {
      auth = getCookie("auth") as string | undefined;
    }

    if (ctx) {
      auth = getCookies(ctx).auth;
    }

    setCookie(
      "auth",
      JSON.stringify({
        token,
        returnTo: auth && !returnTo ? JSON.parse(auth).returnTo : returnTo,
      }),
      {
        maxAge: 60 * 60 * 24 * 7, // 7d
        sameSite: true,
        req: ctx?.req,
        res: ctx?.res,
      }
    );
  },

  enterApp: (router) => {
    const auth = getCookie("auth") as string | undefined;

    if (!auth || !JSON.parse(auth).returnTo) {
      return router.push(urls.app());
    }

    router.push(JSON.parse(auth).returnTo);
  },
}));
