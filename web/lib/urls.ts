type SignupParams = {
  invite_id?: string;
};

export const urls = {
  app: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id || ""}`,

  apps: (params: { team_id: string }): string =>
    `/teams/${params.team_id}/apps`,

  configuration: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/configuration`,

  actions: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/actions`,

  worldId40: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/world-id-4-0`,

  enableWorldId40: (params: {
    team_id: string;
    app_id: string;
    next?: "configuration" | "actions";
  }): string => {
    const path = `/teams/${params.team_id}/apps/${params.app_id}/enable-world-id-4-0`;
    if (params.next) {
      return `${path}?next=${params.next}`;
    }
    return path;
  },

  configureSignerKey: (params: {
    team_id: string;
    app_id: string;
    next?: "configuration" | "actions";
  }): string => {
    const path = `/teams/${params.team_id}/apps/${params.app_id}/configure-signer-key`;
    if (params.next) {
      return `${path}?next=${params.next}`;
    }
    return path;
  },

  createTeam: (): "/create-team" => "/create-team",

  signInWorldId: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/sign-in-with-world-id`,

  signUp: (): "/signup" => "/signup",

  login: (params?: { invite_id: string }): string =>
    `/login${params?.invite_id ? `?invite_id=${params?.invite_id}` : ""}`,

  logout: (): "/api/auth/logout" => "/api/auth/logout",

  join: (params?: SignupParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/join?${searchParams.toString()}`;
  },

  joinCallback: (params: SignupParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/join-callback?${searchParams.toString()}`;
  },

  createAction: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/actions?createAction=true`,

  setup: (params: {
    team_id: string;
    app_id: string;
    language?: boolean;
  }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/profile/setup${params.language ? "#languages" : ""}`,

  teams: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}`,

  teamSettings: (params: { team_id: string }): string =>
    `/teams/${params.team_id}/settings`,

  profile: (): "/profile" => "/profile",
  profileTeams: (): "/profile/teams" => "/profile/teams",

  tos: (): "/tos" => "/tos",

  affiliateProgram: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}/affiliate-program`,

  affiliateProgramVerify: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}/affiliate-program/verify`,

  affiliateEarnings: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}/affiliate-program/earnings`,

  affiliateWithdrawal: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}/affiliate-program/withdraw`,

  affiliateHowItWorks: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}/affiliate-program/how-it-works`,

  affiliateRewards: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}/affiliate-program/how-it-works/rewards`,

  affiliateAccount: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}/affiliate-program/account`,

  unauthorized: (params?: { message: string }): string => {
    const searchParams = new URLSearchParams(params);
    return `/unauthorized?${searchParams.toString()}`;
  },

  privacyStatement: (): "/privacy-statement" => "/privacy-statement",

  api: {
    loginCallback: (params?: {
      invite_id?: string | null;
      returnTo?: string | null;
    }) => {
      const searchParams = new URLSearchParams();

      if (params?.invite_id) {
        searchParams.append("invite_id", params.invite_id);
      }

      if (params?.returnTo) {
        searchParams.append("returnTo", params.returnTo);
      }

      return `/api/auth/login-callback?${searchParams.toString()}`;
    },

    joinCallback: (): "/api/join-callback" => "/api/join-callback",

    authLogin: (params?: {
      invite_id?: string | null;
      returnTo?: string | null;
    }): string => {
      const searchParams = new URLSearchParams();

      if (params?.invite_id) {
        searchParams.append("invite_id", params.invite_id);
      }

      if (params?.returnTo) {
        searchParams.append("returnTo", params.returnTo);
      }

      return `/api/auth/login?${searchParams.toString()}`;
    },

    authDeleteAccount: (): "/api/auth/delete-account" =>
      "/api/auth/delete-account",
  },
};
