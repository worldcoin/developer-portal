import { AppModel } from "src/lib/models";
import { create } from "zustand";

export type IAppStore = {
  apps: Array<AppModel>;
  currentApp: AppModel | null;

  setCurrentApp: (app: AppModel) => void;
  setCurrentAppById: (id: string) => void;
  setApps: (apps: Array<AppModel>) => void;
};

export const useAppStore = create<IAppStore>((set, get) => ({
  apps: [],
  currentApp: null,
  setCurrentApp: (currentApp) => set(() => ({ currentApp })),
  setCurrentAppById: (id: string) => {
    const app = get().apps.find((app) => app.id === id);
    if (app) {
      set(() => ({ currentApp: app }));
    }
  },
  setApps: (apps) => set(() => ({ apps })),
}));
