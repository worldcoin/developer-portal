import { FetchKeysQuery } from "src/hooks/useKeys/graphql/fetch-keys.generated";
import { ResetApiKeyMutation } from "src/hooks/useKeys/graphql/reset-key.generated";
import { create } from "zustand";

export type IKeyStore = {
  currentKey: FetchKeysQuery["api_key"][number] | null;
  isNewKeyModalOpened: boolean;
  isUpdateKeyModalOpened: boolean;
  isDeleteKeyModalOpened: boolean;
  setCurrentKey: (key: FetchKeysQuery["api_key"][number] | null) => void;
  setIsNewKeyModalOpened: (value: boolean) => void;
  setIsUpdateKeyModalOpened: (value: boolean) => void;
  setIsDeleteKeyModalOpened: (value: boolean) => void;
};

export const useKeyStore = create<IKeyStore>((set, get) => ({
  currentKey: null,
  setCurrentKey: (key) => set({ currentKey: key }),
  isNewKeyModalOpened: false,
  isUpdateKeyModalOpened: false,
  isDeleteKeyModalOpened: false,
  setIsNewKeyModalOpened: (value) => set({ isNewKeyModalOpened: value }),
  setIsUpdateKeyModalOpened: (value) => set({ isUpdateKeyModalOpened: value }),
  setIsDeleteKeyModalOpened: (value) => set({ isDeleteKeyModalOpened: value }),
}));
