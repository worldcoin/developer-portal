import { ActionModel, RedirectModel } from "src/lib/models";
import { create } from "zustand";

export type ISignInActionStore = {
  action: ActionModel | null;
  setAction: (action: ActionModel | null) => void;
  redirects: Array<Pick<RedirectModel, "id" | "redirect_uri">>;
  setRedirects: (
    redirects: Array<Pick<RedirectModel, "id" | "redirect_uri">>
  ) => void;
  clientSecret: null | string;
  setClientSecret: (clientSecret: null | string) => void;
};

export const useSignInActionStore = create<ISignInActionStore>((set, get) => ({
  action: null,
  setAction: (action) => set({ action }),

  redirects: [],
  setRedirects: (redirects) => set({ redirects }),

  clientSecret: null,
  setClientSecret: (clientSecret) => set({ clientSecret }),
}));
