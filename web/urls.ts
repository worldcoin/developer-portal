// URLs for frontend pages

export const urls = {
  home: (): "/" => "/",
  app: (): `/app` => `/app`,
  actions: (route: string): `/actions/${string}` => `/actions/${route}`,

  hostedPage: (action_id: string): `/hosted/${string}` =>
    `/hosted/${action_id}`,

  kiosk: (action_id: string): `/kiosk/${string}` => `/kiosk/${action_id}`,
  login: (): "/login" => "/login",
  logout: (): "/logout" => "/logout",
  waitlist: (): "/waitlist" => "/waitlist",
  signup: (): "/signup" => "/signup",
  team: (): "/team" => "/team",
  debugger: (): "/debugger" => "/debugger",
};
