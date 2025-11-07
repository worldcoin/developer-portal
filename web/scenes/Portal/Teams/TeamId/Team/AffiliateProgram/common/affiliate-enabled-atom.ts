import { atom } from "jotai";

export const affiliateEnabledAtom = atom<{
  isFetched: boolean;
  value: boolean;
}>({
  isFetched: false,
  value: false,
});
