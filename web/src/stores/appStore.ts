import { gql } from "@apollo/client";
import { graphQLRequest } from "src/lib/frontend-api";
import { AppModel } from "src/lib/models";
import { create } from "zustand";

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

export type IAppStore = {
  apps: Array<AppModel>;
  currentApp: AppModel | null;
  appStats: Array<AppStats>;
  setApps: (apps: Array<AppModel>) => void;
  setCurrentApp: (currentApp: AppModel) => void;
  setAppStats: (appStats: Array<AppStats>) => void;
  fetchApps: () => void;
  retrieveApp: (app_id: string) => void;
  fetchAppStats: () => void;
};

// ANCHOR: GraphQL queries

const appAttributes = `
id
engine
description_internal
is_archived
is_verified
logo_url
is_staging
name
status
user_interfaces
created_at
`;

const fetchAppsQuery = gql`
  query FetchApps {
    app {
      ${appAttributes}
    }
  }
`;

const retrieveAppQuery = gql`
  query RetrieveApp($app_id: String!) {
    app(where: { id: { _eq: $app_id } }) {
      ${appAttributes}
    }
  }
`;

// const selectAppStatsQuery = gql`
// query SelectAppStats {
//   // FIXME
// }
// `;

// App store
export const useAppStore = create<IAppStore>((set) => ({
  apps: [] as AppModel[],
  currentApp: null,
  appStats: [] as AppStats[],
  setApps: (apps: AppModel[]) => set({ apps }),
  setCurrentApp: (currentApp: AppModel) => set({ currentApp }),
  setAppStats: (appStats: AppStats[]) => set({ appStats }),
  fetchApps: async () => {
    const response = await graphQLRequest<{ app: Array<AppModel> }>({
      query: fetchAppsQuery,
    });
    set({ apps: response.data?.app });
  },
  retrieveApp: async (app_id) => {
    const response = await graphQLRequest<{ app: Array<AppModel> }>({
      query: retrieveAppQuery,
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
