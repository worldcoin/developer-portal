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

export type CustomAction = {
  id: string;
  max_verifications: number;
  max_accounts_per_user: number;
  name: string;
  description: string;
  nullifiers: Array<{
    id: string;
    nullifier_hash: string;
    created_at: string;
  }>;
};

export const customActions: Array<CustomAction> = [
  {
    id: "action_03d1265815a3fbf9c60dc8190f747e25",
    max_verifications: 0,
    max_accounts_per_user: 3,
    name: "ActionName#1",
    description: "ActionDescription#1",
    nullifiers: [
      {
        id: "nil_c4ba3e7369236be3e6fae0a9cfd78fd6",
        nullifier_hash: "abb0f298f870d3fed5e99f48f39c2708",
        created_at: "2023-02-25T17:12:50.512647+00:00",
      },
      {
        id: "nil_ef152ae9e54e87fea040d90157383090",
        nullifier_hash: "379cf37effbd986dd180ddeebce09f46",
        created_at: "2023-02-25T17:12:59.193268+00:00",
      },
      {
        id: "nil_8b22e78f54c646997d85c4d92aa24a02",
        nullifier_hash: "0437f84096288f0e5c4eba6b6a05d0c9",
        created_at: "2023-02-25T17:13:06.368691+00:00",
      },
      {
        id: "nil_11ae513afc87c950c9581acf4b430212",
        nullifier_hash: "11c3a37b56191c1f0187fb965b0eeaa9",
        created_at: "2023-02-25T17:13:18.160596+00:00",
      },
    ],
  },
  {
    id: "action_2e21f0993c85589c3d5ce2d5130aef2d",
    max_verifications: 0,
    max_accounts_per_user: 5,
    name: "ActionName#2",
    description: "ActionDescription#2",
    nullifiers: [
      {
        id: "nil_cb1d1c4d4599fc548fb34aae649663c2",
        nullifier_hash: "de23f117ff1ef3c30a177b81ed3cb94b",
        created_at: "2023-02-23T17:14:11.223677+00:00",
      },
      {
        id: "nil_1cac8f82bf679cc5eb6bfb08b3f6db27",
        nullifier_hash: "beaa2c3df4d1630509881c7e5b5a8f59",
        created_at: "2023-01-25T17:14:22.678401+00:00",
      },
      {
        id: "nil_066a5fb483f9e3bb202fbc8d48721ea5",
        nullifier_hash: "dc7f6e1763435345f557350987fb9e34",
        created_at: "2023-02-25T23:52",
      },
      {
        id: "nil_50ce658387caf3f7b2a77c4dfa5a9d76",
        nullifier_hash: "b58071f867b68af2bf3c5c4cdcdeeedf",
        created_at: "2023-02-25T17:14:31.193948+00:00",
      },
    ],
  },
  {
    id: "action_d2d5ae61b24719cf10d186d7a2b6c44f",
    max_verifications: 0,
    max_accounts_per_user: 0,
    name: "ActionName#3",
    description: "ActionDescription#3",
    nullifiers: [
      {
        id: "nil_08d01a22bdaf65c75fce6db4e48ea8d7",
        nullifier_hash: "4bc1a424dbad1da61511661e3476f71e",
        created_at: "2023-02-25T17:18:05.713314+00:00",
      },
      {
        id: "nil_e3efa9095b081cba8e1615f3b596f0a7",
        nullifier_hash: "26cbad9f99648a176011b6992d7ba8ac",
        created_at: "2023-02-25T17:18:10.007231+00:00",
      },
      {
        id: "nil_6235e7604752dbcae41df746480cc090",
        nullifier_hash: "e82273591ef68821419a7469216a12da",
        created_at: "2023-02-25T17:18:15.11773+00:00",
      },
      {
        id: "nil_bd295902d19278e5b71d0f718dbd936b",
        nullifier_hash: "803df91d2b0eeaca5c8bddad4c47aa85",
        created_at: "2023-02-25T17:18:22.519056+00:00",
      },
      {
        id: "nil_b16e52944c6e1fa7b4eb82864be26ab3",
        nullifier_hash: "606d00b08ca17a6e337a880beaa7d097",
        created_at: "2023-02-25T17:18:27.355162+00:00",
      },
    ],
  },
  {
    id: "action_cee3b9e3609648af99a268d53c5992b0",
    max_verifications: 0,
    max_accounts_per_user: 1,
    name: "ActionName#4",
    description: "ActionDescription#4",
    nullifiers: [],
  },
];
