type SignupParams = {
  invite_id?: string;
};

export const urls = {
  app: (params: { team_id: string; app_id?: string }): string =>
    `/teams/${params.team_id}/apps/${params.app_id || ""}`,

  createTeam: (params?: { invite_id: string }): string =>
    `/create-team${params?.invite_id ? `?invite_id=${params?.invite_id}` : ""}`,

  login: (): "/api/auth/login" => "/api/auth/login",

  logout: (): "/api/auth/logout" => "/api/auth/logout",

  join: (params?: SignupParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/join?${searchParams.toString()}`;
  },

  profile: (): "/profile" => "/profile",
};
