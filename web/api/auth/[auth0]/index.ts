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

    return handleLogin(req, ctx, {
      returnTo: urls.api.loginCallback({ invite_id, returnTo }),
    });
  },

  callback: handleCallback,
  "login-callback": loginCallback,
  // TODO: Add delete account handler

  logout: handleLogout({
    returnTo: urls.login(),
  }),

  onError: (_req: NextRequest, error: HandlerError) => {
    NextResponse.json({
      status: error.status || 500,
      message: "Error while authenticating",
    });
  },
});
