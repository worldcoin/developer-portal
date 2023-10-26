// URLs for frontend pages

type LogoutParams = {
  error?: boolean | string;
};

export const urls = {
  home: (): "/" => "/",

  // ANCHOR: Apps
  app: (app_id?: string): `/app/${string}` | "/app" =>
    app_id ? `/app/${app_id}` : "/app",
  appSignIn: (app_id?: string): `/app/${string}/sign-in` | "/app/sign-in" =>
    app_id ? `/app/${app_id}/sign-in` : "/app/sign-in",
  appActions: (app_id?: string): `/app/${string}/actions` | "/app/actions" =>
    app_id ? `/app/${app_id}/actions` : "/app/actions",

  // ANCHOR: Others
  kiosk: (action_id: string): `/kiosk/${string}` => `/kiosk/${action_id}`,
  debugger: (app_id: string): `/app/${string}/debugger` =>
    `/app/${app_id}/debugger`,
  team: (): "/team" => "/team",

  // ANCHOR: Authentication & sign up
  login: (): "/login" => "/login",

  logout: (params?: LogoutParams): string =>
    params?.error
      ? `/api/auth/logout?error=${params.error}`
      : "/api/auth/logout",

  signup: (): "/signup" => "/signup",
};
