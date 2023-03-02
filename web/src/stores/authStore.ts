import { NextRouter, Router } from "next/router";
import { urls } from "src/lib/urls";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface IAuthStore {
  token: string | null;
  returnTo: string | null;

  logout: () => void;
  setToken: (token: string) => void;
  redirectWithReturn: (router: NextRouter) => void;
  enterApp: (router: NextRouter) => void;
}

export const useAuthStore = create<IAuthStore>()(
  persist(
    (set, get) => ({
      token: null,
      returnTo: null,

      setToken: async (token) => set({ token }),
      logout: () => {
        set({ token: null });
      },

      redirectWithReturn: (router) => {
        const returnTo = router.asPath === urls.logout() ? null : router.asPath;
        set({ returnTo });
        router.push(urls.login());
      },

      enterApp: (router) => {
        const returnTo = get().returnTo || urls.app();
        set({ returnTo: null });
        router.push(returnTo);
      },
    }),
    {
      name: "auth",
      partialize: (state) => ({ token: state.token, returnTo: state.returnTo }),
    }
  )
);
