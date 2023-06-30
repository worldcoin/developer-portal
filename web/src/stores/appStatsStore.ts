import { AppStatsModel } from "src/lib/models";
import { create } from "zustand";

const timeSpans = [
  { label: "This week", value: "week" },
  { label: "This month", value: "month" },
] as const;

export type TimeSpan = typeof timeSpans[number];

export type IAppStatsStore = {
  stats: Array<AppStatsModel>;
  setStats: (stats: Array<AppStatsModel>) => void;
  timeSpans: typeof timeSpans;
  currentTimeSpan: TimeSpan;
  setCurrentTimeSpan: (value: TimeSpan) => void;
};

export const useAppStatsStore = create<IAppStatsStore>((set, get) => ({
  stats: [],
  setStats: (stats) => set({ stats }),
  timeSpans,
  currentTimeSpan: timeSpans[0],
  setCurrentTimeSpan: (currentTimeSpan) => set({ currentTimeSpan }),
}));
