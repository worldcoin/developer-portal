// import { CustomAction, customActions } from "common/Layout/temp-data";
import { gql } from "@apollo/client";
import { graphQLRequest } from "frontend-api";
import { create } from "zustand";

// Types
export type AppType = {
  id: string;
  engine: string;
  description_internal: string;
  is_archived: boolean;
  is_verified: boolean;
  logo_url: string;
  is_staging: boolean;
  name: string;
  status: string;
};

type AppStats = {
  app_id: string;
  date: string;
  verifications: {
    total: number;
    total_cumulative: number;
  };
  unique_users: {
    total: number;
    total_cumulative: number;
  };
};

export type AppStore = {
  apps: Array<AppType>;
  currentApp: AppType | null;
  appStats: Array<AppStats>;
  setApps: (apps: Array<AppType>) => void;
  setCurrentApp: (currentApp: AppType) => void;
  setAppStats: (appStats: Array<AppStats>) => void;
  fetchApps: () => void;
  fetchAppById: (app_id: string) => void;
  fetchAppStats: () => void;
};

// GraphQL queries
const selectAppsQuery = gql`
  query SelectApps {
    app {
      id
      engine
      description_internal
      is_archived
      is_verified
      logo_url
      is_staging
      name
      status
    }
  }
`;

const selectAppByIdQuery = gql`
  query SelectAppById($app_id: String = "") {
    app(where: { id: { _eq: $app_id } }) {
      id
      engine
      description_internal
      is_archived
      is_verified
      logo_url
      is_staging
      name
      status
    }
  }
`;

// const selectAppStatsQuery = gql`
// query SelectAppStats {
//   // TODO
// }
// `;

export const getAppStore = ({
  apps,
  currentApp,
  appStats,
  setApps,
  setCurrentApp,
  setAppStats,
  fetchApps,
  fetchAppById,
}: AppStore) => ({
  apps,
  currentApp,
  appStats,
  setApps,
  setCurrentApp,
  setAppStats,
  fetchApps,
  fetchAppById,
});

// App store
export const useAppStore = create<AppStore>((set, get) => ({
  apps: [] as AppType[],
  currentApp: null,
  appStats: [] as AppStats[],
  setApps: (apps: AppType[]) => set({ apps }),
  setCurrentApp: (currentApp: AppType) => set({ currentApp }),
  setAppStats: (appStats: AppStats[]) => set({ appStats }),
  fetchApps: async () => {
    const response = await graphQLRequest({
      query: selectAppsQuery,
    });

    if (response?.data?.app) {
      set({ apps: response.data.app });
    } else {
      console.error("Could not retrieve apps");
    }
  },
  fetchAppById: async (app_id) => {
    const response = await graphQLRequest({
      query: selectAppByIdQuery,
      variables: {
        app_id: app_id,
      },
    });

    if (response?.data?.app?.length) {
      set({ currentApp: response.data.app[0] });
    }
  },
  fetchAppStats: async () => {
    console.log("fetchAppStats()");
  },
}));
