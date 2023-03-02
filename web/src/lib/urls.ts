// URLs for frontend pages

export const urls = {
  home: (): "/" => "/",

  // ANCHOR: Apps
  app: (app_id?: string): `/app/${string}` | "/app" =>
    app_id ? `/app/${app_id}` : "/app",
  appSignIn: (app_id: string): `/app/${string}/sign-in` =>
    `/app/${app_id}/sign-in`,
  appActions: (app_id: string): `/app/${string}/actions` =>
    `/app/${app_id}/actions`,

  // ANCHOR: Others
  kiosk: (action_id: string): `/kiosk/${string}` => `/kiosk/${action_id}`,
  debugger: (): "/debugger" => "/debugger",
  team: (): "/team" => "/team",

  // ANCHOR: Authentication & sign up
  login: (): "/login" => "/login",
  logout: (): "/logout" => "/logout",
  signup: (): "/signup" => "/signup",
};
