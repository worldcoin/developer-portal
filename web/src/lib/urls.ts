// URLs for frontend pages

import { LoginErrorCode } from "./types";

type LoginError = {
  login_error: LoginErrorCode;
};

type LogoutParams = LoginError & {};

type SignupParams = {
  invite_id?: string;
};

type AppParams = LoginError & {};

export const urls = {
  home: (): "/" => "/",

  // ANCHOR: Apps
  app: (app_id?: string, params?: AppParams): string => {
    const baseUrl = app_id ? `/app/${app_id}` : "/app";

    if (!params) {
      return baseUrl;
    }

    const searchParams = new URLSearchParams(params);
    return `${baseUrl}?${searchParams.toString()}`;
  },

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

  logout: (params?: LogoutParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/logout?${searchParams.toString()}`;
  },

  signup: (params?: SignupParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/signup?${searchParams.toString()}`;
  },
};
