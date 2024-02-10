type SignupParams = {
  invite_id?: string;
};

export const urls = {
  app: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id || ""}`,

  appProfile: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/profile`,

  actions: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/actions`,

  createTeam: (params?: { invite_id: string }): string =>
    `/create-team${params?.invite_id ? `?invite_id=${params?.invite_id}` : ""}`,

  signInWorldId: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/sign-in-with-world-id`,

  login: (): "/api/auth/login" => "/api/auth/login",

  logout: (): "/api/auth/logout" => "/api/auth/logout",

  join: (params?: SignupParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/join?${searchParams.toString()}`;
  },

  createAction: (params: { team_id: string; app_id: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id}/actions?createAction=true`,

  teams: (params: { team_id?: string }): string =>
    `/teams/${params.team_id ? params.team_id : ""}`,

  profile: (): "/profile" => "/profile",
};
