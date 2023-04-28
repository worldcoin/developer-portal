import { APIKeyModel } from "src/lib/models";
import { create } from "zustand";

export type IKeyStore = {
  keys: APIKeyModel[];
  currentKey: APIKeyModel | null;
  keySecret: Record<APIKeyModel["id"], string | undefined>;
  isNewKeyModalOpened: boolean;
  isUpdateKeyModalOpened: boolean;
  isDeleteKeyModalOpened: boolean;
  setKeys: (keys: APIKeyModel[]) => void;
  setCurrentKey: (key: APIKeyModel | null) => void;
  setCurrentKeyById: (id: string) => void;
  setKeySecret: (
    keySecret: Record<APIKeyModel["id"], APIKeyModel["api_key"] | undefined>
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
  setCurrentKeyById: (id) =>
    set({ currentKey: get().keys.find((key) => key.id === id) }),
  setKeySecret: (keySecret) => set({ keySecret }),
  setIsNewKeyModalOpened: (value) => set({ isNewKeyModalOpened: value }),
  setIsUpdateKeyModalOpened: (value) => set({ isUpdateKeyModalOpened: value }),
  setIsDeleteKeyModalOpened: (value) => set({ isDeleteKeyModalOpened: value }),
}));
