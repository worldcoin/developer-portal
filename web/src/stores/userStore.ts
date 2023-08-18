import { create } from "zustand";

export type IUserStore = {
  userId?: string;
  setUserId: (userId?: string) => void;
};

export const useUserStore = create<IUserStore>((set, get) => ({
  userId: undefined,
  setUserId: (userId) => set({ userId }),
}));
