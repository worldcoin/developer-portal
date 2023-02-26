import { App, apps as tempApps } from "common/Layout/temp-data";
import { create } from "zustand";

type States = {
  apps: Array<App>;
  currentApp: App | null;
};

type Actions = {
  setCurrentApp: (app: App) => void;
  setCurrentAppById: (id: string) => void;
  fetchApps: () => Promise<void>;
};

export const useAppsStore = create<States & Actions>((set, get) => ({
  apps: [],
  currentApp: null,
  setCurrentApp: (currentApp: App) => set(() => ({ currentApp })),

  setCurrentAppById: (id: string) => {
    const app = get().apps.find((app) => app.id === id);
    if (app) {
      set(() => ({ currentApp: app }));
    }
  },

  fetchApps: async () => {
    const apps = tempApps;
    set(() => ({ apps }));
  },
}));
