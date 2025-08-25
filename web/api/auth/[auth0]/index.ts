import { deleteAccount } from "@/api/delete-account";
import { getAppUrlFromRequest } from "@/api/helpers/utils";
import { loginCallback } from "@/api/login-callback";
import { urls } from "@/lib/urls";

import {
  AppRouteHandlerFnContext,
  HandlerError,
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
} from "@auth0/nextjs-auth0";

import { NextRequest, NextResponse } from "next/server";

export const GET = handleAuth({
  login: (req: NextRequest, ctx: AppRouteHandlerFnContext) => {
    const invite_id = req.nextUrl.searchParams.get("invite_id") ?? undefined;
    const returnTo = req.nextUrl.searchParams.get("returnTo") ?? undefined;
    const appUrl = getAppUrlFromRequest(req);
    const redirect_uri = new URL("/api/auth/callback", appUrl).toString();
    const authReturnTo = new URL(
      urls.api.loginCallback({ invite_id, returnTo }),
      appUrl,
    ).toString();

    return handleLogin(req, ctx, {
      returnTo: authReturnTo,
      authorizationParams: {
        redirect_uri: redirect_uri,
      },
    });
  },

  callback: (req: NextRequest, ctx: AppRouteHandlerFnContext) => {
    const appUrl = getAppUrlFromRequest(req);
    const redirect_uri = new URL("/api/auth/callback", appUrl).toString();

    return handleCallback(req, ctx, {
      authorizationParams: {
        redirect_uri: redirect_uri,
      },
      redirectUri: redirect_uri,
    });
  },

  "login-callback": loginCallback,
  "delete-account": deleteAccount,

  logout: (req: NextRequest, ctx: AppRouteHandlerFnContext) => {
    const appUrl = getAppUrlFromRequest(req);
    const logoutReturnTo = new URL(urls.login(), appUrl).toString();
    return handleLogout(req, ctx, {
      returnTo: logoutReturnTo,
    });
  },

  onError: (_req: NextRequest, error: HandlerError) => {
    NextResponse.json({
      status: error.status || 500,
      message: "Error while authenticating",
    });
  },
});
