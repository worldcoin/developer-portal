import { FetchKeysQuery } from "src/hooks/useKeys/graphql/fetch-keys.generated";
import { ResetApiKeyMutation } from "src/hooks/useKeys/graphql/reset-key.generated";
import { create } from "zustand";

export type IKeyStore = {
  keys: FetchKeysQuery["api_key"];
  currentKey: FetchKeysQuery["api_key"][number] | null;

  keySecret: Record<
    FetchKeysQuery["api_key"][number]["id"],
    NonNullable<ResetApiKeyMutation["reset_api_key"]>["api_key"] | undefined
  >;

  isNewKeyModalOpened: boolean;
  isUpdateKeyModalOpened: boolean;
  isDeleteKeyModalOpened: boolean;
  setKeys: (keys: FetchKeysQuery["api_key"]) => void;
  setCurrentKey: (key: FetchKeysQuery["api_key"][number] | null) => void;

  setKeySecret: (
    keySecret: Record<
      FetchKeysQuery["api_key"][number]["id"],
      NonNullable<ResetApiKeyMutation["reset_api_key"]>["api_key"] | undefined
    >
  ) => void;

  setIsNewKeyModalOpened: (value: boolean) => void;
  setIsUpdateKeyModalOpened: (value: boolean) => void;
  setIsDeleteKeyModalOpened: (value: boolean) => void;
};

export const useKeyStore = create<IKeyStore>((set, get) => ({
  keys: [],
  currentKey: null,
  keySecret: {},
  isNewKeyModalOpened: false,
  isUpdateKeyModalOpened: false,
  isDeleteKeyModalOpened: false,
  setKeys: (keys) => set({ keys }),
  setCurrentKey: (currentKey) => set({ currentKey }),
  setKeySecret: (keySecret) => set({ keySecret }),
  setIsNewKeyModalOpened: (value) => set({ isNewKeyModalOpened: value }),
  setIsUpdateKeyModalOpened: (value) => set({ isUpdateKeyModalOpened: value }),
  setIsDeleteKeyModalOpened: (value) => set({ isDeleteKeyModalOpened: value }),
}));
