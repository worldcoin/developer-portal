//FIXME: Temp data for testing

import { randomUUID } from "crypto";

export type App = (typeof apps)[0];

export const apps = [
  {
    id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
    engine: "cloud",
    description_internal: "App Description",
    is_archived: false,
    is_verified: true,
    logo_url: `${process.env.NEXT_PUBLIC_APP_URL}/icons/polygon.svg`,
    is_staging: true,
    name: "Default App",
    status: "active",
  },
  {
    id: "app_staging_6e234e0d37323ead3eaaffe1e898f6a0",
    engine: "cloud",
    description_internal: "",
    is_archived: false,
    is_verified: false,
    logo_url: `${process.env.NEXT_PUBLIC_APP_URL}/icons/optimism.svg`,
    is_staging: true,
    name: "Login",
    status: "active",
  },
];

export type AppStats = {
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

export const stats: Record<string, Array<AppStats>> = {
  app_staging_58fcda7a3ec5dc181f91b46e1954a8fc: [
    {
      app_id: "",
      date: "2021-09-01",
      verifications: {
        total: 1,
        total_cumulative: 1,
      },
      unique_users: {
        total: 0,
        total_cumulative: 0,
      },
    },
    {
      app_id: "",
      date: "2021-09-02",
      verifications: {
        total: 3,
        total_cumulative: 4,
      },
      unique_users: {
        total: 6,
        total_cumulative: 6,
      },
    },
    {
      app_id: "",
      date: "2021-09-03",
      verifications: {
        total: 5,
        total_cumulative: 9,
      },
      unique_users: {
        total: 4,
        total_cumulative: 10,
      },
    },
    {
      app_id: "",
      date: "2021-09-04",
      verifications: {
        total: 6,
        total_cumulative: 14,
      },
      unique_users: {
        total: 1,
        total_cumulative: 11,
      },
    },
    {
      app_id: "",
      date: "2021-09-05",
      verifications: {
        total: 7,
        total_cumulative: 21,
      },
      unique_users: {
        total: 10,
        total_cumulative: 20,
      },
    },
    {
      app_id: "",
      date: "2021-09-06",
      verifications: {
        total: 15,
        total_cumulative: 36,
      },
      unique_users: {
        total: 2,
        total_cumulative: 22,
      },
    },
    {
      app_id: "",
      date: "2021-09-07",
      verifications: {
        total: 3,
        total_cumulative: 39,
      },
      unique_users: {
        total: 5,
        total_cumulative: 27,
      },
    },
    {
      app_id: "",
      date: "2021-09-08",
      verifications: {
        total: 1,
        total_cumulative: 40,
      },
      unique_users: {
        total: 6,
        total_cumulative: 33,
      },
    },
  ],
  app_staging_6e234e0d37323ead3eaaffe1e898f6a0: [
    {
      app_id: "",
      date: "2021-09-01",
      verifications: {
        total: 1,
        total_cumulative: 1,
      },
      unique_users: {
        total: 1,
        total_cumulative: 1,
      },
    },
    {
      app_id: "",
      date: "2021-09-02",
      verifications: {
        total: 1,
        total_cumulative: 2,
      },
      unique_users: {
        total: 1,
        total_cumulative: 2,
      },
    },
    {
      app_id: "",
      date: "2021-09-03",
      verifications: {
        total: 1,
        total_cumulative: 3,
      },
      unique_users: {
        total: 1,
        total_cumulative: 3,
      },
    },
    {
      app_id: "",
      date: "2021-09-04",
      verifications: {
        total: 1,
        total_cumulative: 4,
      },
      unique_users: {
        total: 1,
        total_cumulative: 4,
      },
    },
    {
      app_id: "",
      date: "2021-09-05",
      verifications: {
        total: 1,
        total_cumulative: 5,
      },
      unique_users: {
        total: 1,
        total_cumulative: 5,
      },
    },
    {
      app_id: "",
      date: "2021-09-06",
      verifications: {
        total: 1,
        total_cumulative: 6,
      },
      unique_users: {
        total: 1,
        total_cumulative: 6,
      },
    },
    {
      app_id: "",
      date: "2021-09-07",
      verifications: {
        total: 1,
        total_cumulative: 7,
      },
      unique_users: {
        total: 1,
        total_cumulative: 7,
      },
    },
    {
      app_id: "",
      date: "2021-09-08",
      verifications: {
        total: 1,
        total_cumulative: 8,
      },
      unique_users: {
        total: 1,
        total_cumulative: 8,
      },
    },
  ],
};

export type SignInAction = (typeof signInActions)[string];

export const signInActions = {
  [apps[0].id]: {
    app_id: apps[0].id,
    client_secret: "8923765612389571928374981237489123",
    client_secret_seen_once: true,
    enabled: true,

    redirect: {
      uri: [
        "https://world.id/api/auth/callback",
        "https://world.id/api/auth/callback-2",
      ],
      default: "https://world.id/api/auth/callback",
    },

    default_auth_link: "",
  },
  [apps[1].id]: {
    app_id: apps[1].id,
    client_secret: "14950656123895719283749812377548950",
    client_secret_seen_once: true,
    enabled: false,

    redirect: {
      uri: [],
      default: null,
    },

    default_auth_link: "",
  },
};

export const tempTeam = {
  name: "Team 1",

  members: [
    {
      image: "",
      name: "Steven Wilks",
      email: "steven.w34s@email.com",
      verified: true,
    },
    {
      image: "",
      name: "Christina Goldsmith",
      email: "christina.goldsmith@email.com",
      verified: true,
    },
    {
      image: "",
      name: "Bessie Cooper",
      email: "bess.cooper@email.com",
      verified: false,
    },
    {
      image: "",
      name: "Esther Howard",
      email: "esther.h@email.com",
      verified: true,
    },
    {
      image: "",
      name: "Darlene Robertson",
      email: "darlene.robertson@email.com",
      verified: false,
    },
  ],
};
