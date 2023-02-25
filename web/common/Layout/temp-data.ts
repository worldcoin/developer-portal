//FIXME: Temp data for testing

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
  total: number;
  total_cumulative: number;
};

export const stats: Record<string, Array<AppStats>> = {
  app_staging_58fcda7a3ec5dc181f91b46e1954a8fc: [
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-01",
      total: 1,
      total_cumulative: 1,
    },
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-02",
      total: 1,
      total_cumulative: 2,
    },
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-03",
      total: 1,
      total_cumulative: 3,
    },
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-04",
      total: 1,
      total_cumulative: 4,
    },
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-05",
      total: 1,
      total_cumulative: 5,
    },
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-06",
      total: 1,
      total_cumulative: 6,
    },
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-07",
      total: 1,
      total_cumulative: 7,
    },
    {
      app_id: "app_staging_58fcda7a3ec5dc181f91b46e1954a8fc",
      date: "2021-09-08",
      total: 1,
      total_cumulative: 8,
    },
  ],
  app_staging_6e234e0d37323ead3eaaffe1e898f6a0: [
    {
      app_id: "",
      date: "2021-09-01",
      total: 1,
      total_cumulative: 1,
    },
    {
      app_id: "",
      date: "2021-09-02",
      total: 1,
      total_cumulative: 2,
    },
    {
      app_id: "",
      date: "2021-09-03",
      total: 1,
      total_cumulative: 3,
    },
    {
      app_id: "",
      date: "2021-09-04",
      total: 1,
      total_cumulative: 4,
    },
    {
      app_id: "",
      date: "2021-09-05",
      total: 1,
      total_cumulative: 5,
    },
    {
      app_id: "",
      date: "2021-09-06",
      total: 1,
      total_cumulative: 6,
    },
    {
      app_id: "",
      date: "2021-09-07",
      total: 1,
      total_cumulative: 7,
    },
    {
      app_id: "",
      date: "2021-09-08",
      total: 1,
      total_cumulative: 8,
    },
  ],
};
