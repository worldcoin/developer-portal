import { APIKeyModel } from "src/lib/models";
import { create } from "zustand";

export type IKeyStore = {
  keys: Array<APIKeyModel>;
  currentKey: APIKeyModel | null;
  currentSecret: string | null;

  setKeys: (keys: Array<APIKeyModel>) => void;
  setCurrentKey: (key: APIKeyModel | null) => void;
  setCurrentKeyById: (id: string) => void;
  setCurrentSecret: (secret: string | null) => void;
};

export const useKeyStore = create<IKeyStore>((set, get) => ({
  keys: [],
  currentKey: null,
  currentSecret: null,

  setKeys: (keys) => set(() => ({ keys })),
  setCurrentKey: (currentKey) => set(() => ({ currentKey })),
  setCurrentKeyById: (id: string) => {
    const key = get().keys.find((key) => key.id === id);
    if (key) {
      set(() => ({ currentKey: key }));
    }
  },
  setCurrentSecret: (currentSecret) => set(() => ({ currentSecret })),
}));
