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

  miniAppPermissions: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/mini-app/permissions`,

  miniAppTransactions: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/mini-app/transactions`,

  miniAppNotifications: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/mini-app/notifications`,

  actions: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/actions`,

  worldId40: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/world-id-4-0`,

  worldIdActions: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/world-id-actions`,

  worldIdAction: (params: {
    team_id: string;
    app_id: string;
    action_id: string;
  }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/world-id-actions/${params.action_id}`,

  worldIdActionSettings: (params: {
    team_id: string;
    app_id: string;
    action_id: string;
  }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/world-id-actions/${params.action_id}/settings`,

  worldIdActionDanger: (params: {
    team_id: string;
    app_id: string;
    action_id: string;
  }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/world-id-actions/${params.action_id}/danger`,

  createTeam: (): "/create-team" => "/create-team",

  signInWorldId: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/sign-in-with-world-id`,

  signUp: (): "/signup" => "/signup",

  login: (params?: { invite_id: string }): string =>
    `/login${params?.invite_id ? `?invite_id=${params?.invite_id}` : ""}`,

  // v4 mounts /api/auth/logout via middleware; it honours a `returnTo` query
  // param for the post-logout landing page. Auth0's /v2/logout requires `returnTo`
  // to be an ABSOLUTE URL in the tenant's Allowed Logout URLs — unlike v3, the v4
  // SDK does NOT absolutise a relative path, so a bare "/login" is rejected (400).
  // Build the absolute `<app origin>/login` from NEXT_PUBLIC_APP_URL (build-inlined,
  // available on both server and client; `<origin>/login` is an Allowed Logout URL).
  logout: (): string =>
    `/api/auth/logout?returnTo=${encodeURIComponent(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`,
    )}`,

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
      // v4 mounts /api/auth/login via middleware; it honours a `returnTo` query
      // param and redirects there after the Auth0 callback completes. We point
      // that at the login-callback pipeline (Hasura sync + session enrichment),
      // forwarding invite_id and the originally requested deep link.
      const returnTo = urls.api.loginCallback({
        invite_id: params?.invite_id,
        returnTo: params?.returnTo,
      });

      const searchParams = new URLSearchParams({ returnTo });

      return `/api/auth/login?${searchParams.toString()}`;
    },

    authDeleteAccount: (): "/api/auth/delete-account" =>
      "/api/auth/delete-account",
  },
};
