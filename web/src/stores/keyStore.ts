import { APIKeyModel } from "src/lib/models";
import { create } from "zustand";

export type IKeyStore = {
  keys: APIKeyModel[];
  currentKey: APIKeyModel | null;
  keySecret: string | null;
  setKeys: (keys: APIKeyModel[]) => void;
  setCurrentKey: (key: APIKeyModel | null) => void;
  setCurrentKeyById: (id: string) => void;
  setKeySecret: (secret: string | null) => void;
};

export const useKeyStore = create<IKeyStore>((set, get) => ({
  keys: [],
  currentKey: null,
  keySecret: null,
  setKeys: (keys) => set({ keys }),
  setCurrentKey: (currentKey) => set({ currentKey }),
  setCurrentKeyById: (id) =>
    set({ currentKey: get().keys.find((key) => key.id === id) }),
  setKeySecret: (keySecret) => set({ keySecret }),
}));
