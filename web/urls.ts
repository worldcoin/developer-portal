// URLs for frontend pages

export const urls = {
  home: (): "/" => "/",
  app: (app_id: string): `/app/${string}` => `/app/${app_id}`,
  actions: (): "/actions" => "/actions",

  action: (
    action_id: string,
    tab: string = "deployment"
  ): `/actions/${string}/${string}` => `/actions/${action_id}/${tab}`,

  actionNew: (): "/actions/new" => "/actions/new",
  actionsArchived: (): "/actions?show_archived=1" => "/actions?show_archived=1",
  customActions: (): "/actions/custom" => "/actions/custom",
  dashboard: (): "/dashboard" => "/dashboard",

  hostedPage: (action_id: string): `/hosted/${string}` =>
    `/hosted/${action_id}`,

  kiosk: (action_id: string): `/kiosk/${string}` => `/kiosk/${action_id}`,
  login: (): "/login" => "/login",
  onboarding: (): "/onboarding" => "/onboarding",
  signup: (): "/signup" => "/signup",
  team: (): "/team" => "/team",
  debugger: (): "/debugger" => "/debugger",
};
