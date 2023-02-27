import { SignInAction, signInActions } from "common/Layout/temp-data";
import { create } from "zustand";

type States = {
  signInAction: SignInAction | null;
  enabled: boolean;
  clientSecretSeenOnce: boolean;
  redirectInputs: Array<string>;
  defaultRedirect: string | null;
};

type Actions = {
  fetchSignInAction: (app_id: string) => Promise<void>;
  toggleSignInAction: () => void;
  setClientSecretSeenOnce: (clientSecretSeenOnce: boolean) => void;
  updateRedirectInputs: (index: number, value: string) => void;
  saveRedirects: () => Promise<void>;
  removeRedirect: (index: number) => void;
  setDefaultRedirect: (url: string) => void;
};

export const useSignInActionStore = create<States & Actions>((set, get) => ({
  signInAction: null,
  enabled: false,
  clientSecretSeenOnce: true,
  redirectInputs: [],
  defaultRedirect: null,

  setDefaultRedirect: (url: string) => {
    //TODO: Add some logic to set the default redirect
    set(() => ({ defaultRedirect: url }));
  },

  updateRedirectInputs: (index: number, value: string) => {
    set((state) => {
      const redirectInputs = [...state.redirectInputs];
      redirectInputs[index] = value;
      return { redirectInputs };
    });
  },

  removeRedirect: (index: number) => {
    set((state) => {
      const redirectInputs = [...state.redirectInputs];
      redirectInputs.splice(index, 1);
      return { redirectInputs };
    });
  },

  saveRedirects: async () => {
    //TODO: Add save logic
    const _redirects = get().redirectInputs;
  },

  setClientSecretSeenOnce: (clientSecretSeenOnce: boolean) =>
    set(() => ({ clientSecretSeenOnce })),

  fetchSignInAction: async (app_id: string) => {
    const signInAction = signInActions[app_id];

    set(() => ({
      signInAction,
      enabled: signInAction?.enabled,
      clientSecretSeenOnce: signInAction?.client_secret_seen_once,
      redirectInputs: signInAction?.redirect.uri || [],
      defaultRedirect: signInAction?.redirect.default ?? null,
    }));
  },

  toggleSignInAction: () => {
    if (get().enabled) {
      //TODO: Add some logic to disable the action
      return set(() => ({ enabled: false }));
    }

    //TODO: Add some logic to enable the action
    set(() => ({ enabled: true }));
  },
}));
