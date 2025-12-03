import { atom } from "jotai";

export const affiliateEnabledAtom = atom<{
  isFetched: boolean;
  value: boolean;
  enabled?: boolean;
  enabledTeams?: string[];
}>({
  isFetched: false,
  value: false,
  enabled: true,
  enabledTeams: [],
});
