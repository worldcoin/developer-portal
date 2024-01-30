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
  app: (props: {
    app_id?: string;
    team_id: string;
    params?: AppParams;
  }): string => {
    const baseUrl = props.app_id
      ? `${urls.team(props.team_id)}/app/${props.app_id}`
      : `${urls.team(props.team_id)}/app`;

    if (!props.params) {
      return baseUrl;
    }

    const searchParams = new URLSearchParams(props.params);
    return `${baseUrl}?${searchParams.toString()}`;
  },

  appSignIn: (params: {
    app_id?: string;
    team_id: string;
  }): `/team/${string}/app/${string}/sign-in` | `/team/${string}/app/sign-in` =>
    params.app_id
      ? `/team/${params.team_id}/app/${params.app_id}/sign-in`
      : `/team/${params.team_id}/app/sign-in`,

  appActions: (params: {
    app_id?: string;
    team_id: string;
  }): `/team/${string}/app/${string}/actions` | `/team/${string}/app/actions` =>
    params.app_id
      ? `/team/${params.team_id}/app/${params.app_id}/actions`
      : `/team/${params.team_id}/app/actions`,

  // ANCHOR: Others
  kiosk: (params: {
    action_id: string;
    team_id: string;
  }): `/team/${string}/kiosk/${string}` =>
    `/team/${params.team_id}/kiosk/${params.action_id}`,

  debugger: (params: {
    app_id: string;
    team_id: string;
  }): `/team/${string}/app/${string}/debugger` =>
    `/team/${params.team_id}/app/${params.app_id}/debugger`,

  team: (id?: string): string => (id ? `/team/${id}` : "/team"),

  // ANCHOR: Authentication & sign up
  login: (): "/login" => "/login",

  logout: (params?: LogoutParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/api/auth/logout?${searchParams.toString()}`;
  },

  signup: (params?: SignupParams): string => {
    const searchParams = new URLSearchParams(params);
    return `/signup?${searchParams.toString()}`;
  },
};
