// URLs for frontend pages

export const urls = {
  home: (): "/" => "/",
  apps: (): "/apps" => "/apps",
  app: (app_id: string): `/apps/${string}` => `/apps/${app_id}`,
  appNew: (): "/apps/new" => "/apps/new",
  actions: (): "/actions" => "/actions",

  action: (
    action_id: string,
    tab: string = "deployment"
  ): `/actions/${string}/${string}` => `/actions/${action_id}/${tab}`,

  actionNew: (): "/actions/new" => "/actions/new",
  actionsArchived: (): "/actions?show_archived=1" => "/actions?show_archived=1",

  hostedPage: (action_id: string): `/hosted/${string}` =>
    `/hosted/${action_id}`,

  kiosk: (action_id: string): `/kiosk/${string}` => `/kiosk/${action_id}`,
  team: (): "/team" => "/team",

  debugger: (): "/debugger" => "/debugger",
};
