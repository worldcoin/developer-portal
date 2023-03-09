import { deleteCookie, getCookie, getCookies } from "cookies-next";
import { GetServerSideProps } from "next";
import { NextRouter, Router } from "next/router";
import { urls } from "@/lib/urls";
import { create } from "zustand";

export interface IAuthStore {
  logout: () => void;
  enterApp: (router: NextRouter) => void;
  isAuthCookiesValid: (ctx?: Parameters<GetServerSideProps>[0]) => boolean;
  setAuthCookies: (
    token: string | null,
    returnTo?: string,
    ctx?: Parameters<GetServerSideProps>[0]
  ) => void;
}

export const useAuthStore = create<IAuthStore>()((set, get) => ({
  logout: () => {
    // deleteCookie("auth");
  },

  isAuthCookiesValid: (ctx?: Parameters<GetServerSideProps>[0]) => {
    return true;
  },

  setAuthCookies: (
    token: string | null,
    returnTo?: string,
    ctx?: Parameters<GetServerSideProps>[0]
  ) => {
    return;
  },

  enterApp: (router) => {
    // const auth = getCookie("auth") as string | undefined;
    // FIXME
    return router.push(urls.app());

    // if (!auth || !JSON.parse(auth).returnTo) {
    //   return router.push(urls.app());
    // }

    // router.push(JSON.parse(auth).returnTo);
  },
}));
